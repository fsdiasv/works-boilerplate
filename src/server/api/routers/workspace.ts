import { TRPCError } from '@trpc/server'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'

import { validateWorkspaceSlugSecurity, sanitizeAuthInput } from '@/lib/auth-security'
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  workspaceAdminProcedure,
  workspaceOwnerProcedure,
} from '@/server/api/trpc'

// Note: The protected procedures guarantee non-null user via middleware
// TypeScript requires non-null assertions due to type inference limitations
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */

// Validation schemas
async function createWorkspaceSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'workspace.validation' })

  return z.object({
    name: z.string().min(2, t('nameMinLength')).max(50, t('nameMaxLength')).trim(),
    slug: z
      .string()
      .min(3, t('slugMinLength'))
      .max(50, t('slugMaxLength'))
      .regex(/^[a-z0-9-]+$/, t('slugInvalid'))
      .trim(),
  })
}

async function updateWorkspaceSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'workspace.validation' })

  return z.object({
    workspaceId: z.string().uuid(t('invalidWorkspaceId')),
    name: z.string().min(2, t('nameMinLength')).max(50, t('nameMaxLength')).trim().optional(),
    slug: z
      .string()
      .min(3, t('slugMinLength'))
      .max(50, t('slugMaxLength'))
      .regex(/^[a-z0-9-]+$/, t('slugInvalid'))
      .trim()
      .optional(),
    logo: z.string().url(t('logoInvalid')).optional().nullable(),
    settings: z.record(z.any()).optional(),
  })
}

