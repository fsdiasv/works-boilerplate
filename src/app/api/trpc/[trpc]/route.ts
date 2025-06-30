import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'

import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

const createContext = async (req: NextRequest) => {
  return createTRPCContext({
    req,
    resHeaders: new Headers(),
    info: {
      isBatchCall: false,
      calls: [],
      type: 'unknown',
      connectionParams: null,
      accept: null,
      signal: new AbortController().signal,
      url: new URL(req.url),
    },
  })
}

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError: opts => {
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ tRPC failed on ${opts.path ?? '<no-path>'}: ${opts.error.message}`)
      }
    },
  })

export { handler as GET, handler as POST }
