import { z } from 'zod'

// Input validation schemas
const nonceSchema = z.string().min(1)
const isDevSchema = z.boolean()

/**
 * Generates a cryptographically secure random nonce for Content Security Policy.
 * The nonce is used to allow specific inline scripts and styles while maintaining security.
 *
 * @returns A base64-encoded random string suitable for use as a CSP nonce
 */
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

/**
 * Generates a comprehensive Content Security Policy header with nonce support.
 *
 * This function creates a strict CSP that:
 * - Prevents XSS attacks by restricting script and style sources
 * - Uses nonces for inline scripts/styles instead of unsafe-inline
 * - Restricts connections to trusted domains only
 * - Prevents clickjacking with frame-ancestors
 * - Enforces HTTPS in production with upgrade-insecure-requests
 *
 * @param nonce - A cryptographically secure random string for inline script/style authorization
 * @param isDev - Whether the application is running in development mode
 * @returns A formatted CSP header string
 *
 * @example
 * const nonce = generateNonce()
 * const csp = generateCSP(nonce, process.env.NODE_ENV === 'development')
 */
export function generateCSP(nonce: string, isDev: boolean): string {
  // Validate inputs
  nonceSchema.parse(nonce)
  isDevSchema.parse(isDev)
  const policies = {
    // Fallback for all resources not covered by other directives
    'default-src': ["'self'"],

    // Script sources - strict control to prevent XSS
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`, // Allow our inline scripts with matching nonce
      // Trusted external script sources
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      // Development only: eval needed for hot module replacement
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],

    // Style sources - controlled to prevent CSS injection
    'style-src': [
      "'self'",
      `'nonce-${nonce}'`, // Allow our inline styles with matching nonce
      // Specific hashes for critical CSS that must be inline
      "'sha256-47DEKpj8HBSa+/TImW+5JCeuQeKkm5NMpJWZG3hSuFU='",
      "'sha256-5orR6+MXr1AYH0I8n3Rd2bLgmR1aR6lhbu+LkGq1hHc='",
    ],

    // Image sources - allow various image formats and sources
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],

    // Font sources
    'font-src': ["'self'", 'data:'],

    // XMLHttpRequest, WebSocket, and EventSource connections
    'connect-src': [
      "'self'",
      // Supabase realtime and API connections
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://*.supabase.com',
      'wss://*.supabase.com',
      // Payment processing
      'https://api.stripe.com',
      // Analytics
      'https://app.posthog.com',
      // Development servers
      ...(isDev ? ['http://localhost:*', 'ws://localhost:*'] : []),
    ],

    // Frame/iframe sources
    'frame-src': [
      "'self'",
      // OAuth and auth flows
      'https://*.supabase.co',
      'https://*.supabase.com',
      // Payment iframe embeds
      'https://js.stripe.com',
      'https://checkout.stripe.com',
    ],

    // Plugin sources (Flash, Java, etc.) - disabled for security
    'object-src': ["'none'"],

    // Restricts the URLs that can be used in <base> element
    'base-uri': ["'self'"],

    // Form submission destinations
    'form-action': ["'self'"],

    // Prevents clickjacking by controlling embedding
    'frame-ancestors': ["'none'"],

    // Force HTTPS in production
    'upgrade-insecure-requests': isDev ? [] : [''],
  }

  return Object.entries(policies)
    .filter(([_, values]) => values.length > 0)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

// Input validation schema for Headers
const headersSchema = z.instanceof(Headers)

/**
 * Middleware function to add Content Security Policy headers with a fresh nonce.
 *
 * This function:
 * - Generates a new cryptographically secure nonce for each request
 * - Creates a comprehensive CSP header tailored to the environment
 * - Adds the nonce to response headers for use by the application
 *
 * The X-CSP-Nonce header allows server-side rendered pages to access
 * the nonce and apply it to inline scripts and styles.
 *
 * @param headers - The Headers object to modify
 * @param isDev - Whether the application is running in development mode
 * @returns The modified Headers object with CSP headers added
 * @throws {ZodError} If headers is not a valid Headers instance or isDev is not a boolean
 *
 * @example
 * const headers = new Headers()
 * addCSPHeaders(headers, false)
 * // headers now contains Content-Security-Policy and X-CSP-Nonce
 */
export function addCSPHeaders(headers: Headers, isDev: boolean): Headers {
  // Validate inputs
  headersSchema.parse(headers)
  isDevSchema.parse(isDev)

  const nonce = generateNonce()
  const csp = generateCSP(nonce, isDev)

  headers.set('Content-Security-Policy', csp)
  headers.set('X-CSP-Nonce', nonce)

  return headers
}
