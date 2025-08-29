/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { TRPCError } from '@trpc/server'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import crypto from 'crypto'

import {
  createTRPCRouter,
  protectedProcedure,
  workspaceAdminProcedure,
  workspaceOwnerProcedure,
  workspaceMemberProcedure,
} from '@/server/api/trpc'

// Validation schemas
async function inviteMemberSchema(locale: string) {
  const tAuth = await getTranslations({ locale, namespace: 'auth.validation' })
  const tWorkspace = await getTranslations({ locale, namespace: 'workspace.validation' })

  return z.object({
    workspaceId: z.string().uuid(tWorkspace('invalidWorkspaceId')),
    email: z.string().email(tAuth('invalidEmail')),
    role: z.enum(['admin', 'member'] as const),
  })
}

// Helper to send invitation email
async function sendInvitationEmail(_params: {
  to: string
  inviterName: string
  workspaceName: string
  invitationToken: string
  locale: string
}) {
  // TODO: Implement email sending with Resend
}

export const membersRouter = createTRPCRouter({
  // List workspace members with pagination
  list: workspaceMemberProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to this workspace
      const userMembership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!userMembership) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this workspace',
        })
      }

      // Fetch members with cursor-based pagination
      const members = await ctx.db.workspaceMember.findMany({
        where: { workspaceId: input.workspaceId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              lastActiveAt: true,
            },
          },
        },
        take: input.limit + 1,
        ...(input.cursor !== undefined && input.cursor !== ''
          ? {
              cursor: {
                userId_workspaceId: {
                  userId: input.cursor,
                  workspaceId: input.workspaceId,
                },
              },
              skip: 1,
            }
          : {}),
        orderBy: [
          {
            role: 'asc', // Owner first, then admin, then member
          },
          {
            joinedAt: 'asc',
          },
        ],
      })

      let nextCursor: string | undefined = undefined
      if (members.length > input.limit) {
        const nextItem = members.pop()
        nextCursor = nextItem!.userId
      }

      return {
        members,
        nextCursor,
      }
    }),

  // Send invitation to join workspace
  invite: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        email: z.string(),
        role: z.enum(['admin', 'member'] as const),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate with translations
      const schema = await inviteMemberSchema(ctx.locale)
      const validatedInput = schema.parse(input)

      // Verify user can invite to this workspace
      const userMembership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: validatedInput.workspaceId,
          },
        },
      })

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to invite members to this workspace',
        })
      }

      // Check if user already exists and is a member
      const existingUser = await ctx.db.user.findUnique({
        where: { email: validatedInput.email },
      })

      if (existingUser) {
        const existingMember = await ctx.db.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: existingUser.id,
              workspaceId: validatedInput.workspaceId,
            },
          },
        })

        if (existingMember) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'User is already a member of this workspace',
          })
        }
      }

      // Check for existing pending invitation
      const existingInvitation = await ctx.db.invitation.findFirst({
        where: {
          workspaceId: validatedInput.workspaceId,
          email: validatedInput.email,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
      })

      if (existingInvitation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An invitation has already been sent to this email',
        })
      }

      // Get workspace details
      const workspace = await ctx.db.workspace.findUnique({
        where: { id: validatedInput.workspaceId },
      })

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }

      // Create invitation
      const invitation = await ctx.db.invitation.create({
        data: {
          workspaceId: validatedInput.workspaceId,
          email: validatedInput.email,
          role: validatedInput.role,
          invitedById: ctx.user!.id,
          token: crypto.randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      // Send invitation email
      await sendInvitationEmail({
        to: validatedInput.email,
        inviterName: ctx.user!.email ?? 'Unknown',
        workspaceName: workspace.name,
        invitationToken: invitation.token,
        locale: ctx.locale,
      })

      return invitation
    }),

  // Remove member from workspace
  remove: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user can remove members from this workspace
      const userMembership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to remove members from this workspace',
        })
      }

      // Get member to remove
      const memberToRemove = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!memberToRemove) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found in this workspace',
        })
      }

      // Cannot remove workspace owner
      if (memberToRemove.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove the workspace owner',
        })
      }

      // Admins cannot remove other admins
      if (userMembership.role === 'admin' && memberToRemove.role === 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Admins cannot remove other admins',
        })
      }

      // Remove member
      await ctx.db.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
      })

      // If removed user had this as active workspace, clear it
      const removedUser = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { activeWorkspaceId: true },
      })

      if (removedUser?.activeWorkspaceId === input.workspaceId) {
        // Find another workspace for the user
        const anotherWorkspace = await ctx.db.workspaceMember.findFirst({
          where: {
            userId: input.userId,
            workspaceId: { not: input.workspaceId },
          },
          select: { workspaceId: true },
        })

        await ctx.db.user.update({
          where: { id: input.userId },
          data: { activeWorkspaceId: anotherWorkspace?.workspaceId ?? null },
        })
      }

      return { success: true }
    }),

  // Update member role
  updateRole: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(['admin', 'member'] as const),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const userMembership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!userMembership || userMembership.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners can change member roles',
        })
      }

      // Get target member
      const targetMember = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!targetMember) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found in this workspace',
        })
      }

      // Cannot change owner role
      if (targetMember.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot change the role of workspace owner',
        })
      }

      // Update role
      const updatedMember = await ctx.db.workspaceMember.update({
        where: {
          userId_workspaceId: {
            userId: input.userId,
            workspaceId: input.workspaceId,
          },
        },
        data: { role: input.role },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      })

      return updatedMember
    }),

  // Leave workspace (for members)
  leave: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!membership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'You are not a member of this workspace',
        })
      }

      // Cannot leave if owner
      if (membership.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message:
            'Workspace owners cannot leave. Transfer ownership or delete the workspace instead.',
        })
      }

      // Remove membership
      await ctx.db.workspaceMember.delete({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      // If this was active workspace, switch to another
      if (ctx.activeWorkspace?.id === input.workspaceId) {
        const anotherWorkspace = await ctx.db.workspaceMember.findFirst({
          where: {
            userId: ctx.user!.id,
            workspaceId: { not: input.workspaceId },
          },
          select: { workspaceId: true },
        })

        await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: { activeWorkspaceId: anotherWorkspace?.workspaceId ?? null },
        })
      }

      return { success: true }
    }),

  // Transfer ownership
  transferOwnership: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        newOwnerId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user!.id === input.newOwnerId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are already the owner of this workspace',
        })
      }

      // Verify current ownership
      const currentOwnership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!currentOwnership || currentOwnership.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the current owner can transfer ownership',
        })
      }

      // Verify new owner is a member
      const newOwnerMembership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: input.newOwnerId,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!newOwnerMembership) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'New owner must be a current member of the workspace',
        })
      }

      // Transfer ownership in a transaction
      await ctx.db.$transaction([
        // Update new owner to owner role
        ctx.db.workspaceMember.update({
          where: {
            userId_workspaceId: {
              userId: input.newOwnerId,
              workspaceId: input.workspaceId,
            },
          },
          data: { role: 'owner' },
        }),
        // Update current owner to admin role
        ctx.db.workspaceMember.update({
          where: {
            userId_workspaceId: {
              userId: ctx.user!.id,
              workspaceId: input.workspaceId,
            },
          },
          data: { role: 'admin' },
        }),
      ])

      return { success: true }
    }),
})
