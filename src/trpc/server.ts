import { headers } from 'next/headers'
import { cache } from 'react'

import { createCaller } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

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
      url: new URL('http://localhost:3000'),
    },
  })
})

export const api = createCaller(createContext)
