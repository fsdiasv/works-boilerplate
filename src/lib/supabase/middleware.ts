import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { env } from '@/lib/env'
import type { Database } from '@/types/supabase'

/**
 * Updates the Supabase authentication session and synchronizes cookies between request and response.
 *
 * This function creates a Supabase server client configured for SSR with PKCE flow,
 * refreshes the current user session, and handles authentication errors by clearing
 * invalid tokens from response cookies.
 *
 * @param request - The incoming Next.js request with authentication cookies
 * @returns Object containing the Supabase client, updated response, and user data
 */
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
        debug: env.NODE_ENV === 'development',
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
