import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

import { env } from '@/lib/env'

// Create a simple rate limiter for development
class SimpleRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  limit(identifier: string) {
    const now = Date.now()
    const record = this.store.get(identifier)

    // Clean up expired entries
    if (record && now > record.resetAt) {
      this.store.delete(identifier)
    }

    const current = this.store.get(identifier)

    if (!current) {
      // First request in window
      this.store.set(identifier, { count: 1, resetAt: now + this.windowMs })
      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs,
      }
    }

    if (current.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: current.resetAt,
      }
    }

    // Increment counter
    current.count++
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - current.count,
      reset: current.resetAt,
    }
  }
}

// Helper to parse duration strings (e.g., '1 m', '15 m', '1 h', '24 h')
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)\s*([mh])$/)
  if (!match) throw new Error(`Invalid duration: ${duration}`)

  const value = match[1]
  const unit = match[2]
  if (value === undefined || unit === undefined) throw new Error(`Invalid duration: ${duration}`)

  const num = parseInt(value, 10)

  switch (unit) {
    case 'm':
      return num * 60 * 1000 // minutes to ms
    case 'h':
      return num * 60 * 60 * 1000 // hours to ms
    default:
      throw new Error(`Invalid duration unit: ${unit}`)
  }
}

// Different rate limiters for different endpoints
export const rateLimiters =
  env.UPSTASH_REDIS_REST_URL !== undefined &&
  env.UPSTASH_REDIS_REST_URL !== '' &&
  env.UPSTASH_REDIS_REST_TOKEN !== undefined &&
  env.UPSTASH_REDIS_REST_TOKEN !== ''
    ? {
        // Production rate limiters using Redis
        api: new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
          limiter: Ratelimit.slidingWindow(100, '1 m'),
          analytics: true,
          prefix: 'ratelimit:api',
        }),
        auth: new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
          limiter: Ratelimit.slidingWindow(5, '15 m'),
          analytics: true,
          prefix: 'ratelimit:auth',
        }),
        passwordReset: new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
          limiter: Ratelimit.fixedWindow(3, '1 h'),
          analytics: true,
          prefix: 'ratelimit:password-reset',
        }),
        accountDeletion: new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
          limiter: Ratelimit.fixedWindow(1, '24 h'),
          analytics: true,
          prefix: 'ratelimit:account-deletion',
        }),
        heavy: new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
          limiter: Ratelimit.tokenBucket(5, '1 h', 10),
          analytics: true,
          prefix: 'ratelimit:heavy',
        }),
        authCallback: new Ratelimit({
          redis: new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
          }),
          limiter: Ratelimit.slidingWindow(10, '5 m'), // 10 callbacks per 5 minutes
          analytics: true,
          prefix: 'ratelimit:auth-callback',
        }),
      }
    : {
        // Development rate limiters using in-memory storage
        api: new SimpleRateLimiter(100, parseDuration('1 m')),
        auth: new SimpleRateLimiter(5, parseDuration('15 m')),
        passwordReset: new SimpleRateLimiter(3, parseDuration('1 h')),
        accountDeletion: new SimpleRateLimiter(1, parseDuration('24 h')),
        heavy: new SimpleRateLimiter(5, parseDuration('1 h')),
        authCallback: new SimpleRateLimiter(10, parseDuration('5 m')),
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
