# Fix: Supabase Email Double Encoding Issue

## Problem

When Supabase sends verification emails, the URL parameters in the email link
can become double-encoded, resulting in URLs like:

```
https://your-domain.com/auth/callback?token%3Dpkce_xxx%26type%3Dsignup%26redirect_to%3D...
```

Instead of the expected:

```
https://your-domain.com/auth/callback?token=pkce_xxx&type=signup&redirect_to=...
```

This causes the error:
`{"code":400,"error_code":"validation_failed","msg":"Verify requires a verification type"}`

## Root Cause

The issue occurs when email clients or services (like Gmail) additionally encode
the URL parameters, turning `&` into `%26` and `=` into `%3D`.

## Solution

The auth callback route now includes logic to detect and fix double-encoded
parameters:

```typescript
// Check if the URL has double-encoded parameters
const rawToken = searchParams.get('token')
if (rawToken && rawToken.includes('=') && rawToken.includes('&')) {
  // The parameters are encoded as a single 'token' parameter
  // Decode and reconstruct the URL
  const decodedParams = decodeURIComponent(rawToken)
  const properUrl = new URL(request.url)
  properUrl.search = '?' + decodedParams
  searchParams = properUrl.searchParams
}
```

## Files Modified

- `/src/app/auth/callback/route.ts` - Added double-encoding detection and fix

## Testing

1. Sign up with a new email
2. Click the verification link from the email
3. The callback should properly parse the parameters and verify the email

## Prevention

This is a known issue with Supabase email templates and certain email clients.
The workaround in the callback route ensures compatibility regardless of how the
email client handles the URL.
