import { headers } from 'next/headers'
import { cache } from 'react'

import { env } from '@/lib/env'
import { createCaller } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

/**
 * Creates a cached tRPC context for server-side calls in Next.js RSC environment.
 *
 * This function constructs a mock request/response context compatible with tRPC's
 * expected interface, enabling server-side procedure calls with proper headers
 * and metadata propagation.
 *
 * @returns Promise resolving to tRPC context with Supabase client and user session
 */
const createContext = cache(async () => {
  const heads = new Headers(await headers())
  heads.set('x-trpc-source', 'rsc')

  return createTRPCContext({
    req: { headers: heads } as Request,
    resHeaders: new Headers(),
    info: {
      isBatchCall: false,
      calls: [],
      type: 'unknown' as const,
      connectionParams: null,
      accept: null,
      signal: new AbortController().signal,
      url: new URL(env.NEXT_PUBLIC_APP_URL),
    },
  })
})

export const api = createCaller(createContext)
