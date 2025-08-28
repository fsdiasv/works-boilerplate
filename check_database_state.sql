-- Diagnostic script to check the current state of the database
-- Run this to understand what's happening with the users table

-- 1. Check the data type of users.id
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'id';

-- 2. Check if there's any data in the users table
SELECT COUNT(*) as user_count FROM users;

-- 3. Check existing tables that might reference users
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE column_name IN ('user_id', 'invited_by_id')
AND table_schema = 'public'
ORDER BY table_name;

-- 4. Check existing foreign key constraints referencing users
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- 5. Check if workspace tables already exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('workspaces', 'workspace_members', 'invitations')
AND table_schema = 'public';

-- 6. Check for any existing workspace_role type
SELECT typname 
FROM pg_type 
WHERE typname = 'workspace_role';