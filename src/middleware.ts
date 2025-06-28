import createMiddleware from 'next-intl/middleware'

import { defaultLocale, locales } from '@/i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

export default intlMiddleware

export const config = {
  matcher: [
    // Skip all static files and API routes
    '/((?!_next/static|_next/image|api|favicon.ico|manifest.json|sw.js|workbox-.*|offline.html|.*\\..*).*)',
  ],
}
