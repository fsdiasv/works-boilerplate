-- Migration: Change user id from BigInt to VARCHAR(255) for Supabase Auth compatibility
-- SAFE VERSION: Checks for table existence before attempting alterations
-- WARNING: This migration will ALTER the users table structure
-- Make sure to backup your data before running this

-- First, check if we need to make this change
DO $$
DECLARE
  v_data_type text;
BEGIN
  -- Check the current data type of users.id
  SELECT data_type INTO v_data_type
  FROM information_schema.columns 
  WHERE table_name = 'users' 
  AND column_name = 'id';
  
  -- Only proceed if the id column is still bigint
  IF v_data_type = 'bigint' THEN
    RAISE NOTICE 'Converting users.id from bigint to varchar(255)...';
    
    -- Drop foreign key constraints that reference users.id (only if tables exist)
    
    -- Check and drop user_customer_mappings constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') THEN
      ALTER TABLE user_customer_mappings DROP CONSTRAINT IF EXISTS user_customer_mappings_user_id_fkey;
      RAISE NOTICE 'Dropped constraint from user_customer_mappings';
    END IF;
    
    -- Check and drop profiles constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
      ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
      RAISE NOTICE 'Dropped constraint from profiles';
    END IF;
    
    -- Check and drop sessions constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
      ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
      RAISE NOTICE 'Dropped constraint from sessions';
    END IF;
    
    -- Check and drop workspace_members constraint (might exist from previous attempts)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_members') THEN
      ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
      RAISE NOTICE 'Dropped constraint from workspace_members';
    END IF;
    
    -- Check and drop invitations constraint (might exist from previous attempts)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
      ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_id_fkey;
      RAISE NOTICE 'Dropped constraint from invitations';
    END IF;
    
    -- Remove primary key constraint
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
    RAISE NOTICE 'Dropped primary key constraint';
    
    -- Change the column type
    ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR(255);
    RAISE NOTICE 'Changed users.id to varchar(255)';
    
    -- Re-add primary key constraint
    ALTER TABLE users ADD PRIMARY KEY (id);
    RAISE NOTICE 'Re-added primary key constraint';
    
    -- Change foreign key columns in related tables (only if they exist)
    
    -- Update user_customer_mappings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') THEN
      ALTER TABLE user_customer_mappings ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
      ALTER TABLE user_customer_mappings 
        ADD CONSTRAINT user_customer_mappings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Updated user_customer_mappings.user_id';
    END IF;
    
    -- Update profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
      ALTER TABLE profiles ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
      ALTER TABLE profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Updated profiles.user_id';
    END IF;
    
    -- Update sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
      ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
      ALTER TABLE sessions 
        ADD CONSTRAINT sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      RAISE NOTICE 'Updated sessions.user_id';
    END IF;
    
    -- Update workspace_members if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_members') THEN
      -- Check if user_id column exists and is bigint
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workspace_members' 
        AND column_name = 'user_id'
        AND data_type = 'bigint'
      ) THEN
        ALTER TABLE workspace_members ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        ALTER TABLE workspace_members 
          ADD CONSTRAINT workspace_members_user_id_fkey 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Updated workspace_members.user_id';
      END IF;
    END IF;
    
    -- Update invitations if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations') THEN
      -- Check if invited_by_id column exists and is bigint
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invitations' 
        AND column_name = 'invited_by_id'
        AND data_type = 'bigint'
      ) THEN
        ALTER TABLE invitations ALTER COLUMN invited_by_id TYPE VARCHAR(255) USING invited_by_id::VARCHAR(255);
        ALTER TABLE invitations 
          ADD CONSTRAINT invitations_invited_by_id_fkey 
          FOREIGN KEY (invited_by_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Updated invitations.invited_by_id';
      END IF;
    END IF;
    
    RAISE NOTICE 'Successfully converted users.id from bigint to varchar(255)';
  ELSIF v_data_type = 'character varying' THEN
    RAISE NOTICE 'users.id is already varchar, skipping conversion';
  ELSE
    RAISE NOTICE 'users.id has unexpected type: %, manual intervention may be required', v_data_type;
  END IF;
END $$;

-- Also update active_workspace_id if it exists as bigint (should be UUID)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'active_workspace_id'
    AND data_type = 'bigint'
  ) THEN
    -- Drop the column if it's bigint (wrong type)
    ALTER TABLE users DROP COLUMN IF EXISTS active_workspace_id;
    RAISE NOTICE 'Dropped incorrect active_workspace_id column (was bigint)';
  END IF;
END $$;