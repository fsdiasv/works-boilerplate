import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from '@/i18n/config'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export const config = {
  // Only match requests that should be internationalized
  matcher: [
    // Match all pathnames except for
    // - `/_next` (Next.js internals)
    // - `/api` (API routes)
    // - all root files inside /public (e.g. `/favicon.ico`)
    '/((?!_next|api|favicon.ico|manifest.json|sw.js|workbox-*|offline.html).*)',
  ],
}
