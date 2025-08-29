import { randomBytes } from 'crypto'

import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  workspaceAdminProcedure,
} from '@/server/api/trpc'

export const invitationRouter = createTRPCRouter({
  // Get invitation details by token
  get: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.invitation.findFirst({
        where: {
          token: input.token,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              logo: true,
              _count: {
                select: { workspaceMembers: true },
              },
            },
          },
          invitedBy: {
            select: {
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired invitation',
        })
      }

      return invitation
    }),

  // Accept invitation
  accept: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find valid invitation
      const invitation = await ctx.db.invitation.findFirst({
        where: {
          token: input.token,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
            },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid or expired invitation',
        })
      }

      // Check if workspace still exists
      if (invitation.workspace.deletedAt) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'This workspace no longer exists',
        })
      }

      // Get or verify user
      let userId: string

      if (ctx.user) {
        // User is logged in
        userId = ctx.user.id

        // Check if email matches (optional - you might want to allow any logged-in user)
        if (ctx.user.email !== invitation.email) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This invitation was sent to a different email address',
          })
        }
      } else {
        // User needs to sign up or log in first
        // Check if user with this email exists
        const existingUser = await ctx.db.user.findUnique({
          where: { email: invitation.email },
        })

        if (existingUser) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Please log in to accept this invitation',
          })
        } else {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Please sign up with this email to accept the invitation',
          })
        }
      }

      // Check if already a member
      const existingMember = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: invitation.workspaceId,
          },
        },
      })

      if (existingMember) {
        // Already a member, just mark invitation as accepted
        await ctx.db.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        })

        return {
          workspace: invitation.workspace,
          alreadyMember: true,
        }
      }

      // Add user to workspace in a transaction
      const [member] = await ctx.db.$transaction([
        // Add as member
        ctx.db.workspaceMember.create({
          data: {
            userId,
            workspaceId: invitation.workspaceId,
            role: invitation.role,
          },
        }),
        // Mark invitation as accepted
        ctx.db.invitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ])

      // Set as active workspace if user has none
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { activeWorkspaceId: true },
      })

      if (user?.activeWorkspaceId === null || user?.activeWorkspaceId === undefined) {
        await ctx.db.user.update({
          where: { id: userId },
          data: { activeWorkspaceId: invitation.workspaceId },
        })
      }

      return {
        workspace: invitation.workspace,
        membership: member,
        alreadyMember: false,
      }
    }),

  // List pending invitations for a workspace
  listPending: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to workspace
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view invitations for this workspace',
        })
      }

      // Get pending invitations
      const invitations = await ctx.db.invitation.findMany({
        where: {
          workspaceId: input.workspaceId,
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          invitedBy: {
            select: {
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return invitations
    }),

  // Cancel invitation
  cancel: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get invitation
      const invitation = await ctx.db.invitation.findUnique({
        where: { id: input.invitationId },
        include: {
          workspace: {
            select: {
              id: true,
              workspaceMembers: {
                where: { userId: ctx.user.id },
                select: { role: true },
              },
            },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been accepted',
        })
      }

      // Verify user can cancel (inviter or workspace admin/owner)
      const userMembership = invitation.workspace.workspaceMembers[0]
      const canCancel =
        invitation.invitedById === ctx.user.id ||
        (userMembership !== undefined && ['owner', 'admin'].includes(userMembership.role))

      if (!canCancel) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this invitation',
        })
      }

      // Delete invitation
      await ctx.db.invitation.delete({
        where: { id: input.invitationId },
      })

      return { success: true }
    }),

  // Resend invitation email
  resend: protectedProcedure
    .input(
      z.object({
        invitationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get invitation
      const invitation = await ctx.db.invitation.findUnique({
        where: { id: input.invitationId },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              workspaceMembers: {
                where: { userId: ctx.user.id },
                select: { role: true },
              },
            },
          },
        },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if already accepted
      if (invitation.acceptedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been accepted',
        })
      }

      // Check if expired
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has expired',
        })
      }

      // Verify user can resend (workspace admin/owner)
      const userMembership = invitation.workspace.workspaceMembers[0]
      if (!userMembership || !['owner', 'admin'].includes(userMembership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to resend invitations for this workspace',
        })
      }

      // TODO: Resend invitation email

      return { success: true }
    }),

  // List all invitations for a workspace (including accepted and expired)
  list: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const invitations = await ctx.db.invitation.findMany({
        where: {
          workspaceId: input.workspaceId,
        },
        include: {
          invitedBy: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      return invitations
    }),

  // Create a new invitation
  create: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(['admin', 'member']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is already a member
      const existingUser = await ctx.db.user.findUnique({
        where: { email: input.email },
      })

      if (existingUser) {
        const existingMember = await ctx.db.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId: existingUser.id,
              workspaceId: input.workspaceId,
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
          workspaceId: input.workspaceId,
          email: input.email,
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

      // Create invitation
      const invitation = await ctx.db.invitation.create({
        data: {
          workspaceId: input.workspaceId,
          email: input.email,
          role: input.role,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          invitedById: ctx.user!.id,
          token: randomBytes(32).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      })

      // TODO: Send invitation email

      return invitation
    }),

  // Create bulk invitations
  createBulk: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        invitations: z.array(
          z.object({
            email: z.string().email(),
            role: z.enum(['admin', 'member']),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const results = []

      // Get existing members
      const existingUsers = await ctx.db.user.findMany({
        where: {
          email: { in: input.invitations.map(i => i.email) },
        },
        select: {
          id: true,
          email: true,
          workspaceMemberships: {
            where: { workspaceId: input.workspaceId },
            select: { userId: true },
          },
        },
      })

      const existingMemberEmails = new Set(
        existingUsers.filter(u => u.workspaceMemberships.length > 0).map(u => u.email)
      )

      // Get existing pending invitations
      const existingInvitations = await ctx.db.invitation.findMany({
        where: {
          workspaceId: input.workspaceId,
          email: { in: input.invitations.map(i => i.email) },
          acceptedAt: null,
          expiresAt: { gt: new Date() },
        },
        select: { email: true },
      })

      const existingInvitationEmails = new Set(existingInvitations.map(i => i.email))

      // Process each invitation
      for (const invite of input.invitations) {
        if (existingMemberEmails.has(invite.email)) {
          results.push({
            email: invite.email,
            success: false,
            error: 'Already a member',
          })
          continue
        }

        if (existingInvitationEmails.has(invite.email)) {
          results.push({
            email: invite.email,
            success: false,
            error: 'Invitation already sent',
          })
          continue
        }

        try {
          await ctx.db.invitation.create({
            data: {
              workspaceId: input.workspaceId,
              email: invite.email,
              role: invite.role,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              invitedById: ctx.user!.id,
              token: randomBytes(32).toString('hex'),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          })

          // TODO: Send invitation email

          results.push({
            email: invite.email,
            success: true,
          })
        } catch {
          results.push({
            email: invite.email,
            success: false,
            error: 'Failed to create invitation',
          })
        }
      }

      return results
    }),
})
