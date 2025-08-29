-- Verify Migration Script
-- Check if the migration was applied successfully

-- Check if customers table exists
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') 
    THEN '✅ customers table exists' 
    ELSE '❌ customers table NOT found' 
  END as customers_check;

-- Check if users table exists (should be empty, new table)
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ users table exists' 
    ELSE '❌ users table NOT found' 
  END as users_check;

-- Check if user_customer_mappings table exists
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_customer_mappings') 
    THEN '✅ user_customer_mappings table exists' 
    ELSE '❌ user_customer_mappings table NOT found' 
  END as mappings_check;

-- Count records in customers table
SELECT COUNT(*) as customer_count FROM customers;

-- Count records in users table (should be 0 initially)
SELECT COUNT(*) as user_count FROM users;

-- Check if customer_id column exists in orders
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'customer_id'
  ) 
    THEN '✅ orders.customer_id column exists' 
    ELSE '❌ orders.customer_id column NOT found' 
  END as orders_column_check;

-- Check if migration_audit table exists
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'migration_audit') 
    THEN '✅ migration_audit table exists' 
    ELSE '❌ migration_audit table NOT found' 
  END as audit_check;

-- Check migration audit records
SELECT * FROM migration_audit WHERE migration_name = 'separate_users_customers';