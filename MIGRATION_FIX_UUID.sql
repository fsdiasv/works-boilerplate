-- =====================================================
-- MIGRATION: Convert User IDs from BIGSERIAL to UUID
-- Date: 2025-08-28
-- WARNING: This migration will DROP and RECREATE tables
-- MAKE SURE TO BACKUP YOUR DATABASE FIRST!
-- =====================================================

-- Command to backup (run this first in your terminal):
-- pg_dump YOUR_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

BEGIN;

-- =====================================================
-- STEP 1: Check if we have data that needs to be preserved
-- =====================================================
DO $$
DECLARE
    user_count INTEGER;
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO customer_count FROM customers;
    
    IF user_count > 0 THEN
        RAISE NOTICE '⚠️  WARNING: Users table has % records that will be DELETED', user_count;
    END IF;
    
    IF customer_count > 0 THEN
        RAISE NOTICE '✅ Customers table has % records (will be preserved)', customer_count;
    END IF;
END $$;

-- =====================================================
-- STEP 2: Drop all dependent objects first
-- =====================================================
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_customer_mappings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- =====================================================
-- STEP 3: Ensure WorkspaceRole enum exists
-- =====================================================
DO $$ 
BEGIN
    -- Check both lowercase and exact case
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspacerole' OR typname = 'WorkspaceRole') THEN
        CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member');
    ELSE
        RAISE NOTICE 'WorkspaceRole enum already exists, skipping creation';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'WorkspaceRole enum already exists (caught exception), continuing...';
END $$;

-- =====================================================
-- STEP 4: Create users table with UUID
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY,  -- UUID for Supabase Auth
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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active_workspace_id ON users(active_workspace_id);

-- =====================================================
-- STEP 5: Create workspaces table with UUID
-- =====================================================
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
    slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 3 AND char_length(slug) <= 50),
    logo TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX workspaces_slug_idx ON workspaces(slug);

-- Add foreign key for users.active_workspace_id
ALTER TABLE users 
ADD CONSTRAINT users_active_workspace_id_fkey 
FOREIGN KEY (active_workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 6: Create profiles table with UUID
-- =====================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    website TEXT,
    company TEXT,
    job_title TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX profiles_user_id_idx ON profiles(user_id);

-- =====================================================
-- STEP 7: Create sessions table with UUID
-- =====================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_token_idx ON sessions(token);

-- =====================================================
-- STEP 8: Create workspace_members table
-- =====================================================
CREATE TABLE workspace_members (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role "WorkspaceRole" NOT NULL,
    joined_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, workspace_id)
);

CREATE INDEX workspace_members_workspace_id_idx ON workspace_members(workspace_id);
CREATE INDEX workspace_members_user_id_idx ON workspace_members(user_id);

-- =====================================================
-- STEP 9: Create invitations table with UUID
-- =====================================================
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role "WorkspaceRole" NOT NULL,
    invited_by_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX invitations_token_idx ON invitations(token);
CREATE INDEX invitations_email_idx ON invitations(email);
CREATE INDEX invitations_workspace_id_idx ON invitations(workspace_id);

-- =====================================================
-- STEP 10: Create user_customer_mappings table
-- =====================================================
CREATE TABLE user_customer_mappings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, customer_id)
);

CREATE INDEX idx_user_customer_mappings_customer_id ON user_customer_mappings(customer_id);

-- =====================================================
-- STEP 11: Create/update migration_audit table
-- =====================================================
CREATE TABLE IF NOT EXISTS migration_audit (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_count INTEGER,
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- STEP 12: Create updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 13: Add updated_at triggers
-- =====================================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 14: Record migration in audit table
-- =====================================================
INSERT INTO migration_audit (migration_name, action, table_name, details)
VALUES (
    'fix-user-id-uuid',
    'recreate_tables_with_uuid',
    'users',
    jsonb_build_object(
        'migration_date', CURRENT_TIMESTAMP,
        'users_table_recreated', true,
        'profiles_table_recreated', true,
        'sessions_table_recreated', true,
        'workspaces_table_recreated', true,
        'invitations_table_recreated', true,
        'all_ids_converted_to_uuid', true
    )
);

COMMIT;

-- =====================================================
-- VERIFICATION: Check the results
-- =====================================================
SELECT 
    'Table: ' || table_name || ', Column: ' || column_name || ', Type: ' || data_type as structure
FROM information_schema.columns
WHERE table_name IN ('users', 'profiles', 'sessions', 'workspaces', 'invitations')
  AND column_name LIKE '%id%'
ORDER BY table_name, column_name;

-- =====================================================
-- POST-MIGRATION STEPS:
-- =====================================================
-- 1. Run: pnpm prisma generate
-- 2. Test signup flow
-- 3. If everything works, run: pnpm prisma migrate resolve --applied "fix_user_id_uuid"