-- Simple ALTER to change users.id from BIGINT to VARCHAR(255)
-- This version tries to alter in place without recreating the table

BEGIN;

-- Step 1: Show current state
SELECT 
    'Current users.id type' as description,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'id';

-- Step 2: Drop all foreign key constraints pointing to users.id
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT
            tc.table_name, 
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'users'
    )
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped constraint % from %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- Step 3: Drop primary key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- Step 4: Alter the column type
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::VARCHAR(255);

-- Step 5: Re-add primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- Step 6: Update related tables
DO $$
BEGIN
    -- user_customer_mappings
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_customer_mappings' 
        AND column_name = 'user_id'
        AND data_type = 'bigint'
    ) THEN
        ALTER TABLE user_customer_mappings 
        ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        RAISE NOTICE 'Updated user_customer_mappings.user_id';
    END IF;

    -- sessions
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sessions' 
        AND column_name = 'user_id'
        AND data_type = 'bigint'
    ) THEN
        ALTER TABLE sessions 
        ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        RAISE NOTICE 'Updated sessions.user_id';
    END IF;

    -- profiles
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'user_id'
        AND data_type = 'bigint'
    ) THEN
        ALTER TABLE profiles 
        ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        RAISE NOTICE 'Updated profiles.user_id';
    END IF;
END $$;

-- Step 7: Re-create foreign key constraints
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') THEN
        ALTER TABLE user_customer_mappings 
        ADD CONSTRAINT user_customer_mappings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 8: Verify
SELECT 
    'After conversion' as description,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'id';

COMMIT;

-- Now you can run the multi-tenancy migration!