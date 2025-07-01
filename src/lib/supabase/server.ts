import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { env } from '@/lib/env'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
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
      global: {
        headers: {
          'x-application-name': 'works-boilerplate',
        },
      },
    }
  )
}

export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Ignore cookie setting errors in Server Components
        }
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
