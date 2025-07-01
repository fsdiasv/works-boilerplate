# API Rate Limiting Implementation

## Overview

This document explains the rate limiting implementation that protects the API
from abuse and DDoS attacks.

## Security Issue

The previous implementation had no rate limiting, making it vulnerable to:

- Brute force attacks on authentication endpoints
- API abuse and resource exhaustion
- DDoS attacks
- Automated scraping and data harvesting

## Implementation

### 1. Rate Limiting Strategy

Different endpoints have different rate limits based on their sensitivity:

| Endpoint Type    | Limit   | Window             | Use Case                    |
| ---------------- | ------- | ------------------ | --------------------------- |
| General API      | 100 req | 1 minute           | Normal API usage            |
| Authentication   | 5 req   | 15 minutes         | Login, signup, verification |
| Password Reset   | 3 req   | 1 hour             | Prevent email spam          |
| Account Deletion | 1 req   | 24 hours           | Prevent accidental deletion |
| Heavy Operations | 5 req   | 1 hour (burst: 10) | Reports, exports            |

### 2. Technology Stack

- **Production**: Upstash Redis for distributed rate limiting
- **Development**: In-memory store for local testing
- **Algorithm**: Sliding window for general API, fixed window for sensitive
  operations

### 3. Usage

#### Apply Rate Limiting to tRPC Procedures

```typescript
import {
  rateLimitedPublicProcedure,
  rateLimitedProtectedProcedure,
  authRateLimitedProcedure,
} from '@/server/api/trpc-rate-limited'

export const myRouter = createTRPCRouter({
  // Standard rate limiting
  getData: rateLimitedPublicProcedure.query(async () => {
    // Your logic
  }),

  // Auth-specific rate limiting
  login: authRateLimitedProcedure
    .input(loginSchema)
    .mutation(async ({ input }) => {
      // Login logic
    }),
})
```

#### Custom Rate Limiting

```typescript
import { createRateLimitMiddleware } from '@/server/api/middleware/rate-limit'

const customRateLimitedProcedure = publicProcedure.use(
  createRateLimitMiddleware({
    limiter: 'api',
    identifierType: 'userId',
    getIdentifier: ctx => ({
      type: 'custom',
      value: ctx.user?.organizationId || 'anonymous',
    }),
  })
)
```

### 4. Configuration

#### Environment Variables

```bash
# Upstash Redis (required for production)
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: Custom rate limits (examples)
RATE_LIMIT_API_REQUESTS=100
RATE_LIMIT_API_WINDOW=60
```

#### Creating Upstash Redis Instance

1. Sign up at https://upstash.com
2. Create a new Redis database
3. Copy the REST URL and token
4. Add to your `.env.local` file

### 5. Response Headers

Rate limit information is included in response headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T12:00:00.000Z
```

### 6. Error Handling

When rate limited, the API returns:

```json
{
  "error": {
    "code": "TOO_MANY_REQUESTS",
    "message": "Rate limit exceeded. Try again in 45 seconds."
  }
}
```

### 7. Client-Side Handling

```typescript
// Example: Handle rate limiting in React
const { mutate, error } = trpc.auth.login.useMutation({
  onError: error => {
    if (error.code === 'TOO_MANY_REQUESTS') {
      toast.error(error.message)
      // Optionally disable form for the duration
    }
  },
})
```

### 8. Monitoring

Track rate limit metrics:

```typescript
// In your monitoring service
if (result.success === false) {
  metrics.increment('rate_limit.exceeded', {
    endpoint: info.path,
    identifier: identifierString,
  })
}
```

## Best Practices

1. **Identifier Selection**: Use userId for authenticated endpoints, IP for
   public
2. **Gradual Limits**: Start with generous limits and tighten based on usage
   patterns
3. **User Communication**: Always inform users when they're rate limited
4. **Bypass for Testing**: Consider bypassing rate limits in E2E tests
5. **Monitor False Positives**: Track legitimate users hitting rate limits

## Testing

### Unit Tests

```typescript
it('should rate limit after threshold', async () => {
  // Make requests up to limit
  for (let i = 0; i < 5; i++) {
    await caller.auth.login({ email, password })
  }

  // Next request should fail
  await expect(caller.auth.login({ email, password })).rejects.toThrow(
    'TOO_MANY_REQUESTS'
  )
})
```

### Manual Testing

1. Make rapid requests to an endpoint
2. Verify rate limit headers in response
3. Confirm error message after limit exceeded
4. Wait for reset and verify access restored

## Troubleshooting

### Common Issues

1. **"Redis connection failed"**: Check Upstash credentials
2. **Rate limits not working locally**: In-memory store resets on server restart
3. **IP-based limiting behind proxy**: Ensure X-Forwarded-For header is set

### Debug Mode

Enable rate limit debugging:

```typescript
const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true, // Enables analytics
  prefix: 'ratelimit:api',
})
```

## Future Enhancements

1. **Dynamic Rate Limits**: Adjust based on user tier/subscription
2. **Distributed Rate Limiting**: Use Redis Cluster for global rate limiting
3. **Advanced Algorithms**: Implement token bucket for better burst handling
4. **Rate Limit Bypass**: Allow certain IPs or API keys to bypass limits
5. **Cost-Based Limiting**: Limit based on operation cost, not just count
