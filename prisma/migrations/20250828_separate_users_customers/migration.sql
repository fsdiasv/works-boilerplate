-- Migration: Separate Users and Customers Tables
-- This migration separates the existing users table into two distinct tables:
-- 1. customers - for e-commerce buyers
-- 2. users - for system users (authentication/workspace)

-- Step 1: Rename existing users table to customers
ALTER TABLE users RENAME TO customers;

-- Step 2: Rename constraints for customers table
ALTER TABLE customers RENAME CONSTRAINT users_pkey TO customers_pkey;
ALTER TABLE customers RENAME CONSTRAINT users_email_key TO customers_email_key;

-- Step 3: Rename user_id columns to customer_id in related tables
ALTER TABLE orders RENAME COLUMN user_id TO customer_id;
ALTER TABLE order_items RENAME COLUMN user_id TO customer_id;
ALTER TABLE subscriptions RENAME COLUMN user_id TO customer_id;
ALTER TABLE disputes RENAME COLUMN user_id TO customer_id;

-- Step 4: Update foreign key constraints to reference customers
ALTER TABLE orders 
    DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
    ADD CONSTRAINT orders_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE order_items 
    DROP CONSTRAINT IF EXISTS order_items_user_id_fkey,
    ADD CONSTRAINT order_items_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE subscriptions 
    DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey,
    ADD CONSTRAINT subscriptions_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

ALTER TABLE disputes 
    DROP CONSTRAINT IF EXISTS disputes_user_id_fkey,
    ADD CONSTRAINT disputes_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Step 5: Create indexes for customer_id columns
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_customer_id ON order_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer_id ON disputes(customer_id);

-- Step 6: Create new users table for system authentication
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
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

-- Step 7: Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active_workspace_id ON users(active_workspace_id);

-- Step 8: Create user_customer_mappings table
CREATE TABLE user_customer_mappings (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, customer_id)
);

CREATE INDEX idx_user_customer_mappings_customer_id ON user_customer_mappings(customer_id);

-- Step 9: Create migration audit table for tracking
CREATE TABLE IF NOT EXISTS migration_audit (
    id SERIAL PRIMARY KEY,
    migration_name TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_count INTEGER,
    details JSONB,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Step 10: Insert audit record
INSERT INTO migration_audit (migration_name, action, details)
VALUES (
    'separate_users_customers',
    'schema_migration_complete',
    jsonb_build_object(
        'customers_table_created', true,
        'users_table_created', true,
        'foreign_keys_updated', true,
        'indexes_created', true
    )
);

-- Step 11: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 12: Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();