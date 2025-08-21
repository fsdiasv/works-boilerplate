/**
 * Rate limiting utilities for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server'

import {
  rateLimiters,
  getRateLimitIdentifier,
  getRateLimitHeaders,
  type RateLimitIdentifier,
} from '@/lib/rate-limit'

interface ApiRateLimitOptions {
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
   * Custom identifier value
   */
  customIdentifier?: string
}

/**
 * Extract IP address from request
 */
function getIpAddress(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded !== null && forwarded !== '') {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }

  if (realIp !== null && realIp !== '') {
    return realIp
  }

  return 'unknown'
}

/**
 * Rate limit check for API routes
 */
export async function checkRateLimit(
  request: NextRequest,
  options: ApiRateLimitOptions
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  headers: Record<string, string>
}> {
  const limiter = rateLimiters[options.limiter]

  // Determine identifier
  let identifier: RateLimitIdentifier

  switch (options.identifierType) {
    case 'userId':
      if (options.customIdentifier === undefined || options.customIdentifier === '') {
        throw new Error('User ID required for userId rate limiting')
      }
      identifier = { type: 'userId', value: options.customIdentifier }
      break

    case 'email':
      if (options.customIdentifier === undefined || options.customIdentifier === '') {
        throw new Error('Email required for email rate limiting')
      }
      identifier = { type: 'email', value: options.customIdentifier }
      break

    default:
      // Default to IP address
      identifier = { type: 'ip', value: getIpAddress(request) }
  }

  // Check rate limit
  const identifierString = getRateLimitIdentifier(identifier)
  const result = await limiter.limit(identifierString)

  // Generate headers
  const headers = getRateLimitHeaders(result)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    headers,
  }
}

/**
 * Middleware wrapper for API routes that handles rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: ApiRateLimitOptions
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const rateLimitResult = await checkRateLimit(request, options)

      // If rate limited, return error response with headers
      if (!rateLimitResult.success) {
        const seconds = Math.max(0, Math.ceil((rateLimitResult.reset - Date.now()) / 1000))
        const response = new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${seconds} seconds.`,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(seconds),
              ...rateLimitResult.headers,
            },
          }
        )

        return response
      }

      // Continue with the request
      const response = await handler(request)

      // Add rate limit headers to successful responses
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch (error) {
      // If rate limiting fails, continue with the request but log the error
      console.error('Rate limiting error:', error)
      return handler(request)
    }
  }
}
