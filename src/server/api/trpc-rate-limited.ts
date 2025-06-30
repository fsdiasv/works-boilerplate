import { createRateLimitMiddleware } from './middleware/rate-limit'
import { publicProcedure, protectedProcedure } from './trpc'

/**
 * Rate-limited procedure variants
 */

// General API rate limiting (100 req/min)
export const rateLimitedPublicProcedure = publicProcedure.use(
  createRateLimitMiddleware({ limiter: 'api' })
)

export const rateLimitedProtectedProcedure = protectedProcedure.use(
  createRateLimitMiddleware({ limiter: 'api', identifierType: 'userId' })
)

// Auth-specific rate limiting (5 req/15min)
export const authRateLimitedProcedure = publicProcedure.use(
  createRateLimitMiddleware({ limiter: 'auth' })
)

// Password reset rate limiting (3 req/hour)
export const passwordResetRateLimitedProcedure = publicProcedure.use(
  createRateLimitMiddleware({ limiter: 'passwordReset' })
)

// Account deletion rate limiting (1 req/day)
export const accountDeletionRateLimitedProcedure = protectedProcedure.use(
  createRateLimitMiddleware({ limiter: 'accountDeletion', identifierType: 'userId' })
)

// Heavy operations rate limiting (5 req/hour with burst of 10)
export const heavyOperationRateLimitedProcedure = protectedProcedure.use(
  createRateLimitMiddleware({ limiter: 'heavy', identifierType: 'userId' })
)
