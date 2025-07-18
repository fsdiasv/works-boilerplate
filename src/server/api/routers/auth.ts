import { TRPCError } from '@trpc/server'
import { getTranslations } from 'next-intl/server'
// import { hash, compare } from 'bcryptjs' // TODO: Remove if not needed
import { z } from 'zod'

import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import {
  authRateLimitedProcedure,
  passwordResetRateLimitedProcedure,
  accountDeletionRateLimitedProcedure,
  rateLimitedProtectedProcedure,
} from '@/server/api/trpc-rate-limited'

// Helper to create schemas with translations
async function createSignUpSchema(locale: string) {
  const tAuth = await getTranslations({ locale, namespace: 'auth.validation' })
  const tValidation = await getTranslations({ locale, namespace: 'validation' })
  const tWorkspace = await getTranslations({ locale, namespace: 'workspace.validation' })

  return z.object({
    email: z.string().email(tAuth('invalidEmail')),
    password: z.string().min(8, tValidation('passwordMinLength')),
    fullName: z.string().min(2, tAuth('nameMinLength')).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
    workspaceName: z
      .string()
      .min(2, tWorkspace('nameMinLength'))
      .max(50, tWorkspace('nameMaxLength'))
      .trim(),
    workspaceSlug: z
      .string()
      .min(3, tWorkspace('slugMinLength'))
      .max(50, tWorkspace('slugMaxLength'))
      .regex(/^[a-z0-9-]+$/, tWorkspace('slugInvalid'))
      .trim(),
  })
}

async function createUpdatePasswordSchema(locale: string) {
  const tAuth = await getTranslations({ locale, namespace: 'auth.validation' })
  const tValidation = await getTranslations({ locale, namespace: 'validation' })

  return z.object({
    currentPassword: z.string().min(1, tAuth('currentPasswordRequired')),
    newPassword: z.string().min(8, tValidation('passwordMinLength')),
  })
}

async function createUpdateProfileSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'auth.validation' })

  return z.object({
    fullName: z.string().min(2, t('nameMinLength')).optional(),
    avatarUrl: z.string().url(t('urlInvalid')).optional(),
    bio: z.string().max(500, t('bioMaxLength')).optional(),
    website: z.string().url(t('urlInvalid')).optional(),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
  })
}

