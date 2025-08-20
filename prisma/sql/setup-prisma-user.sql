-- Create a custom Prisma database user with full privileges
-- Run this script in the Supabase SQL Editor

-- Create the prisma user with a secure password
-- IMPORTANT: Generate a strong password and replace 'your-secure-password-here'
CREATE USER prisma WITH PASSWORD 'your-secure-password-here';

-- Grant all privileges on the public schema
GRANT ALL ON SCHEMA public TO prisma;
GRANT ALL ON ALL TABLES IN SCHEMA public TO prisma;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO prisma;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO prisma;

-- Grant privileges on future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO prisma;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO prisma;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO prisma;

-- Grant necessary permissions for migrations
GRANT CREATE ON SCHEMA public TO prisma;

-- Allow the prisma user to bypass RLS (needed for migrations)
ALTER USER prisma BYPASSRLS;

-- Optional: If using additional schemas, grant permissions
-- GRANT ALL ON SCHEMA auth TO prisma;
-- GRANT ALL ON SCHEMA storage TO prisma;

-- Verify the user was created successfully
SELECT usename, usesuper, usecreatedb, usebypassrls 
FROM pg_user 
WHERE usename = 'prisma';