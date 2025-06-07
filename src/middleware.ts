import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from '@/i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
})

export default function middleware(request: NextRequest) {
  // Performance optimization: Skip middleware for static assets
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Mobile detection for enhanced locale suggestions
  const userAgent = request.headers.get('user-agent') ?? ''
  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(userAgent)

  // Add mobile detection header for client components
  const response = intlMiddleware(request)

  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unnecessary-condition
  if (isMobile && response) {
    response.headers.set('x-is-mobile', 'true')
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and API routes
    '/((?!api|_next|_vercel|.*\\.[\\w]+$).*)',
    // Include specific user paths
    '/([\\w-]+)?/users/(.+)',
  ],
}
