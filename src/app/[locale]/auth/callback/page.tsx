import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const code = params.code as string | undefined
  const next = (params.next as string | undefined) ?? '/dashboard'
  const error = params.error as string | undefined
  const error_description = params.error_description as string | undefined

  if (error !== undefined && error !== '') {
    // Handle OAuth error
    console.error('OAuth error:', error, error_description)
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error_description ?? error)}`,
        process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
      )
    )
  }

  if (code !== undefined && code !== '') {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Successful authentication
      return NextResponse.redirect(
        new URL(next, process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
      )
    }

    // Handle exchange error
    console.error('Code exchange error:', exchangeError)
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(exchangeError.message)}`,
        process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
      )
    )
  }

  // No code or error - redirect to login
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000')
  )
}
