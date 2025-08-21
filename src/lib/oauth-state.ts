/**
 * OAuth state management utilities for CSRF protection
 */

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const OAUTH_STATE_COOKIE_NAME = 'oauth_state'
const OAUTH_STATE_EXPIRY = 30 * 60 * 1000 // 30 minutes in milliseconds

/**
 * Generates a cryptographically secure random state parameter
 */
export function generateOAuthState(): string {
  // Generate 32 random bytes and convert to hex
  const array = new Uint8Array(32)

  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto API (should not happen in modern browsers/Node)
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Sets OAuth state in secure httpOnly cookie (server-side)
 */
export async function setOAuthStateCookie(state: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(OAUTH_STATE_EXPIRY / 1000), // Convert to seconds
    path: '/',
  })
}

/**
 * Gets OAuth state from httpOnly cookie (server-side)
 */
export async function getOAuthStateCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value ?? null
}

/**
 * Validates OAuth state and clears the cookie
 */
export async function validateAndClearOAuthState(receivedState: string | null): Promise<boolean> {
  if (receivedState === null || receivedState === '') {
    return false
  }

  const storedState = await getOAuthStateCookie()

  if (storedState === null || storedState === '') {
    return false
  }

  // Clear the cookie immediately after checking
  const cookieStore = await cookies()
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME)

  // Validate states match
  return receivedState === storedState
}

/**
 * Gets OAuth state from request cookies (for middleware/callback routes)
 */
export function getOAuthStateFromRequest(request: NextRequest): string | null {
  return request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value ?? null
}

/**
 * Validates OAuth state from request and clears cookie
 */
export function validateOAuthStateFromRequest(
  request: NextRequest,
  receivedState: string | null
): boolean {
  if (receivedState === null || receivedState === '') {
    return false
  }

  const storedState = getOAuthStateFromRequest(request)

  if (storedState === null || storedState === '') {
    return false
  }

  // Note: Cookie clearing in middleware/callback routes needs to be handled
  // by setting the cookie with maxAge: 0 in the response

  return receivedState === storedState
}

/**
 * Creates response headers to clear OAuth state cookie
 */
export function createClearStateHeaders(): Record<string, string> {
  return {
    'Set-Cookie': `${OAUTH_STATE_COOKIE_NAME}=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Max-Age=0`,
  }
}
