-- Script to change user id from BigInt to String (UUID)
-- WARNING: This will delete all existing data in user-related tables

-- Drop foreign key constraints first
ALTER TABLE user_customer_mappings DROP CONSTRAINT IF EXISTS user_customer_mappings_user_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_id_fkey;

-- Delete existing data (since we're changing the type)
DELETE FROM invitations;
DELETE FROM workspace_members;
DELETE FROM sessions;
DELETE FROM profiles;
DELETE FROM user_customer_mappings;
DELETE FROM users;

-- Alter the users table id column
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE users ADD PRIMARY KEY (id);

-- Alter all foreign key columns
ALTER TABLE user_customer_mappings ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE profiles ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE workspace_members ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE invitations ALTER COLUMN invited_by_id TYPE VARCHAR(255);

-- Recreate foreign key constraints
ALTER TABLE user_customer_mappings 
  ADD CONSTRAINT user_customer_mappings_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE profiles 
  ADD CONSTRAINT profiles_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sessions 
  ADD CONSTRAINT sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workspace_members 
  ADD CONSTRAINT workspace_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE invitations 
  ADD CONSTRAINT invitations_invited_by_id_fkey 
  FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE;