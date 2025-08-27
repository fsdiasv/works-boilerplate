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
const protectedRoutes = ['/profile', '/settings', '/admin', '/workspace', '/faturamento']

// Define public routes that don't require authentication
const publicRoutes = ['/analytics']

// Define auth routes (where authenticated users shouldn't be)
const authRoutes = ['/login', '/signup', '/forgot-password']

// Define routes that require an active workspace
const workspaceRequiredRoutes = ['/faturamento', '/workspace/settings']

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.includes(route))
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.includes(route))
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.includes(route))
}

function requiresWorkspace(pathname: string): boolean {
  return workspaceRequiredRoutes.some(route => pathname.includes(route))
}

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Handle auth routes without locale prefix
  if (pathname.startsWith('/auth/') && !pathname.startsWith('/auth/callback')) {
    // Get locale from cookie or accept-language header
    const locale =
      request.cookies.get('locale')?.value ??
      request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] ??
      defaultLocale

    // Redirect to localized version
    const localizedUrl = new URL(`/${locale}${pathname}`, request.url)
    localizedUrl.search = request.nextUrl.search
    return NextResponse.redirect(localizedUrl)
  }

  // Skip i18n middleware for auth callback routes (they don't need locale prefixes)
  if (pathname.startsWith('/auth/callback')) {
    // Handle auth directly without locale prefix
    const { response: authResponse } = await updateSession(request)

    // Add CSP headers
    const isDev = env.NODE_ENV === 'development'
    addCSPHeaders(authResponse.headers, isDev)

    return authResponse
  }

  // First, handle i18n for all other routes
  const intlResponse = intlMiddleware(request)

  // If intl middleware returns a response (redirect or rewrite), return it
  if (intlResponse instanceof NextResponse) {
    return intlResponse
  }

  // Then, handle auth
  const { supabase, response: authResponse, user } = await updateSession(request)

  // Get the pathname without locale prefix
  const pathnameWithoutLocale =
    locales.reduce((path, locale) => path.replace(`/${locale}`, ''), pathname).replace(/^\//, '') ||
    '/'

  // Get locale from pathname or default
  const locale = locales.find(l => pathname.startsWith(`/${l}`)) ?? defaultLocale

  // Allow public routes without authentication
  if (isPublicRoute(pathnameWithoutLocale)) {
    // Skip auth checks for public routes like analytics
    const isDev = env.NODE_ENV === 'development'
    addCSPHeaders(authResponse.headers, isDev)
    return authResponse
  }

  // Check if the route is protected
  if (isProtectedRoute(pathnameWithoutLocale)) {
    if (!user) {
      // Redirect to login with return URL
      const redirectUrl = new URL(`/${locale}/auth/login`, request.url)
      // Preserve original URL including query parameters
      const originalUrl = `${pathname}${request.nextUrl.search}`
      redirectUrl.searchParams.set('redirectTo', originalUrl)
      return NextResponse.redirect(redirectUrl)
    }

    // Check if route requires workspace and user has no active workspace
    if (requiresWorkspace(pathnameWithoutLocale)) {
      // Get user's active workspace
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        // Query database to check if user has any workspace
        const { data: userData } = await supabase
          .from('users')
          .select('active_workspace_id')
          .eq('id', session.user.id)
          .single()

        // If no active workspace, redirect to workspace creation
        if (
          userData === null ||
          !('active_workspace_id' in userData) ||
          userData.active_workspace_id === null
        ) {
          const createWorkspaceUrl = new URL(`/${locale}/onboarding/workspace`, request.url)
          return NextResponse.redirect(createWorkspaceUrl)
        }
      }
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
