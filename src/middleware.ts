import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from '@/i18n/config'
import { addCSPHeaders } from '@/lib/csp'
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

export default async function middleware(request: NextRequest) {
  // First, handle i18n
  intlMiddleware(request)

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

  // Handle auth callback
  if (pathnameWithoutLocale === 'auth/callback') {
    const code = request.nextUrl.searchParams.get('code')
    const next = request.nextUrl.searchParams.get('next') ?? `/${locale}/dashboard`

    if (code !== null && code !== '') {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(new URL(next, request.url))
      }
    }

    // Return to home on error
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // Add CSP headers
  const isDev = process.env.NODE_ENV === 'development'
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
