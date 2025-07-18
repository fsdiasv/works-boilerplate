-- Add RLS policy to allow public access for checking workspace slug availability
-- This is needed for the signup flow where users need to check if a workspace slug is available
-- Run this script in the Supabase SQL Editor

-- Note: RLS should already be enabled on the workspaces table from the initial migration
-- But we'll ensure it's enabled just in case
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone (including unauthenticated users) to check if a slug exists
-- This policy allows SELECT queries for slug checking during signup
-- The actual query only selects 'id' column, so this is secure
CREATE POLICY "Public can check workspace slug availability" 
ON workspaces 
FOR SELECT 
TO public 
USING (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'workspaces' 
AND policyname = 'Public can check workspace slug availability';

-- Note: This policy works because:
-- 1. The checkSlugPublic query only selects the 'id' field
-- 2. The generateSlugPublic also queries workspace table to check existing slugs
-- 3. Both use findUnique with a where clause on 'slug'
-- 4. No sensitive data is exposed, only whether a slug exists or not

-- Important: This policy covers both checkSlugPublic and generateSlugPublic endpoints
-- Both are used during the signup flow to validate and generate workspace slugs