export const workspaceRouter = createTRPCRouter({
  // Get active workspace
  getActive: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeWorkspace) {
      return null
    }

    const workspace = await ctx.db.workspace.findFirst({
      where: {
        id: ctx.activeWorkspace.id,
        members: {
          some: { userId: ctx.user!.id },
        },
        deletedAt: null,
      },
      include: {
        members: {
          where: { userId: ctx.user!.id },
          select: { role: true },
        },
        _count: {
          select: { members: true },
        },
      },
    })

    return workspace
  }),

  // Get current user's workspaces
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.workspace.findMany({
      where: {
        members: {
          some: { userId: ctx.user!.id },
        },
        deletedAt: null,
      },
      include: {
        members: {
          where: { userId: ctx.user!.id },
          select: { role: true },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }),

  // Get single workspace details
  get: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspace.findFirst({
        where: {
          id: input.workspaceId,
          members: {
            some: { userId: ctx.user!.id },
          },
          deletedAt: null,
        },
        include: {
          members: {
            where: { userId: ctx.user!.id },
            select: { role: true },
          },
          _count: {
            select: { members: true },
          },
        },
      })

      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Workspace not found',
        })
      }

      return workspace
    }),

  // Create new workspace
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        slug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate with translations
      const schema = await createWorkspaceSchema(ctx.locale)
      const validatedInput = schema.parse(input)

      // Sanitize inputs
      const sanitizedName = sanitizeAuthInput(validatedInput.name)
      const sanitizedSlug = validatedInput.slug.toLowerCase().trim()

      // Additional slug security validation
      const slugSecurity = validateWorkspaceSlugSecurity(sanitizedSlug)
      if (!slugSecurity.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: slugSecurity.issues[0] ?? 'Invalid workspace slug',
        })
      }

      // Check if slug already exists
      const existingWorkspace = await ctx.db.workspace.findUnique({
        where: { slug: sanitizedSlug },
      })

      if (existingWorkspace) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A workspace with this slug already exists',
        })
      }

      // Create workspace and add user as owner
      const workspace = await ctx.db.workspace.create({
        data: {
          name: sanitizedName,
          slug: sanitizedSlug,
          members: {
            create: {
              userId: ctx.user!.id,
              role: 'owner',
            },
          },
        },
        include: {
          members: {
            where: { userId: ctx.user!.id },
            select: { role: true },
          },
        },
      })

      // Set as active workspace
      await ctx.db.user.update({
        where: { id: ctx.user!.id },
        data: { activeWorkspaceId: workspace.id },
      })

      return workspace
    }),

  // Update workspace settings
  update: workspaceAdminProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        name: z.string().optional(),
        slug: z.string().optional(),
        logo: z.string().optional().nullable(),
        settings: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate with translations
      const schema = await updateWorkspaceSchema(ctx.locale)
      const validatedInput = schema.parse(input)
      const { workspaceId, ...data } = validatedInput

      // Sanitize inputs
      const sanitizedData = { ...data }
      if (sanitizedData.name !== undefined && sanitizedData.name !== '') {
        sanitizedData.name = sanitizeAuthInput(sanitizedData.name)
      }
      if (sanitizedData.slug !== undefined && sanitizedData.slug !== '') {
        sanitizedData.slug = sanitizedData.slug.toLowerCase().trim()

        // Additional slug security validation
        const slugSecurity = validateWorkspaceSlugSecurity(sanitizedData.slug)
        if (!slugSecurity.isValid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: slugSecurity.issues[0] ?? 'Invalid workspace slug',
          })
        }
      }

      // Verify workspace access
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId,
          },
        },
      })

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this workspace',
        })
      }

      // If updating slug, check availability
      if (data.slug !== undefined && data.slug !== '') {
        const existingWorkspace = await ctx.db.workspace.findFirst({
          where: {
            slug: data.slug,
            id: { not: workspaceId },
          },
        })

        if (existingWorkspace) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A workspace with this slug already exists',
          })
        }
      }

      // Update workspace
      const updatedWorkspace = await ctx.db.workspace.update({
        where: { id: workspaceId },
        data: {
          ...(sanitizedData.name !== undefined && sanitizedData.name !== ''
            ? { name: sanitizedData.name }
            : {}),
          ...(sanitizedData.slug !== undefined && sanitizedData.slug !== ''
            ? { slug: sanitizedData.slug }
            : {}),
          ...(sanitizedData.logo !== undefined ? { logo: sanitizedData.logo } : {}),
          ...(data.settings && { settings: data.settings }),
        },
      })

      return updatedWorkspace
    }),

  // Delete workspace (soft delete)
  delete: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
        confirmation: z.literal('DELETE'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!membership || membership.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners can delete workspaces',
        })
      }

      // Check if user has other workspaces
      const otherWorkspaces = await ctx.db.workspaceMember.count({
        where: {
          userId: ctx.user!.id,
          workspaceId: { not: input.workspaceId },
        },
      })

      // Soft delete workspace
      await ctx.db.workspace.update({
        where: { id: input.workspaceId },
        data: { deletedAt: new Date() },
      })

      // If this was the active workspace, switch to another one
      if (ctx.activeWorkspace.id === input.workspaceId && otherWorkspaces > 0) {
        const nextWorkspace = await ctx.db.workspaceMember.findFirst({
          where: {
            userId: ctx.user!.id,
            workspaceId: { not: input.workspaceId },
          },
          include: { workspace: true },
        })

        if (nextWorkspace) {
          await ctx.db.user.update({
            where: { id: ctx.user!.id },
            data: { activeWorkspaceId: nextWorkspace.workspaceId },
          })
        }
      } else {
        // Clear active workspace if no other workspaces
        await ctx.db.user.update({
          where: { id: ctx.user!.id },
          data: { activeWorkspaceId: null },
        })
      }

      return { success: true }
    }),

  // Switch active workspace
  switchActive: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
        include: {
          workspace: true,
        },
      })

      if (!membership || membership.workspace.deletedAt) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a member of this workspace',
        })
      }

      // Update active workspace and last active timestamp
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.user!.id },
        data: {
          activeWorkspaceId: input.workspaceId,
          lastActiveAt: new Date(),
        },
        include: {
          activeWorkspace: true,
        },
      })

      return {
        user: updatedUser,
        workspace: membership.workspace,
        role: membership.role,
      }
    }),

  // Check if slug is available
  checkSlug: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.workspace.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      })

      return { available: existing === null }
    }),

  // Check if slug is available (public version for signup)
  checkSlugPublic: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.workspace.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      })

      return { available: existing === null }
    }),

  // Check if slug is available (mutation version for form usage)
  checkSlugAvailability: protectedProcedure
    .input(
      z.object({
        slug: z.string(),
        workspaceId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.workspace.findUnique({
        where: { slug: input.slug },
        select: { id: true },
      })

      // If checking for update, exclude current workspace
      if (
        existing !== null &&
        input.workspaceId !== undefined &&
        existing.id === input.workspaceId
      ) {
        return { available: true }
      }

      return { available: existing === null }
    }),

  // Generate slug from name
  generateSlug: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Generate base slug from name
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40)

      // Check if slug exists and add suffix if needed
      let suffix = 0
      let finalSlug = slug

      while (suffix < 100) {
        const existing = await ctx.db.workspace.findUnique({
          where: { slug: finalSlug },
          select: { id: true },
        })

        if (existing === null) break

        suffix++
        finalSlug = `${slug}-${suffix}`
      }

      return { slug: finalSlug }
    }),

  // Generate slug from name (public version for signup)
  generateSlugPublic: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Generate base slug from name
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 40)

      // Check if slug exists and add suffix if needed
      let suffix = 0
      let finalSlug = slug

      while (suffix < 100) {
        const existing = await ctx.db.workspace.findUnique({
          where: { slug: finalSlug },
          select: { id: true },
        })

        if (existing === null) break

        suffix++
        finalSlug = `${slug}-${suffix}`
      }

      return { slug: finalSlug }
    }),

  // Archive workspace
  archive: workspaceOwnerProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const membership = await ctx.db.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: ctx.user!.id,
            workspaceId: input.workspaceId,
          },
        },
      })

      if (!membership || membership.role !== 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only workspace owners can archive workspaces',
        })
      }

      // Archive workspace (soft delete)
      const archivedWorkspace = await ctx.db.workspace.update({
        where: { id: input.workspaceId },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // If this was the active workspace, switch to another one
      if (ctx.activeWorkspace.id === input.workspaceId) {
        const nextWorkspace = await ctx.db.workspaceMember.findFirst({
          where: {
            userId: ctx.user!.id,
            workspaceId: { not: input.workspaceId },
            workspace: {
              deletedAt: null,
            },
          },
          include: { workspace: true },
        })

        if (nextWorkspace) {
          await ctx.db.user.update({
            where: { id: ctx.user!.id },
            data: { activeWorkspaceId: nextWorkspace.workspaceId },
          })
        } else {
          await ctx.db.user.update({
            where: { id: ctx.user!.id },
            data: { activeWorkspaceId: null },
          })
        }
      }

      return archivedWorkspace
    }),

  // Export workspace data
  exportData: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify membership
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
          code: 'FORBIDDEN',
          message: 'You are not a member of this workspace',
        })
      }

      // TODO: Implement actual data export logic
      // For now, just return success
      // In a real implementation, this would:
      // 1. Generate a data export (JSON/CSV)
      // 2. Upload to storage
      // 3. Send email with download link

      return {
        success: true,
        message: 'Export initiated. You will receive an email when ready.',
      }
    }),
})
