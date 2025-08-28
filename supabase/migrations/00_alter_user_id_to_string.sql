-- Migration: Change user id from BigInt to VARCHAR(255) for Supabase Auth compatibility
-- WARNING: This migration will ALTER the users table structure
-- Make sure to backup your data before running this

-- First, check if we need to make this change
DO $$
BEGIN
  -- Only proceed if the id column is still bigint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id' 
    AND data_type = 'bigint'
  ) THEN
    
    -- Drop foreign key constraints that reference users.id
    ALTER TABLE user_customer_mappings DROP CONSTRAINT IF EXISTS user_customer_mappings_user_id_fkey;
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
    ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
    
    -- Remove primary key constraint
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
    
    -- Change the column type - this will fail if there's data in the table
    -- that can't be converted. Since we're going from bigint to varchar,
    -- existing numeric IDs will be converted to strings
    ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR(255);
    
    -- Re-add primary key constraint
    ALTER TABLE users ADD PRIMARY KEY (id);
    
    -- Change foreign key columns in related tables
    ALTER TABLE user_customer_mappings ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
    ALTER TABLE profiles ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
    ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
    
    -- Re-create foreign key constraints
    ALTER TABLE user_customer_mappings 
      ADD CONSTRAINT user_customer_mappings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE profiles 
      ADD CONSTRAINT profiles_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    ALTER TABLE sessions 
      ADD CONSTRAINT sessions_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Successfully converted users.id from bigint to varchar(255)';
  ELSE
    RAISE NOTICE 'users.id is already varchar, skipping conversion';
  END IF;
END $$;