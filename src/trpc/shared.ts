import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server'
import superjson from 'superjson'

import { env } from '@/lib/env'
import { type AppRouter } from '@/server/api/root'

export const transformer = superjson

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (env.VERCEL_URL !== undefined && env.VERCEL_URL !== '') {
    return `https://${env.VERCEL_URL}`
  }
  return `http://localhost:${env.PORT}`
}

export function getUrl() {
  return `${getBaseUrl()}/api/trpc`
}

export type RouterInputs = inferRouterInputs<AppRouter>
export type RouterOutputs = inferRouterOutputs<AppRouter>
