# Fix: Workspace Slug Public Access Error

## Problem

During the signup flow, when checking if a workspace slug is available, the
following error occurs:

```
FATAL: Tenant or user not found
```

This happens because:

1. The `workspace.checkSlugPublic` tRPC endpoint is called during signup
2. At signup time, there's no authenticated user
3. Supabase RLS (Row Level Security) blocks all queries without authentication
4. Prisma client respects RLS and fails with the "Tenant or user not found"
   error

## Solution

Add an RLS policy that allows public (unauthenticated) users to SELECT from the
workspaces table for slug availability checking.

### Steps to Apply the Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the RLS Policy Script**
   - Copy the contents of `prisma/sql/add-public-workspace-slug-policy.sql`
   - Paste and execute in the SQL Editor
   - This creates a policy: "Public can check workspace slug availability"

3. **Verify the Policy**
   - The script includes a verification query
   - You should see the new policy in the results
   - Alternatively, go to Authentication > Policies in Supabase dashboard

### How It Works

- The policy allows public users to perform SELECT queries on the workspaces
  table
- The `checkSlugPublic` endpoint only selects the 'id' field when checking slug
  existence
- No sensitive data is exposed - only whether a slug exists or not
- This maintains security while allowing the necessary public access

### Testing

1. Clear your browser cache/cookies
2. Navigate to `/auth/signup`
3. Enter a workspace name - it should auto-generate a slug
4. The slug availability check should now work without errors

### Security Considerations

- The policy only allows SELECT operations
- The actual query only retrieves the 'id' field
- No workspace data (name, settings, etc.) is exposed
- This is the minimum access needed for the signup flow to work

### Alternative Approaches (Not Implemented)

1. **Service Role Client**: Create a separate Prisma client with service role
   that bypasses RLS
2. **Anon Key Function**: Create a Postgres function that runs with SECURITY
   DEFINER
3. **Separate Table**: Store slugs in a separate public table

The RLS policy approach was chosen as it's the cleanest and most secure
solution.
