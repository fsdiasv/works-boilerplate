import { TRPCError } from '@trpc/server'
import { getTranslations } from 'next-intl/server'
// import { hash, compare } from 'bcryptjs' // TODO: Remove if not needed
import { z } from 'zod'

import {
  validatePasswordStrength,
  validateEmailSecurity,
  sanitizeAuthInput,
} from '@/lib/auth-security'
import { env } from '@/lib/env'
import { createServiceClient } from '@/lib/supabase/server'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'
import {
  authRateLimitedProcedure,
  accountDeletionRateLimitedProcedure,
  rateLimitedProtectedProcedure,
} from '@/server/api/trpc-rate-limited'

// Helper to create schemas with translations
async function createSignUpSchema(locale: string) {
  const tAuth = await getTranslations({ locale, namespace: 'auth.validation' })
  const tValidation = await getTranslations({ locale, namespace: 'validation' })

  return z.object({
    email: z.string().email(tAuth('invalidEmail')),
    password: z.string().min(8, tValidation('passwordMinLength')),
    fullName: z.string().min(2, tAuth('nameMinLength')).optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
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
    const includeWorkspaceMemberships =
      ctx.activeWorkspace?.id !== undefined
        ? {
            where: { workspaceId: ctx.activeWorkspace.id },
            select: { role: true },
            take: 1,
          }
        : undefined

    const dbUser = await ctx.db.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        activeWorkspace: true,
        ...(includeWorkspaceMemberships && { workspaceMemberships: includeWorkspaceMemberships }),
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate with translations
      const schema = await createSignUpSchema(ctx.locale)
      const validatedInput = schema.parse(input)
      const { email: rawEmail, password, fullName: rawFullName, locale, timezone } = validatedInput

      // Get translations for error messages
      const tAuth = await getTranslations({ locale: ctx.locale, namespace: 'auth.validation' })

      // Sanitize and normalize inputs
      const normalizedEmail = sanitizeAuthInput(rawEmail).toLowerCase()
      const fullName =
        rawFullName !== undefined && rawFullName !== '' ? sanitizeAuthInput(rawFullName) : undefined

      // Additional email security validation
      const emailSecurity = validateEmailSecurity(normalizedEmail)
      if (!emailSecurity.isValid || !emailSecurity.isSecure) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: emailSecurity.issues[0] ?? 'Invalid email address',
        })
      }

      // Enhanced password strength validation
      const passwordStrength = validatePasswordStrength(password)
      if (!passwordStrength.isStrong) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            passwordStrength.criticalIssues[0] ?? 'Password does not meet security requirements',
        })
      }

      // Check if user already exists in database
      const existingUser = await ctx.db.user.findUnique({
        where: { email: normalizedEmail },
      })

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: tAuth('emailAlreadyExists'),
        })
      }

      // Sign up with Supabase
      // console.log('🔄 Starting Supabase signup for:', normalizedEmail)
      const { data, error } = await ctx.supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            locale: locale ?? 'en',
            timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      })

      // console.log('📧 Supabase signup result:', {
      //   user: !!data.user,
      //   session: !!data.session,
      //   error: error?.message || 'none',
      // })

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

      // Generate automatic workspace data
      const user = data.user
      const workspaceName =
        fullName !== undefined && fullName !== ''
          ? `${fullName}'s Workspace`
          : `${normalizedEmail.split('@')[0]}'s Workspace`

      const workspaceSlug = `workspace-${user.id.slice(0, 8)}`

      // Use a transaction to ensure atomicity with optimized structure
      const result = await ctx.db.$transaction(
        async tx => {
          // Create user in database with all initial data
          const dbUser = await tx.user.create({
            data: {
              id: user.id,
              email: normalizedEmail,
              fullName: fullName ?? null,
              locale: locale ?? 'en',
              timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
              profile: {
                create: {
                  // Create profile in the same operation
                },
              },
            },
            include: {
              profile: true,
            },
          })

          // Create workspace with member in single operation
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

          // Update user to set active workspace
          await tx.user.update({
            where: { id: dbUser.id },
            data: { activeWorkspaceId: workspace.id },
          })

          return { dbUser, workspace }
        },
        {
          // Set a reasonable timeout to prevent long-running transactions
          timeout: 10000, // 10 seconds
        }
      )

      return {
        user,
        session: data.session,
        workspace: result.workspace,
      }
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
      const { email: rawEmail } = input
      const normalizedEmail = sanitizeAuthInput(rawEmail).toLowerCase()

      // Add artificial delay to normalize response times and prevent timing attacks
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      const startTime = Date.now()

      // Check if user exists in custom database
      const existingUser = await ctx.db.user.findUnique({
        where: { email: normalizedEmail },
      })

      // Always return success to prevent email enumeration
      // but only send email if user exists
      if (!existingUser) {
        // Add delay to match the time taken for existing users
        const elapsed = Date.now() - startTime
        const minDelay = 200 // Minimum 200ms delay
        if (elapsed < minDelay) {
          await delay(minDelay - elapsed)
        }
        return { success: true }
      }

      // Use service client for admin operations
      const serviceClient = await createServiceClient()

      // Resend verification email using REST API directly
      const response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          type: 'signup',
          email: normalizedEmail,
        }),
      })

      if (!response.ok) {
        // Try alternative method using Supabase client
        const { error: resendError } = await serviceClient.auth.resend({
          type: 'signup',
          email: normalizedEmail,
        })

        if (resendError) {
          // Log error but still return success to prevent enumeration
          if (env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Failed to resend verification email:', resendError)
          }
        }
      }

      // Ensure consistent timing for all paths
      const elapsed = Date.now() - startTime
      const minDelay = 200 // Minimum 200ms delay
      if (elapsed < minDelay) {
        await delay(minDelay - elapsed)
      }

      return { success: true }
    }),
})