export const authRouter = createTRPCRouter({
  // Get current user
  getSession: publicProcedure.query(async ({ ctx }) => {
    const { user } = ctx
    if (!user) return null

    // Get additional user data from database
    const dbUser = await ctx.db.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        activeWorkspace: true,
        workspaceMemberships:
          ctx.activeWorkspace?.id !== undefined
            ? {
                where: { workspaceId: ctx.activeWorkspace.id },
                select: { role: true },
                take: 1,
              }
            : false,
      },
    })

    const membership =
      dbUser?.workspaceMemberships && Array.isArray(dbUser.workspaceMemberships)
        ? dbUser.workspaceMemberships[0]
        : undefined

    return {
      user,
      activeWorkspace: ctx.activeWorkspace,
      userRole: membership?.role ?? ctx.userRole,
    }
  }),

  // Sign up
  signUp: authRateLimitedProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        fullName: z.string().optional(),
        locale: z.string().optional(),
        timezone: z.string().optional(),
        workspaceName: z.string(),
        workspaceSlug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate with translations
      const schema = await createSignUpSchema(ctx.locale)
      const validatedInput = schema.parse(input)
      const { email, password, fullName, locale, timezone, workspaceName, workspaceSlug } =
        validatedInput

      // Get translations for error messages
      const tAuth = await getTranslations({ locale: ctx.locale, namespace: 'auth.validation' })

      // Check if user already exists in database
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: tAuth('emailAlreadyExists'),
        })
      }

      // Check if workspace slug already exists
      const existingWorkspace = await ctx.db.workspace.findUnique({
        where: { slug: workspaceSlug },
      })

      if (existingWorkspace) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: tAuth('workspaceSlugExists'),
        })
      }

      // Sign up with Supabase
      const { data, error } = await ctx.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            locale: locale ?? 'en',
            timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      })

      if (error) {
        // Check if error is due to existing user
        if (error.message.toLowerCase().includes('already registered')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: tAuth('emailAlreadyRegisteredVerify'),
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      if (!data.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: tAuth('failedToCreateUser'),
        })
      }

      // Use a transaction to ensure atomicity
      const result = await ctx.db.$transaction(async tx => {
        // Create user in database
        const dbUser = await tx.user.create({
          data: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: data.user!.id,
            email,
            fullName: fullName ?? null,
            locale: locale ?? 'en',
            timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        })

        // Create empty profile
        await tx.profile.create({
          data: {
            userId: dbUser.id,
          },
        })

        // Create workspace and add user as owner
        const workspace = await tx.workspace.create({
          data: {
            name: workspaceName,
            slug: workspaceSlug,
            members: {
              create: {
                userId: dbUser.id,
                role: 'owner',
              },
            },
          },
        })

        // Set as active workspace
        await tx.user.update({
          where: { id: dbUser.id },
          data: { activeWorkspaceId: workspace.id },
        })

        return { dbUser, workspace }
      })

      return {
        user: data.user,
        session: data.session,
        workspace: result.workspace,
      }
    }),

  // Update password
  updatePassword: rateLimitedProtectedProcedure.mutation(async ({ ctx, input }) => {
    // Validate with translations
    const schema = await createUpdatePasswordSchema(ctx.locale)
    const validatedInput = schema.parse(input)
    const { currentPassword, newPassword } = validatedInput

    // Check if user email exists and is valid
    const userEmail = ctx.user.email
    if (userEmail === undefined || userEmail === '') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User email is not available. Please sign in again.',
      })
    }

    // Verify current password
    const { error: userError } = await ctx.supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    })

    if (userError !== null) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Current password is incorrect',
      })
    }

    // Update password
    const { error } = await ctx.supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return { success: true }
  }),

  /**
   * Updates the user's profile information including personal details and metadata.
   *
   * @param input - Profile update data containing optional fields:
   *   - fullName: User's full name (updates both Supabase metadata and database)
   *   - avatarUrl: URL to user's avatar image (updates both Supabase metadata and database)
   *   - bio: User's biography text
   *   - website: User's personal website URL
   *   - company: User's company name
   *   - jobTitle: User's job title
   *
   * @returns The updated profile record
   *
   * @throws {TRPCError} When Supabase auth update fails
   *
   * @remarks
   * This procedure performs the following operations:
   * 1. Updates Supabase auth metadata if fullName or avatarUrl are provided
   * 2. Synchronizes fullName and avatarUrl to the database user record
   * 3. Upserts the user's profile with additional information (bio, website, etc.)
   */
  updateProfile: rateLimitedProtectedProcedure
    .input(
      z.object({
        fullName: z.string().optional(),
        avatarUrl: z.string().optional(),
        bio: z.string().optional(),
        website: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate with translations
      const schema = await createUpdateProfileSchema(ctx.locale)
      const validatedInput = schema.parse(input)
      const { fullName, avatarUrl, ...profileData } = validatedInput

      // Check if user metadata needs updating
      const shouldUpdateUserMetadata =
        (fullName !== undefined && fullName !== '') || (avatarUrl !== undefined && avatarUrl !== '')

      // Update Supabase user metadata and database user if needed
      if (shouldUpdateUserMetadata) {
        const { error } = await ctx.supabase.auth.updateUser({
          data: {
            full_name: fullName,
            avatar_url: avatarUrl,
          },
        })

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        // Update database user
        await ctx.db.user.update({
          where: { id: ctx.user.id },
          data: {
            fullName: fullName ?? null,
            avatarUrl: avatarUrl ?? null,
          },
        })
      }

      // Update profile
      const cleanedProfileData = {
        bio: profileData.bio ?? null,
        website: profileData.website ?? null,
        company: profileData.company ?? null,
        jobTitle: profileData.jobTitle ?? null,
      }

      const profile = await ctx.db.profile.upsert({
        where: { userId: ctx.user.id },
        update: cleanedProfileData,
        create: {
          userId: ctx.user.id,
          ...cleanedProfileData,
        },
      })

      return { profile }
    }),

  // Delete account
  deleteAccount: accountDeletionRateLimitedProcedure
    .input(
      z.object({
        // Frontend should use auth.deleteAccount.confirmationText translation key
        // The literal value must match what's in the translation files
        confirmation: z.literal('DELETE MY ACCOUNT'),
      })
    )
    .mutation(async ({ ctx }) => {
      // Delete from database first
      await ctx.db.profile.deleteMany({
        where: { userId: ctx.user.id },
      })

      await ctx.db.user.delete({
        where: { id: ctx.user.id },
      })

      // Sign out the user from their current session
      const { error: signOutError } = await ctx.supabase.auth.signOut()

      if (signOutError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sign out user',
        })
      }

      // Note: The actual deletion from Supabase Auth should be handled by:
      // 1. A database trigger that calls a Supabase Edge Function
      // 2. A scheduled job that processes deletions
      // 3. A webhook endpoint that's called after database deletion
      // This ensures the service role key is never exposed to client code

      return { success: true }
    }),

  // Send password reset email
  sendPasswordResetEmail: passwordResetRateLimitedProcedure
    .input(
      z.object({
        email: z.string(),
        redirectTo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate email with translations
      const t = await getTranslations({ locale: ctx.locale, namespace: 'auth.validation' })
      const emailSchema = z.string().email(t('invalidEmail'))
      const validatedEmail = emailSchema.parse(input.email)
      const options =
        input.redirectTo !== undefined && input.redirectTo !== ''
          ? { redirectTo: input.redirectTo }
          : {}
      const { error } = await ctx.supabase.auth.resetPasswordForEmail(validatedEmail, options)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Verify email
  verifyEmail: authRateLimitedProcedure
    .input(
      z.object({
        token: z.string(),
        type: z.enum(['signup', 'email_change']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.auth.verifyOtp({
        token_hash: input.token,
        type: input.type,
      })

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      // After successful verification, check if user is now logged in
      const {
        data: { session },
      } = await ctx.supabase.auth.getSession()

      return {
        success: true,
        isLoggedIn: session !== null,
        email: session?.user.email,
      }
    }),

  // Sign out
  signOut: rateLimitedProtectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return { success: true }
  }),

  // Resend verification email
  resendVerificationEmail: authRateLimitedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { email } = input

      // Check if user exists in database
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      })

      // Always return success to prevent email enumeration
      // but only send email if user exists
      if (!existingUser) {
        return { success: true }
      }

      // Resend verification email
      const { error } = await ctx.supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        // Log error but still return success to prevent enumeration
        console.error('Failed to resend verification email:', error)
      }

      return { success: true }
    }),
})
