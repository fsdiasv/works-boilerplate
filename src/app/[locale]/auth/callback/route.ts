import { NextResponse, type NextRequest } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const { searchParams } = new URL(request.url)

  // Get parameters from the URL
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? `/${locale}/dashboard`
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // Handle errors from Supabase
  if (error !== null && error !== '') {
    console.error('Auth callback error:', error, error_description)
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
        console.error('Token verification error:', verifyError)
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

      // For signup and other types, redirect to the next URL or dashboard
      return NextResponse.redirect(new URL(next, request.url))
    } catch (err) {
      console.error('Unexpected error during token verification:', err)
      return NextResponse.redirect(
        new URL(
          `/${locale}/auth/login?error=${encodeURIComponent('An unexpected error occurred')}`,
          request.url
        )
      )
    }
  }

  // If no token or error, redirect to login
  return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))
}
