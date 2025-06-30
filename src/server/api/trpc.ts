import { type User } from '@supabase/supabase-js'
import { initTRPC, TRPCError } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import superjson from 'superjson'
import { ZodError } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/server/db'

interface CreateContextOptions {
  user: User | null
  supabase: Awaited<ReturnType<typeof createClient>>
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    supabase: opts.supabase,
    db,
  }
}

export const createTRPCContext = async (_opts: FetchCreateContextFnOptions) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return createInnerTRPCContext({
    user,
    supabase,
  })
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory

export const createTRPCRouter = t.router

export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      // infers the `user` as non-nullable
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
