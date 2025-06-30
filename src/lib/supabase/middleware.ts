import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/lib/env'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
      auth: {
        persistSession: true,
        storageKey: 'works-auth',
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development',
      },
    }
  )

  // IMPORTANT: Refresh the session to avoid issues with expired auth tokens
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // If there's an error getting the user, clear the auth cookies
  if (error) {
    supabaseResponse.cookies.delete('sb-auth-token')
    supabaseResponse.cookies.delete('sb-refresh-token')
  }

  return {
    supabase,
    response: supabaseResponse,
    user,
  }
}
