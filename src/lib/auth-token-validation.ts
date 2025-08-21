/**
 * Auth token validation utilities for secure token handling
 */

import { useState, useEffect } from 'react'

export type TokenType = 'recovery' | 'invite' | 'email' | 'signup'

export interface TokenValidationResult {
  isValid: boolean
  error?: string
  expired?: boolean
}

/**
 * Validates auth token format without consuming the token
 * Note: This only performs format validation, not server-side verification
 * to avoid consuming single-use tokens
 */
export function validateAuthToken(token: string, type: TokenType): TokenValidationResult {
  try {
    // Basic format validation
    if (!token || token.length < 10) {
      return {
        isValid: false,
        error: 'Invalid token format',
      }
    }

    // PKCE token format validation
    if (token.startsWith('pkce_')) {
      // PKCE tokens should have a specific format
      if (token.length < 20) {
        return {
          isValid: false,
          error: 'Invalid PKCE token format',
        }
      }
      return { isValid: true }
    }

    // UUID format validation for regular tokens
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(token)) {
      return { isValid: true }
    }

    // Check for URL-encoded tokens
    if (token.includes('%') || token.includes('+')) {
      try {
        const decodedToken = decodeURIComponent(token)
        if (uuidRegex.test(decodedToken)) {
          return { isValid: true }
        }
      } catch {
        // Invalid URL encoding
      }
    }

    // Check for base64 encoded tokens (recovery tokens are sometimes base64)
    if (type === 'recovery' && token.match(/^[A-Za-z0-9+/]+=*$/)) {
      return { isValid: true }
    }

    return {
      isValid: false,
      error: 'Invalid token format',
    }
  } catch {
    return {
      isValid: false,
      error: 'Unexpected error during validation',
    }
  }
}

/**
 * Hook for token validation with loading state
 */
export function useTokenValidation(token: string | null, type: TokenType) {
  const [validationState, setValidationState] = useState<{
    loading: boolean
    result: TokenValidationResult | null
  }>({
    loading: false,
    result: null,
  })

  useEffect(() => {
    if (token === null || token === '') {
      setValidationState({
        loading: false,
        result: { isValid: false, error: 'No token provided' },
      })
      return
    }

    setValidationState({ loading: true, result: null })

    // Since validateAuthToken is now synchronous, we can call it directly
    try {
      const result = validateAuthToken(token, type)
      setValidationState({ loading: false, result })
    } catch {
      setValidationState({
        loading: false,
        result: { isValid: false, error: 'Validation failed' },
      })
    }
  }, [token, type])

  return validationState
}
