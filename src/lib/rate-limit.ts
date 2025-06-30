import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { env } from '@/lib/env'

// In-memory store for development
class InMemoryRateLimitStore {
  private store = new Map<string, { count: number; reset: number }>()

  get(key: string) {
    const data = this.store.get(key)
    if (!data) return null
    if (Date.now() > data.reset) {
      this.store.delete(key)
      return null
    }
    return data.count
  }

  set(key: string, count: number, ttl: number) {
    this.store.set(key, { count, reset: Date.now() + ttl * 1000 })
  }

  incr(key: string) {
    const current = this.get(key)
    const newCount = (current ?? 0) + 1
    const data = this.store.get(key)
    if (data) {
      data.count = newCount
    }
    return newCount
  }
}

// Type assertion for Redis-compatible interface
interface RedisCompatible {
  get: (key: string) => Promise<number | null>
  set: (key: string, value: number, options?: { ex?: number }) => Promise<string | null>
  incr: (key: string) => Promise<number>
}

// Create Redis client or use in-memory store for development
const redis =
  env.UPSTASH_REDIS_REST_URL !== undefined &&
  env.UPSTASH_REDIS_REST_URL !== '' &&
  env.UPSTASH_REDIS_REST_TOKEN !== undefined &&
  env.UPSTASH_REDIS_REST_TOKEN !== ''
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : (new InMemoryRateLimitStore() as unknown as RedisCompatible)

// Different rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limiting - 100 requests per minute
  api: new Ratelimit({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    redis: redis as any,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // Auth endpoints - more restrictive
  auth: new Ratelimit({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    redis: redis as any,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Password reset - very restrictive to prevent abuse
  passwordReset: new Ratelimit({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    redis: redis as any,
    limiter: Ratelimit.fixedWindow(3, '1 h'),
    analytics: true,
    prefix: 'ratelimit:password-reset',
  }),

  // Account deletion - extremely restrictive
  accountDeletion: new Ratelimit({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    redis: redis as any,
    limiter: Ratelimit.fixedWindow(1, '24 h'),
    analytics: true,
    prefix: 'ratelimit:account-deletion',
  }),

  // Heavy operations (exports, reports, etc)
  heavy: new Ratelimit({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    redis: redis as any,
    limiter: Ratelimit.tokenBucket(5, '1 h', 10),
    analytics: true,
    prefix: 'ratelimit:heavy',
  }),
}

/**
 * Rate limit identifier types
 */
export type RateLimitIdentifier =
  | { type: 'ip'; value: string }
  | { type: 'userId'; value: string }
  | { type: 'email'; value: string }

/**
 * Get identifier string for rate limiting
 */
export function getRateLimitIdentifier(identifier: RateLimitIdentifier): string {
  return `${identifier.type}:${identifier.value}`
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: {
  limit: number
  remaining: number
  reset: number
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  }
}
