-- Migration: Add multi-tenancy support (STRUCTURE ONLY - No data changes)
-- Description: Adds workspace, workspace_member, and invitation tables for multi-tenancy
-- IMPORTANT: This version is compatible with users.id as VARCHAR(255) instead of UUID
-- IMPORTANT: This migration only creates structure, does NOT insert or modify any data

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 50),
  logo TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_workspace_slug ON workspaces(slug);

-- Create workspace roles enum if not exists
DO $$ BEGIN
  CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create workspace_members junction table
CREATE TABLE IF NOT EXISTS workspace_members (
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role workspace_role NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, workspace_id)
);

-- Create indexes for workspace_members
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role workspace_role NOT NULL,
  invited_by_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON invitations(workspace_id);

-- Add workspace fields to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'active_workspace_id') THEN
    ALTER TABLE users ADD COLUMN active_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'last_active_at') THEN
    ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to workspaces if not exists
DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners and admins can update workspaces" ON workspaces;
DROP POLICY IF EXISTS "Owners can delete workspaces" ON workspaces;
DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace creation adds owner" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Owners can update member roles" ON workspace_members;
DROP POLICY IF EXISTS "Owners and admins can remove members" ON workspace_members;
DROP POLICY IF EXISTS "Users can view workspace invitations" ON invitations;
DROP POLICY IF EXISTS "Owners and admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Inviters can update their invitations" ON invitations;
DROP POLICY IF EXISTS "Owners and admins can delete invitations" ON invitations;

-- RLS Policies for workspaces
-- Users can only see workspaces they're members of
CREATE POLICY "Users can view their workspaces" ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
    )
  );

-- Users can create workspaces (they become owner)
CREATE POLICY "Users can create workspaces" ON workspaces
  FOR INSERT
  WITH CHECK (true);

-- Only owners and admins can update workspaces
CREATE POLICY "Owners and admins can update workspaces" ON workspaces
  FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
      AND role IN ('owner', 'admin')
    )
  );

-- Only owners can delete workspaces
CREATE POLICY "Owners can delete workspaces" ON workspaces
  FOR DELETE
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
      AND role = 'owner'
    )
  );

-- RLS Policies for workspace_members
-- Users can see members of their workspaces
CREATE POLICY "Users can view workspace members" ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
    )
  );

-- Workspace creation automatically adds owner
CREATE POLICY "Workspace creation adds owner" ON workspace_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()::VARCHAR(255) AND role = 'owner'
  );

-- Only owners and admins can add members
CREATE POLICY "Owners and admins can add members" ON workspace_members
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
      AND role IN ('owner', 'admin')
    )
    AND user_id != auth.uid()::VARCHAR(255) -- Can't add yourself
  );

-- Only owners can change roles
CREATE POLICY "Owners can update member roles" ON workspace_members
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
      AND role = 'owner'
    )
  );

-- Only owners and admins can remove members (except owners)
CREATE POLICY "Owners and admins can remove members" ON workspace_members
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
      AND role IN ('owner', 'admin')
    )
    AND role != 'owner' -- Can't remove owners
  );

-- RLS Policies for invitations
-- Users can see invitations for their workspaces
CREATE POLICY "Users can view workspace invitations" ON invitations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
    )
    OR email = auth.jwt()->>'email' -- Or invitations sent to their email
  );

-- Only owners and admins can create invitations
CREATE POLICY "Owners and admins can create invitations" ON invitations
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
      AND role IN ('owner', 'admin')
    )
    AND invited_by_id = auth.uid()::VARCHAR(255)
  );

-- Only the inviter can update invitations
CREATE POLICY "Inviters can update their invitations" ON invitations
  FOR UPDATE
  USING (invited_by_id = auth.uid()::VARCHAR(255));

-- Only owners and admins can delete invitations
CREATE POLICY "Owners and admins can delete invitations" ON invitations
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()::VARCHAR(255)
      AND role IN ('owner', 'admin')
    )
  );

-- Helper functions for workspace operations
-- Check if user is a member of workspace
CREATE OR REPLACE FUNCTION is_workspace_member(workspace_id UUID, user_id VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM workspace_members 
    WHERE workspace_members.workspace_id = $1 
    AND workspace_members.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user role in workspace
CREATE OR REPLACE FUNCTION get_user_role(workspace_id UUID, user_id VARCHAR(255))
RETURNS workspace_role AS $$
DECLARE
  user_role workspace_role;
BEGIN
  SELECT role INTO user_role
  FROM workspace_members 
  WHERE workspace_members.workspace_id = $1 
  AND workspace_members.user_id = $2;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage workspace
CREATE OR REPLACE FUNCTION can_manage_workspace(workspace_id UUID, user_id VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
  user_role workspace_role;
BEGIN
  user_role := get_user_role($1, $2);
  RETURN user_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default workspace for new users
-- NOTE: This function is created but NOT triggered automatically
-- It can be called manually when needed
CREATE OR REPLACE FUNCTION create_default_workspace_for_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
  workspace_name TEXT;
  workspace_slug TEXT;
BEGIN
  -- Generate workspace name and slug
  workspace_name := COALESCE(NEW.full_name, NEW.email) || '''s Workspace';
  workspace_slug := LOWER(REGEXP_REPLACE(COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)), '[^a-z0-9]+', '-', 'g')) || '-' || LEFT(REPLACE(NEW.id::TEXT, '-', ''), 8);
  
  -- Create workspace
  INSERT INTO workspaces (name, slug)
  VALUES (workspace_name, workspace_slug)
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner
  INSERT INTO workspace_members (user_id, workspace_id, role)
  VALUES (NEW.id, new_workspace_id, 'owner');
  
  -- Set as active workspace
  UPDATE users 
  SET active_workspace_id = new_workspace_id 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NOTE: The trigger below is commented out to prevent automatic data creation
-- Uncomment if you want new users to automatically get a workspace
/*
DROP TRIGGER IF EXISTS create_default_workspace ON users;
CREATE TRIGGER create_default_workspace
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_workspace_for_user();
*/

-- Comments for documentation
COMMENT ON TABLE workspaces IS 'Stores workspace information for multi-tenancy';
COMMENT ON TABLE workspace_members IS 'Junction table linking users to workspaces with roles';
COMMENT ON TABLE invitations IS 'Stores pending workspace invitations';
COMMENT ON COLUMN workspaces.slug IS 'URL-friendly unique identifier for the workspace';
COMMENT ON COLUMN workspaces.deleted_at IS 'Soft delete timestamp for data retention';
COMMENT ON TYPE workspace_role IS 'Role hierarchy: owner > admin > member';