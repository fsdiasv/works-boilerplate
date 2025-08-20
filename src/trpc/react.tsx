'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { loggerLink, unstable_httpBatchStreamLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState } from 'react'

import { type AppRouter } from '@/server/api/root'

import { getUrl, transformer } from './shared'

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: failureCount => {
          // Retry up to 2 times for network errors
          return failureCount < 2
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

let clientQueryClientSingleton: QueryClient | undefined = undefined

const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient()
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= createQueryClient())
}

export const api = createTRPCReact<AppRouter>()

export function TRPCReactProvider(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        loggerLink({
          enabled: op => {
            // Skip logging for aborted requests
            if (
              op.direction === 'down' &&
              op.result instanceof Error &&
              (op.result.message === 'The user aborted a request.' ||
                op.result.name === 'AbortError' ||
                op.result.message.includes('AbortError'))
            ) {
              return false
            }

            return (
              process.env.NODE_ENV === 'development' ||
              (op.direction === 'down' && op.result instanceof Error)
            )
          },
        }),
        unstable_httpBatchStreamLink({
          transformer,
          url: getUrl(),
          headers() {
            const headers = new Headers()
            headers.set('x-trpc-source', 'nextjs-react')
            // Pass the current pathname for locale detection
            if (typeof window !== 'undefined') {
              headers.set('x-pathname', window.location.pathname)
            }
            return headers
          },
        }),
      ],
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <api.Provider client={trpcClient} queryClient={queryClient}>
        {props.children}
      </api.Provider>
    </QueryClientProvider>
  )
}
