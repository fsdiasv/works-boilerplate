import { TRPCError } from '@trpc/server'
// import { hash, compare } from 'bcryptjs' // TODO: Remove if not needed
import { z } from 'zod'

import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc'

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters').optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
})

// const signInSchema = z.object({
//   email: z.string().email('Invalid email address'),
//   password: z.string().min(1, 'Password is required'),
// })

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
})

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
  signUp: publicProcedure.input(signUpSchema).mutation(async ({ ctx, input }) => {
    const { email, password, fullName, locale, timezone } = input

    // Check if user already exists
    const existingUser = await ctx.db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
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
    .input(updatePasswordSchema)
    .mutation(async ({ ctx, input }) => {
      const { currentPassword, newPassword } = input

      // Verify current password
      const { error: userError } = await ctx.supabase.auth.signInWithPassword({
        email: ctx.user.email ?? '',
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

  // Update profile
  updateProfile: protectedProcedure.input(updateProfileSchema).mutation(async ({ ctx, input }) => {
    const { fullName, avatarUrl, ...profileData } = input

    // Update Supabase user metadata
    if (
      (fullName !== undefined && fullName !== '') ||
      (avatarUrl !== undefined && avatarUrl !== '')
    ) {
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
    }

    // Update database user
    if (
      (fullName !== undefined && fullName !== '') ||
      (avatarUrl !== undefined && avatarUrl !== '')
    ) {
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
        email: z.string().email(),
        redirectTo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const options =
        input.redirectTo !== undefined && input.redirectTo !== ''
          ? { redirectTo: input.redirectTo }
          : {}
      const { error } = await ctx.supabase.auth.resetPasswordForEmail(input.email, options)

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
