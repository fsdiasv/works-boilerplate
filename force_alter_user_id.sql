-- FORCE ALTER users.id to VARCHAR(255)
-- WARNING: This script will forcefully change the users.id type
-- It will preserve data if possible, but backup first!

BEGIN;

-- Step 1: Check current state
DO $$
DECLARE
    v_data_type text;
    v_user_count integer;
BEGIN
    -- Get current data type
    SELECT data_type INTO v_data_type
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    -- Get user count
    SELECT COUNT(*) INTO v_user_count FROM users;
    
    RAISE NOTICE 'Current users.id type: %', v_data_type;
    RAISE NOTICE 'Current user count: %', v_user_count;
    
    IF v_data_type != 'character varying' THEN
        RAISE NOTICE 'Need to convert from % to VARCHAR(255)', v_data_type;
    ELSE
        RAISE NOTICE 'Already VARCHAR, but will ensure it is VARCHAR(255)';
    END IF;
END $$;

-- Step 2: Drop ALL foreign key constraints that reference users.id
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find and drop all foreign key constraints referencing users.id
    FOR r IN (
        SELECT
            tc.table_name, 
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
    )
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- Step 3: Create temporary table with new structure
CREATE TABLE users_new (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    phone TEXT,
    locale VARCHAR(10) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    metadata JSONB,
    active_workspace_id UUID,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Copy data from old table to new table
-- If users.id is currently bigint, this will convert numeric IDs to strings
-- If it's already string, it will just copy
INSERT INTO users_new (
    id, email, full_name, avatar_url, email_verified, 
    phone, locale, timezone, metadata, active_workspace_id,
    last_active_at, created_at, updated_at
)
SELECT 
    id::VARCHAR(255),
    email,
    full_name,
    avatar_url,
    email_verified,
    phone,
    locale,
    timezone,
    metadata,
    active_workspace_id,
    last_active_at,
    created_at,
    updated_at
FROM users;

-- Step 5: Update foreign key columns in related tables
DO $$
BEGIN
    -- Update user_customer_mappings if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') THEN
        ALTER TABLE user_customer_mappings ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        RAISE NOTICE 'Updated user_customer_mappings.user_id to VARCHAR(255)';
    END IF;
    
    -- Update sessions if it exists  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE sessions ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        RAISE NOTICE 'Updated sessions.user_id to VARCHAR(255)';
    END IF;
    
    -- Update profiles if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::VARCHAR(255);
        RAISE NOTICE 'Updated profiles.user_id to VARCHAR(255)';
    END IF;
END $$;

-- Step 6: Drop old table and rename new table
DROP TABLE users CASCADE;
ALTER TABLE users_new RENAME TO users;

-- Step 7: Re-create foreign key constraints
DO $$
BEGIN
    -- Re-create constraint for user_customer_mappings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') THEN
        ALTER TABLE user_customer_mappings 
        ADD CONSTRAINT user_customer_mappings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Re-created foreign key for user_customer_mappings';
    END IF;
    
    -- Re-create constraint for sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        ALTER TABLE sessions 
        ADD CONSTRAINT sessions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Re-created foreign key for sessions';
    END IF;
    
    -- Re-create constraint for profiles
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Re-created foreign key for profiles';
    END IF;
END $$;

-- Step 8: Re-enable RLS if it was enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 9: Verify the change
DO $$
DECLARE
    v_data_type text;
    v_max_length integer;
BEGIN
    SELECT data_type, character_maximum_length 
    INTO v_data_type, v_max_length
    FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id';
    
    IF v_data_type = 'character varying' AND v_max_length = 255 THEN
        RAISE NOTICE 'SUCCESS: users.id is now VARCHAR(255)';
    ELSE
        RAISE EXCEPTION 'FAILED: users.id is % with max length %', v_data_type, v_max_length;
    END IF;
END $$;

COMMIT;

-- If everything worked, you should see:
-- NOTICE: SUCCESS: users.id is now VARCHAR(255)