# Security Environment Setup

## Required Environment Variables

After implementing the security fixes, you need to add the following environment
variables:

### 1. INTERNAL_API_SECRET (Required)

This is used to secure internal API endpoints that should only be called by your
backend services.

**Generate a secure value:**

```bash
node scripts/generate-secret.js
```

Or use OpenSSL:

```bash
openssl rand -base64 32
```

**Add to .env.local:**

```env
INTERNAL_API_SECRET="your-generated-secret-here"
```

⚠️ **Important:** The secret must be at least 32 characters long.

### 2. Upstash Redis (Optional for Development)

For production rate limiting, you'll need Upstash Redis credentials:

1. Sign up at https://upstash.com
2. Create a new Redis database
3. Copy the REST API credentials

**Add to .env.local:**

```env
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

**Note:** If these are not provided, the application will use an in-memory store
for rate limiting in development.

## Security Best Practices

1. **Never commit .env files** - They should be in .gitignore
2. **Use different secrets for each environment** - Don't reuse production
   secrets in development
3. **Rotate secrets regularly** - Update your INTERNAL_API_SECRET periodically
4. **Use a secret management service** - Consider AWS Secrets Manager, Vercel
   Environment Variables, or similar for production
