-- Complete Multi-tenancy Tables Creation Script
-- This script creates all necessary tables for multi-tenancy support
-- including the users table with TEXT id for Supabase Auth UUIDs

BEGIN;

-- Step 1: Create users table FIRST (required by other tables)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    locale TEXT DEFAULT 'pt-BR',
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    metadata JSONB,
    active_workspace_id TEXT,
    last_active_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active_workspace_id ON users(active_workspace_id);

-- Step 2: Create WorkspaceRole enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspacerole') THEN
        CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member');
    END IF;
END $$;

-- Step 3: Create workspaces table (needed by workspace_members and invitations)
CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 50),
    logo TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);

-- Step 4: Now we can add the foreign key for users.active_workspace_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_name = 'users_active_workspace_id_fkey'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_active_workspace_id_fkey 
        FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Step 5: Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Step 6: Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    website TEXT,
    company TEXT,
    job_title TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Step 7: Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role "WorkspaceRole" NOT NULL,
    joined_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);

-- Step 8: Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role "WorkspaceRole" NOT NULL,
    invited_by_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_workspace ON invitations(workspace_id);

-- Step 9: Update user_customer_mappings if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') THEN
        -- Check if user_id is still BIGINT
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_customer_mappings' 
            AND column_name = 'user_id'
            AND data_type = 'bigint'
        ) THEN
            -- Drop existing constraint
            ALTER TABLE user_customer_mappings DROP CONSTRAINT IF EXISTS user_customer_mappings_user_id_fkey;
            
            -- Alter column type
            ALTER TABLE user_customer_mappings 
            ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
            
            -- Re-add foreign key
            ALTER TABLE user_customer_mappings 
            ADD CONSTRAINT user_customer_mappings_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Step 10: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Add updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workspaces_updated_at ON workspaces;
CREATE TRIGGER update_workspaces_updated_at 
BEFORE UPDATE ON workspaces
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Verify tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'sessions', 'profiles', 'workspaces', 'workspace_members', 'invitations');
    
    IF table_count = 6 THEN
        RAISE NOTICE 'All 6 multi-tenancy tables created successfully!';
    ELSE
        RAISE NOTICE 'Only % of 6 tables were created', table_count;
    END IF;
END $$;

-- Step 13: Display final state
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('users', 'sessions', 'profiles', 'workspaces', 'workspace_members', 'invitations')
AND column_name IN ('id', 'user_id', 'active_workspace_id', 'invited_by_id')
ORDER BY table_name, column_name;

-- Step 14: Log migration (if migration_audit table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_audit') THEN
        INSERT INTO migration_audit (migration_name, action, details)
        VALUES (
            'create_multitenancy_tables',
            'migration_complete',
            jsonb_build_object(
                'users_table_created', true,
                'sessions_table_created', true,
                'profiles_table_created', true,
                'workspaces_table_created', true,
                'workspace_members_table_created', true,
                'invitations_table_created', true,
                'timestamp', CURRENT_TIMESTAMP
            )
        );
    END IF;
END $$;

COMMIT;

-- Success message
SELECT 'Migration completed successfully! All multi-tenancy tables have been created.' as status;