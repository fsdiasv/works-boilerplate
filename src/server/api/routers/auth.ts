import { TRPCError } from '@trpc/server'
import { getTranslations } from 'next-intl/server'
// import { hash, compare } from 'bcryptjs' // TODO: Remove if not needed
import { z } from 'zod'

import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'

// Helper to create schemas with translations
async function createSignUpSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'auth.validation' })

  return z.object({
    email: z.string().email(t('invalidEmail')),
    password: z.string().min(8, t('passwordMinLength')),
    fullName: z.string().min(2, t('nameMinLength')).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
  })
}

async function createUpdatePasswordSchema(locale: string) {
  const t = await getTranslations({ locale, namespace: 'auth.validation' })

  return z.object({
    currentPassword: z.string().min(1, t('currentPasswordRequired')),
    newPassword: z.string().min(8, t('passwordMinLength')),
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
      },
    })

    return {
      user: {
        ...user,
        profile: dbUser?.profile,
      },
    }
  }),

  // Sign up
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        fullName: z.string().optional(),
        locale: z.string().optional(),
        timezone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate with translations
      const schema = await createSignUpSchema(ctx.locale)
      const validatedInput = schema.parse(input)
      const { email, password, fullName, locale, timezone } = validatedInput

      // Check if user already exists
      const existingUser = await ctx.db.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Unable to create account. Please check your email for further instructions.',
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
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      if (!data.user) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create user',
        })
      }

      // Create user in database
      const dbUser = await ctx.db.user.create({
        data: {
          id: data.user.id,
          email,
          fullName: fullName ?? null,
          locale: locale ?? 'en',
          timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      })

      // Create empty profile
      await ctx.db.profile.create({
        data: {
          userId: dbUser.id,
        },
      })

      return {
        user: data.user,
        session: data.session,
      }
    }),

  // Update password
  updatePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
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
  updateProfile: protectedProcedure
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
  deleteAccount: protectedProcedure
    .input(
      z.object({
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

      // Then delete from Supabase
      const { error } = await ctx.supabase.auth.admin.deleteUser(ctx.user.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete account',
        })
      }

      return { success: true }
    }),

  // Send password reset email
  sendPasswordResetEmail: publicProcedure
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
  verifyEmail: publicProcedure
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

      return { success: true }
    }),

  // Sign out
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase.auth.signOut()

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return { success: true }
  }),
})
