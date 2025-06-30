import crypto from 'crypto'

/**
 * Generates a random nonce for Content Security Policy
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')
}

/**
 * Generates Content Security Policy header with nonce support
 */
export function generateCSP(nonce: string, isDev: boolean): string {
  const policies = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Allow specific trusted domains for external scripts
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      // In development, we might need eval for hot reload
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`,
      // Allow specific inline styles with hash (for critical CSS)
      "'sha256-47DEKpj8HBSa+/TImW+5JCeuQeKkm5NMpJWZG3hSuFU='",
      "'sha256-5orR6+MXr1AYH0I8n3Rd2bLgmR1aR6lhbu+LkGq1hHc='",
    ],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      // Supabase
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://*.supabase.com',
      'wss://*.supabase.com',
      // Stripe
      'https://api.stripe.com',
      // PostHog
      'https://app.posthog.com',
      // Development
      ...(isDev ? ['http://localhost:*', 'ws://localhost:*'] : []),
    ],
    'frame-src': [
      "'self'",
      // Supabase Auth
      'https://*.supabase.co',
      'https://*.supabase.com',
      // Stripe
      'https://js.stripe.com',
      'https://checkout.stripe.com',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': isDev ? [] : [''],
  }

  return Object.entries(policies)
    .filter(([_, values]) => values.length > 0)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

/**
 * Middleware to add CSP headers with nonce
 */
export function addCSPHeaders(headers: Headers, isDev: boolean): Headers {
  const nonce = generateNonce()
  const csp = generateCSP(nonce, isDev)

  headers.set('Content-Security-Policy', csp)
  headers.set('X-CSP-Nonce', nonce)

  return headers
}
