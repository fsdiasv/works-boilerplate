import { TRPCError } from '@trpc/server'

import {
  rateLimiters,
  getRateLimitIdentifier,
  getRateLimitHeaders,
  type RateLimitIdentifier,
} from '@/lib/rate-limit'

interface RateLimitOptions {
  /**
   * Which rate limiter to use
   */
  limiter: keyof typeof rateLimiters

  /**
   * How to identify the user for rate limiting
   * Defaults to IP address
   */
  identifierType?: 'ip' | 'userId' | 'email'

  /**
   * Custom identifier extractor
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getIdentifier?: (ctx: any) => RateLimitIdentifier
}

interface RateLimitContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res?: any
}

/**
 * tRPC middleware for rate limiting
 */
export function createRateLimitMiddleware(options: RateLimitOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ ctx, next }: { ctx: RateLimitContext; next: () => any }) => {
    // Get the appropriate rate limiter
    const limiter = rateLimiters[options.limiter]

    // Determine identifier
    let identifier: RateLimitIdentifier

    if (options.getIdentifier) {
      identifier = options.getIdentifier(ctx)
    } else {
      switch (options.identifierType) {
        case 'userId':
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/strict-boolean-expressions
          if (!ctx.user?.id) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            })
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          identifier = { type: 'userId', value: ctx.user.id }
          break

        case 'email':
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/strict-boolean-expressions
          if (!ctx.user?.email) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            })
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          identifier = { type: 'email', value: ctx.user.email }
          break

        default: {
          // Default to IP address
          // In production, this would come from headers like X-Forwarded-For
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const ip =
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ctx.req?.headers?.['x-forwarded-for'] ??
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ctx.req?.headers?.['x-real-ip'] ??
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ctx.req?.connection?.remoteAddress ??
            'unknown'
          identifier = { type: 'ip', value: ip as string }
        }
      }
    }

    // Check rate limit
    const identifierString = getRateLimitIdentifier(identifier)
    const result = await limiter.limit(identifierString)

    // Add rate limit headers to response
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/strict-boolean-expressions
    if (ctx.res && typeof ctx.res.setHeader === 'function') {
      const headers = getRateLimitHeaders(result)
      Object.entries(headers).forEach(([key, value]) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        ctx.res.setHeader(key, value)
      })
    }

    // If rate limited, throw error
    if (!result.success) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded. Try again in ${Math.ceil(
          (result.reset - Date.now()) / 1000
        )} seconds.`,
      })
    }

    // Continue with the request
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return next()
  }
}
