import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  let { searchParams } = new URL(request.url)

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
  const token = searchParams.get('token')
  const type = searchParams.get('type')
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
  if (token !== null && token !== '' && type !== null && type !== '') {
    const supabase = await createClient()

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type as 'signup' | 'recovery' | 'invite' | 'email',
      })

      if (verifyError) {
        return NextResponse.redirect(
          new URL(
            `/${locale}/auth/login?error=${encodeURIComponent(verifyError.message)}`,
            request.url
          )
        )
      }

      // Successful verification - redirect based on type
      if (type === 'recovery') {
        return NextResponse.redirect(new URL(`/${locale}/auth/reset-password`, request.url))
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

  // Handle OAuth callbacks
  const code = searchParams.get('code')
  if (code !== null && code !== '') {
    const supabase = await createClient()

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        return NextResponse.redirect(
          new URL(`/${locale}/auth/login?error=oauth_error`, request.url)
        )
      }

      // Successful OAuth login
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
    } catch {
      return NextResponse.redirect(
        new URL(`/${locale}/auth/login?error=unexpected_error`, request.url)
      )
    }
  }

  // If no token, code, or error, redirect to login
  return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
}
