import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from '@/i18n/config'
import { addCSPHeaders } from '@/lib/csp'
import { env } from '@/lib/env'
import { updateSession } from '@/lib/supabase/middleware'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

// Define protected routes patterns
const protectedRoutes = ['/dashboard', '/profile', '/settings', '/admin']

// Define auth routes (where authenticated users shouldn't be)
const authRoutes = ['/login', '/signup', '/forgot-password']

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.includes(route))
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.includes(route))
}

/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows redirects to paths within the application.
 *
 * @param url - The URL to validate
 * @param baseUrl - The base URL of the application
 * @returns A safe redirect path
 */
function validateRedirectUrl(url: string, baseUrl: string): string {
  try {
    // Parse the URL
    const redirectUrl = new URL(url, baseUrl)
    const appUrl = new URL(baseUrl)

    // Only allow redirects to the same origin
    if (redirectUrl.origin !== appUrl.origin) {
      console.warn('[Security] Blocked redirect to external URL:', url)
      // Return default dashboard path for the current locale
      const locale = locales.find(l => baseUrl.includes(`/${l}/`)) ?? defaultLocale
      return `/${locale}/dashboard`
    }

    // Return the pathname and search params only
    return redirectUrl.pathname + redirectUrl.search
  } catch {
    // If URL parsing fails, return default dashboard path
    const locale = locales.find(l => baseUrl.includes(`/${l}/`)) ?? defaultLocale
    return `/${locale}/dashboard`
  }
}

export default async function middleware(request: NextRequest) {
  // First, handle i18n
  const intlResponse = intlMiddleware(request)

  // If intl middleware returns a response (redirect or rewrite), return it
  if (intlResponse instanceof NextResponse) {
    return intlResponse
  }

  // Then, handle auth
  const { supabase, response: authResponse, user } = await updateSession(request)

  // Get the pathname without locale prefix
  const pathname = request.nextUrl.pathname
  const pathnameWithoutLocale =
    locales.reduce((path, locale) => path.replace(`/${locale}`, ''), pathname).replace(/^\//, '') ||
    '/'

  // Get locale from pathname or default
  const locale = locales.find(l => pathname.startsWith(`/${l}`)) ?? defaultLocale

  // Check if the route is protected
  if (isProtectedRoute(pathnameWithoutLocale)) {
    if (!user) {
      // Redirect to login with return URL
      const redirectUrl = new URL(`/${locale}/login`, request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if the route is an auth route
  if (isAuthRoute(pathnameWithoutLocale)) {
    if (user) {
      // Redirect to dashboard if already authenticated
      const redirectUrl = new URL(`/${locale}/dashboard`, request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Handle auth callback with enhanced security
  if (pathnameWithoutLocale === 'auth/callback') {
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')
    const errorDescription = request.nextUrl.searchParams.get('error_description')
    const next = request.nextUrl.searchParams.get('next') ?? `/${locale}/dashboard`

    // Handle OAuth errors from provider
    if (error !== null && error !== '') {
      console.error('[OAuth Callback] Provider error:', { error, errorDescription })
      const errorUrl = new URL(`/${locale}/login`, request.url)
      errorUrl.searchParams.set('error', 'oauth_error')
      return NextResponse.redirect(errorUrl)
    }

    // Validate required parameters
    if (code === null || code === '') {
      console.error('[OAuth Callback] Missing authorization code')
      const errorUrl = new URL(`/${locale}/login`, request.url)
      errorUrl.searchParams.set('error', 'missing_code')
      return NextResponse.redirect(errorUrl)
    }

    // Validate state parameter for CSRF protection
    if (state !== null && state !== '') {
      // Retrieve stored state from cookies
      const storedState = request.cookies.get('oauth_state')?.value

      // Clear the state cookie regardless of validation result
      authResponse.cookies.delete('oauth_state')

      // Validate state matches
      if (storedState === undefined || storedState === '' || storedState !== state) {
        console.error('[OAuth Callback] State mismatch - possible CSRF attack')
        const errorUrl = new URL(`/${locale}/login`, request.url)
        errorUrl.searchParams.set('error', 'state_mismatch')
        return NextResponse.redirect(errorUrl)
      }
    }

    try {
      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('[OAuth Callback] Code exchange failed:', exchangeError)
        const errorUrl = new URL(`/${locale}/login`, request.url)
        errorUrl.searchParams.set('error', 'exchange_failed')
        return NextResponse.redirect(errorUrl)
      }

      // Validate session data
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
      if (!data.session || !data.user) {
        console.error('[OAuth Callback] Invalid session data received')
        const errorUrl = new URL(`/${locale}/login`, request.url)
        errorUrl.searchParams.set('error', 'invalid_session')
        return NextResponse.redirect(errorUrl)
      }

      // Verify the session belongs to the expected user
      const { data: sessionData } = await supabase.auth.getSession()
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions
      if (!sessionData.session || sessionData.session.user.id !== data.user.id) {
        console.error('[OAuth Callback] Session user mismatch')
        const errorUrl = new URL(`/${locale}/login`, request.url)
        errorUrl.searchParams.set('error', 'session_mismatch')
        return NextResponse.redirect(errorUrl)
      }

      // Additional security: Check for replay attacks by storing used codes
      // This would typically be done with Redis or similar, but for now we'll
      // set a short-lived cookie to prevent immediate replay
      const codeHash = btoa(code).substring(0, 16) // Simple hash for the cookie name
      const usedCodeCookie = request.cookies.get(`oauth_code_${codeHash}`)?.value

      if (usedCodeCookie !== undefined && usedCodeCookie !== '') {
        console.error('[OAuth Callback] Authorization code already used - possible replay attack')
        await supabase.auth.signOut() // Sign out the potentially compromised session
        const errorUrl = new URL(`/${locale}/login`, request.url)
        errorUrl.searchParams.set('error', 'code_reused')
        return NextResponse.redirect(errorUrl)
      }

      // Mark code as used (expires in 5 minutes)
      authResponse.cookies.set(`oauth_code_${codeHash}`, '1', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300, // 5 minutes
      })

      // Validate next URL to prevent open redirect
      const validatedNext = validateRedirectUrl(next, request.url)

      // Success - redirect to validated URL
      return NextResponse.redirect(new URL(validatedNext, request.url))
    } catch (err) {
      console.error('[OAuth Callback] Unexpected error:', err)
      const errorUrl = new URL(`/${locale}/login`, request.url)
      errorUrl.searchParams.set('error', 'unexpected_error')
      return NextResponse.redirect(errorUrl)
    }
  }

  // Add CSP headers
  const isDev = env.NODE_ENV === 'development'
  addCSPHeaders(authResponse.headers, isDev)

  // Return the response with any auth cookie updates and CSP headers
  return authResponse
}

export const config = {
  matcher: [
    // Skip all static files and API routes
    '/((?!_next/static|_next/image|api|favicon.ico|manifest.json|sw.js|workbox-.*|offline.html|.*\\..*).*)',
  ],
}
