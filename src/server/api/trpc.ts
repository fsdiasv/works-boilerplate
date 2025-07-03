import { type Workspace, type WorkspaceRole } from '@prisma/client'
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
  locale: string
  activeWorkspace: Workspace | null
  userRole: WorkspaceRole | null
}

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    user: opts.user,
    supabase: opts.supabase,
    db,
    locale: opts.locale,
    activeWorkspace: opts.activeWorkspace,
    userRole: opts.userRole,
  }
}

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Extract locale from request headers
  const headers = opts.req.headers
  const pathname = headers.get('x-pathname') ?? ''
  const locale = pathname !== '' ? (pathname.split('/')[1] ?? 'en') : 'en'

  // Get active workspace and user role if user is authenticated
  let activeWorkspace: Workspace | null = null
  let userRole: WorkspaceRole | null = null

  if (user) {
    // Get user's active workspace
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        activeWorkspace: true,
        workspaceMemberships: true,
      },
    })

    if (dbUser && dbUser.activeWorkspaceId !== null && dbUser.activeWorkspace !== null) {
      activeWorkspace = dbUser.activeWorkspace

      // Get user's role in the active workspace
      const membership = dbUser.workspaceMemberships.find(
        m => m.workspaceId === dbUser.activeWorkspaceId
      )
      userRole = membership?.role ?? null
    }
  }

  return createInnerTRPCContext({
    user,
    supabase,
    locale,
    activeWorkspace,
    userRole,
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
      ...ctx,
      // infers the `user` as non-nullable
      user: ctx.user,
    },
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)

// Workspace member middleware - ensures user has an active workspace
const enforceWorkspaceMember = t.middleware(({ ctx, next }) => {
  if (!ctx.activeWorkspace || !ctx.userRole) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No active workspace. Please select or create a workspace.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      activeWorkspace: ctx.activeWorkspace,
      userRole: ctx.userRole,
    },
  })
})

// Workspace admin middleware - ensures user is admin or owner
const enforceWorkspaceAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.activeWorkspace || !ctx.userRole) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No active workspace. Please select or create a workspace.',
    })
  }
  if (!['owner', 'admin'].includes(ctx.userRole)) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required for this operation.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      activeWorkspace: ctx.activeWorkspace,
      userRole: ctx.userRole,
    },
  })
})

// Workspace owner middleware - ensures user is owner
const enforceWorkspaceOwner = t.middleware(({ ctx, next }) => {
  if (!ctx.activeWorkspace || !ctx.userRole) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'No active workspace. Please select or create a workspace.',
    })
  }
  if (ctx.userRole !== 'owner') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Owner access required for this operation.',
    })
  }
  return next({
    ctx: {
      ...ctx,
      activeWorkspace: ctx.activeWorkspace,
      userRole: ctx.userRole,
    },
  })
})

export const workspaceMemberProcedure = protectedProcedure.use(enforceWorkspaceMember)
export const workspaceAdminProcedure = protectedProcedure.use(enforceWorkspaceAdmin)
export const workspaceOwnerProcedure = protectedProcedure.use(enforceWorkspaceOwner)
