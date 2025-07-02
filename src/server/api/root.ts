import { authRouter } from '@/server/api/routers/auth'
import { invitationRouter } from '@/server/api/routers/invitation'
import { membersRouter } from '@/server/api/routers/members'
import { workspaceRouter } from '@/server/api/routers/workspace'
import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc'

export const appRouter = createTRPCRouter({
  auth: authRouter,
  workspace: workspaceRouter,
  members: membersRouter,
  invitation: invitationRouter,
})

export type AppRouter = typeof appRouter

export const createCaller = createCallerFactory(appRouter)
