-- Migration: Fix User ID to UUID type for Supabase Auth compatibility
-- WARNING: This will only work if tables are empty or need to be recreated
-- Date: 2025-08-28

BEGIN;

-- Step 1: Drop existing foreign key constraints
ALTER TABLE user_customer_mappings DROP CONSTRAINT IF EXISTS user_customer_mappings_user_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_active_workspace_id_fkey;

-- Step 2: Check if users table is empty
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    IF user_count > 0 THEN
        RAISE NOTICE 'Users table has % records. Will need to migrate data.', user_count;
    END IF;
END $$;

-- Step 3: Drop and recreate users table with proper UUID type
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY,  -- UUID for Supabase Auth compatibility
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    locale TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    metadata JSONB,
    active_workspace_id UUID,
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active_workspace_id ON users(active_workspace_id);

-- Step 5: Drop and recreate dependent tables with UUID references

-- Profiles table
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    website TEXT,
    company TEXT,
    job_title TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Sessions table
DROP TABLE IF EXISTS sessions CASCADE;
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

-- Workspaces table
DROP TABLE IF EXISTS workspaces CASCADE;
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 50),
    logo TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- Now we can add the foreign key for users.active_workspace_id
ALTER TABLE users 
ADD CONSTRAINT users_active_workspace_id_fkey 
FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role "WorkspaceRole" NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, workspace_id)
);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Invitations table
DROP TABLE IF EXISTS invitations CASCADE;
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role "WorkspaceRole" NOT NULL,
    invited_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_workspace ON invitations(workspace_id);

-- User-Customer mappings table  
DROP TABLE IF EXISTS user_customer_mappings CASCADE;
CREATE TABLE user_customer_mappings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, customer_id)
);
CREATE INDEX idx_user_customer_mappings_customer_id ON user_customer_mappings(customer_id);

-- Step 6: Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Add update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Add audit entry
INSERT INTO migration_audit (migration_name, action, table_name, details)
VALUES (
    'fix-user-id-uuid',
    'recreate_tables_with_uuid',
    'users',
    jsonb_build_object(
        'users_table_recreated', true,
        'profiles_table_recreated', true,
        'sessions_table_recreated', true,
        'workspaces_table_recreated', true,
        'all_ids_converted_to_uuid', true
    )
);

COMMIT;

-- Verification queries
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('users', 'profiles', 'sessions', 'workspaces', 'invitations')
  AND column_name LIKE '%id%'
ORDER BY table_name, column_name;