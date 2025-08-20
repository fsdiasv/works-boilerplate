import { NextResponse, type NextRequest } from 'next/server'

import { validateOAuthStateFromRequest, createClearStateHeaders } from '@/lib/oauth-state'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  let { searchParams } = new URL(request.url)

  // Debug logging to understand what parameters are being received
  // console.log('🔍 Auth callback received with URL:', request.url)
  // console.log('🔍 Query parameters:', Object.fromEntries(searchParams.entries()))

  // Check if the URL has double-encoded parameters (Supabase email issue)
  const rawToken = searchParams.get('token')
  if (rawToken !== null && rawToken !== '' && rawToken.includes('=') && rawToken.includes('&')) {
    // The parameters are encoded as a single 'token' parameter
    // Decode and reconstruct the URL
    const decodedParams = decodeURIComponent(rawToken)
    const properUrl = new URL(request.url)
    properUrl.search = `?${decodedParams}`

    // Add any other parameters that might exist
    const redirectTo = searchParams.get('redirect_to')
    if (redirectTo !== null && redirectTo !== '') {
      properUrl.searchParams.set('redirect_to', redirectTo)
    }

    searchParams = properUrl.searchParams
  }

  // Get parameters from the URL
  const next = searchParams.get('next') ?? '/dashboard'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const error_code = searchParams.get('error_code')

  // Get user's preferred locale from cookie or default to 'en'
  const locale = request.cookies.get('locale')?.value ?? 'en'

  // Handle errors from Supabase
  if (error !== null && error !== '') {
    // Handle specific error codes
    if (error_code === 'otp_expired') {
      // Extract email from error_description if possible
      const emailMatch = error_description?.match(/([^\s]+@[^\s]+)/)
      const email = emailMatch?.[1]

      // Redirect to resend verification page
      const resendUrl = new URL(`/${locale}/auth/resend-verification`, request.url)
      if (email !== undefined && email !== '') {
        resendUrl.searchParams.set('email', email)
      }
      resendUrl.searchParams.set('reason', 'expired_link')
      return NextResponse.redirect(resendUrl)
    }

    return NextResponse.redirect(
      new URL(
        `/${locale}/auth/login?error=${encodeURIComponent(error_description ?? error)}`,
        request.url
      )
    )
  }

  // Handle email confirmation tokens (signup, recovery, invite, etc.)
  // Look for token_hash parameter (PKCE flow) or token parameter (older flow)
  const token_hash = searchParams.get('token_hash')
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  // console.log('🔍 Token parameters:', { token_hash, token, type })

  if (
    (token_hash !== null && token_hash !== '' && type !== null && type !== '') ||
    (token !== null && token !== '' && type !== null && type !== '')
  ) {
    const supabase = await createClient()

    try {
      // Use verifyOtp for email verification (PKCE flow)
      if (token_hash !== null && token_hash !== '') {
        // console.log('📧 Processing email verification with token_hash (PKCE flow)...')
        // console.log('🔑 Token hash:', token_hash)
        // console.log('📝 Type:', type)
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as 'signup' | 'recovery' | 'invite' | 'email',
        })

        if (verifyError) {
          console.error('❌ Email verification failed:', verifyError)

          if (verifyError.message.includes('expired')) {
            const resendUrl = new URL(`/${locale}/auth/resend-verification`, request.url)
            resendUrl.searchParams.set('reason', 'expired_link')
            return NextResponse.redirect(resendUrl)
          }

          return NextResponse.redirect(
            new URL(
              `/${locale}/auth/login?error=${encodeURIComponent(verifyError.message)}`,
              request.url
            )
          )
        }
      } else if (token !== null && token !== '') {
        // Fallback for older token format
        // console.log('📧 Processing email verification with token (legacy flow)...')
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as 'signup' | 'recovery' | 'invite' | 'email',
        })

        if (verifyError) {
          console.error('❌ Email verification failed:', verifyError)

          if (verifyError.message.includes('expired')) {
            const resendUrl = new URL(`/${locale}/auth/resend-verification`, request.url)
            resendUrl.searchParams.set('reason', 'expired_link')
            return NextResponse.redirect(resendUrl)
          }

          return NextResponse.redirect(
            new URL(
              `/${locale}/auth/login?error=${encodeURIComponent(verifyError.message)}`,
              request.url
            )
          )
        }
      }

      // Successful verification - redirect based on type
      if (type === 'recovery') {
        // console.log('✅ Recovery token verified successfully, setting recovery_flow cookie')
        // Set a flag in the response to indicate recovery flow
        // This will be checked by the auth context to prevent auto-redirect
        const response = NextResponse.redirect(
          new URL(`/${locale}/auth/reset-password`, request.url)
        )
        response.cookies.set('recovery_flow', 'true', {
          maxAge: 300, // 5 minutes to handle slow connections and page load times
          httpOnly: false, // Allow JavaScript to read it
          sameSite: 'strict',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        })
        // console.log(
        //   '🍪 Recovery flow cookie set, redirecting to:',
        //   `/${locale}/auth/reset-password`
        // )
        return response
      }

      if (type === 'signup') {
        // For signup, redirect to login with success message
        return NextResponse.redirect(new URL(`/${locale}/auth/login?verified=true`, request.url))
      }

      // For other types, redirect to the next URL or dashboard
      return NextResponse.redirect(new URL(`/${locale}${next}`, request.url))
    } catch {
      return NextResponse.redirect(
        new URL(
          `/${locale}/auth/login?error=${encodeURIComponent('An unexpected error occurred')}`,
          request.url
        )
      )
    }
  }

  // Handle OAuth callbacks AND default Supabase email verification links
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // console.log('🔍 Code parameter:', code)
  // console.log('🔍 State parameter:', state)

  if (code !== null && code !== '') {
    // Check if this is an email verification by looking for UUID format
    // Email verification codes from Supabase are UUIDs
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code)
    const isOAuthCallback = state !== null && state !== ''

    // If it's a UUID and no state, it's likely email verification with default template
    if (isUUID && !isOAuthCallback) {
      // console.log('📧 UUID code detected without state, attempting email verification...')
      // This is an email verification using default Supabase template
      // Default template sends ConfirmationURL which uses PKCE flow
      // We need to exchange the code but without code_verifier validation
      const supabase = await createClient()

      try {
        // First try verifyOtp with the code as token_hash
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: code,
          type: 'signup',
        })

        if (verifyError) {
          // console.error('❌ verifyOtp failed, trying exchangeCodeForSession:', verifyError)

          // If verifyOtp fails, redirect with generic error
          // Avoid exposing internal implementation details
          return NextResponse.redirect(
            new URL(
              `/${locale}/auth/login?error=${encodeURIComponent('Email verification failed. Please try again or contact support.')}`,
              request.url
            )
          )
        }

        // console.log('✅ Email verification successful')
        return NextResponse.redirect(new URL(`/${locale}/auth/login?verified=true`, request.url))
      } catch {
        // console.error('❌ Unexpected error during email verification:', err)
        return NextResponse.redirect(
          new URL(
            `/${locale}/auth/login?error=${encodeURIComponent('An unexpected error occurred')}`,
            request.url
          )
        )
      }
    }

    if (!isOAuthCallback) {
      // Non-UUID code without state - unclear what this is
      // console.log('⚠️ Non-UUID code without state, unclear origin')
      return NextResponse.redirect(
        new URL(
          `/${locale}/auth/login?error=${encodeURIComponent('Invalid authentication request')}`,
          request.url
        )
      )
    }

    // console.log('🔐 Processing as OAuth callback with state validation...')
    // Validate OAuth state for CSRF protection
    const isValidState = validateOAuthStateFromRequest(request, state)

    if (!isValidState) {
      // State validation failed - possible CSRF attack
      const response = NextResponse.redirect(
        new URL(`/${locale}/auth/login?error=security_error`, request.url)
      )

      // Clear the state cookie
      const clearHeaders = createClearStateHeaders()
      Object.entries(clearHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    }

    const supabase = await createClient()

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        const response = NextResponse.redirect(
          new URL(`/${locale}/auth/login?error=oauth_error`, request.url)
        )

        // Clear the state cookie even on error
        const clearHeaders = createClearStateHeaders()
        Object.entries(clearHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })

        return response
      }

      // Successful OAuth login - clear state cookie and redirect
      const response = NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))

      const clearHeaders = createClearStateHeaders()
      Object.entries(clearHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    } catch {
      const response = NextResponse.redirect(
        new URL(`/${locale}/auth/login?error=unexpected_error`, request.url)
      )

      // Clear the state cookie even on error
      const clearHeaders = createClearStateHeaders()
      Object.entries(clearHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
    }
  }

  // If no token, code, or error, redirect to login
  return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
}
