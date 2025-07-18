'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useEffect } from 'react'

export function AuthErrorHandler() {
  const router = useRouter()
  const locale = useLocale()

  useEffect(() => {
    // Check if we have auth error parameters in the URL fragment
    const hash = window.location.hash.slice(1) // Remove the #
    if (!hash) return

    // Parse the fragment parameters
    const params = new URLSearchParams(hash)
    const error = params.get('error')
    const errorCode = params.get('error_code')
    const errorDescription = params.get('error_description')

    // If we have auth errors, redirect to the appropriate page
    if ((error !== null && error !== '') || (errorCode !== null && errorCode !== '')) {
      // Handle specific error codes
      if (errorCode === 'otp_expired') {
        // Extract email from error description if possible
        const emailMatch = errorDescription?.match(/([^\s]+@[^\s]+)/)
        const email = emailMatch?.[1]

        // Redirect to resend verification page
        const resendUrl = `/${locale}/auth/resend-verification${
          email !== undefined && email !== '' ? `?email=${encodeURIComponent(email)}` : ''
        }&reason=expired_link`
        router.push(resendUrl)
      } else if (error === 'access_denied') {
        // Generic access denied, redirect to login
        router.push(`/${locale}/auth/login?error=access_denied`)
      } else {
        // Any other error, redirect to login with error message
        const errorParam = errorDescription ?? error ?? 'unexpected_error'
        router.push(`/${locale}/auth/login?error=${encodeURIComponent(errorParam)}`)
      }
    }
  }, [router, locale])

  return null
}
