import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/lib/env'
import type { Database } from '@/types/supabase'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        storageKey: 'works-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        debug: process.env.NODE_ENV === 'development',
      },
      global: {
        headers: {
          'x-application-name': 'works-boilerplate',
        },
      },
    }
  )

  return client
}
