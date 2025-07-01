# Account Deletion Security Implementation

## Overview

Account deletion is a sensitive operation that requires careful handling to
avoid security vulnerabilities. This document explains the secure implementation
of account deletion in the Works Boilerplate.

## Security Issue

The previous implementation exposed the Supabase Admin SDK
(`auth.admin.deleteUser`) in a client-accessible tRPC endpoint. This is a
critical security vulnerability because:

1. The admin SDK requires service role permissions
2. Exposing it to client code could potentially allow unauthorized access to
   admin functions
3. The service role key should never be accessible from client-side code

## Secure Implementation

The secure implementation follows a two-phase approach:

### Phase 1: Database Deletion (Client-Accessible)

The tRPC endpoint handles:

1. User authentication verification
2. Deletion from the application database (profiles, user records)
3. Sign out the user from their current session

```typescript
// src/server/api/routers/auth.ts
deleteAccount: protectedProcedure
  .input(
    z.object({
      confirmation: z.literal('DELETE MY ACCOUNT'),
    })
  )
  .mutation(async ({ ctx }) => {
    // Delete from database
    await ctx.db.profile.deleteMany({ where: { userId: ctx.user.id } })
    await ctx.db.user.delete({ where: { id: ctx.user.id } })

    // Sign out user
    await ctx.supabase.auth.signOut()

    return { success: true }
  })
```

### Phase 2: Auth Deletion (Server-Only)

The actual deletion from Supabase Auth is handled by a secure server-only
endpoint that can be triggered by:

1. **Database Trigger** (Recommended)

   ```sql
   CREATE OR REPLACE FUNCTION handle_user_deletion()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Call the internal API endpoint
     PERFORM net.http_post(
       url := 'https://your-app.com/api/admin/delete-auth-user',
       body := json_build_object(
         'userId', OLD.id,
         'secret', current_setting('app.internal_api_secret')
       )::jsonb
     );
     RETURN OLD;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **Supabase Edge Function**

   ```typescript
   // supabase/functions/delete-auth-user/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

   serve(async req => {
     const { userId } = await req.json()

     const response = await fetch(
       'https://your-app.com/api/admin/delete-auth-user',
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           userId,
           secret: Deno.env.get('INTERNAL_API_SECRET'),
         }),
       }
     )

     return response
   })
   ```

3. **Scheduled Job** (For batch processing)
   - Process pending deletions from a queue table
   - Useful for compliance with data retention policies

## Environment Configuration

Add the following to your `.env.local`:

```bash
# Generate a secure random string (minimum 32 characters)
INTERNAL_API_SECRET=your-very-secure-random-string-here
```

## Security Considerations

1. **Authentication**: The internal API endpoint validates a secret token
2. **Network Security**: Consider IP allowlisting for the internal endpoint
3. **Audit Logging**: All deletions are logged for compliance
4. **Rate Limiting**: Implement rate limiting on the deletion endpoint
5. **Monitoring**: Set up alerts for unusual deletion patterns

## Testing

1. Test the client-side deletion flow
2. Verify database records are properly deleted
3. Confirm the user is signed out
4. Manually trigger the server-side auth deletion
5. Verify the user cannot log in after deletion

## Compliance

This implementation helps with:

- GDPR "Right to be Forgotten"
- CCPA data deletion requirements
- SOC 2 audit trails
- Security best practices
