import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction } from 'vitest'
import { TRPCError } from '@trpc/server'
import type { Session, User } from '@supabase/supabase-js'
import { getTranslations } from 'next-intl/server'

import { validatePasswordStrength, validateEmailSecurity, sanitizeAuthInput } from '@/lib/auth-security'
import { createServiceClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { authRouter } from '@/server/api/routers/auth'

// Import server to close it for these tests
import { server } from '@/__tests__/helpers/msw-server'

// Mock fetch globally using vi.stubGlobal
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Also disable MSW for these tests
vi.mock('@/src/__tests__/helpers/msw-server', () => ({
  server: {
    listen: vi.fn(),
    close: vi.fn(),
    resetHandlers: vi.fn(),
  },
}))

// Mock external dependencies
vi.mock('@/lib/auth-security')
vi.mock('@/lib/supabase/server')
vi.mock('next-intl/server')

// Mock rate limiting middleware to bypass rate limits in tests
vi.mock('@/server/api/trpc-rate-limited', async (importOriginal) => {
  const { publicProcedure } = await import('@/server/api/trpc')
  return {
    authRateLimitedProcedure: publicProcedure,
    accountDeletionRateLimitedProcedure: publicProcedure,
    rateLimitedProtectedProcedure: publicProcedure,
  }
})

// Mock env before importing anything else
vi.mock('@/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    DIRECT_URL: 'postgresql://test:test@localhost:5432/test',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    NODE_ENV: 'test',
  },
}))

// Mock Prisma database client
vi.mock('@/server/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    profile: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    workspace: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

const mockValidatePasswordStrength = validatePasswordStrength as MockedFunction<typeof validatePasswordStrength>
const mockValidateEmailSecurity = validateEmailSecurity as MockedFunction<typeof validateEmailSecurity>
const mockSanitizeAuthInput = sanitizeAuthInput as MockedFunction<typeof sanitizeAuthInput>
const mockCreateServiceClient = createServiceClient as MockedFunction<typeof createServiceClient>
const mockGetTranslations = getTranslations as MockedFunction<typeof getTranslations>

// Mock fetch globally
global.fetch = vi.fn()

describe('Auth Router', () => {
  let mockCtx: any
  let mockSupabase: any
  let mockDb: any
  let mockUser: User
  let mockSession: Session
  let caller: ReturnType<typeof authRouter.createCaller>

  beforeAll(() => {
    // Close MSW server for these tests to avoid fetch interception
    server.close()
  })

  afterAll(() => {
    // Restart MSW server after tests
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()

    // Mock user and session
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
      app_metadata: {},
      user_metadata: {},
    }

    mockSession = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: mockUser,
    }

    // Mock Supabase client
    mockSupabase = {
      auth: {
        signUp: vi.fn(),
        signOut: vi.fn(),
        updateUser: vi.fn(),
        verifyOtp: vi.fn(),
        getSession: vi.fn(),
        resend: vi.fn(),
      },
    }

    // Mock database client
    mockDb = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      profile: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
      workspace: {
        create: vi.fn(),
      },
      $transaction: vi.fn(),
    }

    // Mock context
    mockCtx = {
      user: mockUser,
      session: mockSession,
      supabase: mockSupabase,
      db: mockDb,
      locale: 'en',
      activeWorkspace: { id: 'workspace-id' },
      userRole: 'owner',
    }

    // Mock translations
    const mockT = vi.fn((key: string) => `translated:${key}`) as any
    mockGetTranslations.mockResolvedValue(mockT)

    // Mock auth security functions
    mockSanitizeAuthInput.mockImplementation((input: string) => input.trim())
    mockValidateEmailSecurity.mockReturnValue({
      isValid: true,
      isSecure: true,
      issues: [],
    })
    mockValidatePasswordStrength.mockReturnValue({
      score: 4,
      isStrong: true,
      criticalIssues: [],
      feedback: [],
    })

    // Create tRPC caller with mock context
    caller = authRouter.createCaller(mockCtx)
  })

  describe('getSession', () => {
    it('should return null when user is not authenticated', async () => {
      const unauthenticatedCaller = authRouter.createCaller({ ...mockCtx, user: null })
      
      const result = await unauthenticatedCaller.getSession()
      
      expect(result).toBeNull()
    })

    it('should return user session with workspace data', async () => {
      const mockDbUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        profile: { bio: 'Test bio' },
        activeWorkspace: { id: 'workspace-id' },
        workspaceMemberships: [{ role: 'owner' }],
      }

      mockDb.user.findUnique.mockResolvedValue(mockDbUser)

      const result = await caller.getSession()

      expect(result).toEqual({
        user: mockUser,
        activeWorkspace: mockCtx.activeWorkspace,
        userRole: 'owner',
      })
    })

    it('should handle user without workspace memberships', async () => {
      const mockDbUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        profile: { bio: 'Test bio' },
        activeWorkspace: null,
        workspaceMemberships: null,
      }

      mockDb.user.findUnique.mockResolvedValue(mockDbUser)

      const result = await caller.getSession()

      expect(result).toEqual({
        user: mockUser,
        activeWorkspace: mockCtx.activeWorkspace,
        userRole: 'owner',
      })
    })
  })

  describe('signUp', () => {
    const validSignUpInput = {
      email: 'test@example.com',
      password: 'SecurePassword123!',
      fullName: 'Test User',
      locale: 'en',
      timezone: 'America/New_York',
    }

    it('should create a new user successfully', async () => {
      // Mock no existing user
      mockDb.user.findUnique.mockResolvedValue(null)

      // Mock successful Supabase signup
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      // Mock transaction result
      const mockWorkspace = { id: 'workspace-id', name: "Test User's Workspace" }
      mockDb.$transaction.mockResolvedValue({
        dbUser: { id: 'test-user-id', email: 'test@example.com' },
        workspace: mockWorkspace,
      })

      const result = await caller.signUp(validSignUpInput)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        options: {
          data: {
            full_name: 'Test User',
            locale: 'en',
            timezone: 'America/New_York',
          },
        },
      })

      expect(result).toEqual({
        user: mockUser,
        session: mockSession,
        workspace: mockWorkspace,
      })
    })

    it('should throw error for invalid email', async () => {
      mockValidateEmailSecurity.mockReturnValue({
        isValid: false,
        isSecure: false,
        issues: ['Invalid email format'],
      })

      await expect(
        caller.signUp(validSignUpInput)
      ).rejects.toThrow(TRPCError)
    })

    it('should throw error for weak password', async () => {
      mockValidatePasswordStrength.mockReturnValue({
        score: 1,
        isStrong: false,
        criticalIssues: ['Password too weak'],
        feedback: ['Password is too weak'],
      })

      await expect(
        caller.signUp(validSignUpInput)
      ).rejects.toThrow(TRPCError)
    })

    it('should throw error if user already exists in database', async () => {
      mockDb.user.findUnique.mockResolvedValue({ id: 'existing-user' })

      await expect(
        caller.signUp(validSignUpInput)
      ).rejects.toThrow(TRPCError)
    })

    it('should handle Supabase signup error', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Signup failed' },
      })

      await expect(
        caller.signUp(validSignUpInput)
      ).rejects.toThrow(TRPCError)
    })

    it('should handle existing user in Supabase error', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      })

      await expect(
        caller.signUp(validSignUpInput)
      ).rejects.toThrow(TRPCError)
    })

    it('should handle missing user in response', async () => {
      mockDb.user.findUnique.mockResolvedValue(null)
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      await expect(
        caller.signUp(validSignUpInput)
      ).rejects.toThrow(TRPCError)
    })

    it('should handle optional fullName', async () => {
      const inputWithoutName = { ...validSignUpInput, fullName: undefined }
      
      mockDb.user.findUnique.mockResolvedValue(null)
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const mockWorkspace = { id: 'workspace-id', name: "test's Workspace" }
      mockDb.$transaction.mockResolvedValue({
        dbUser: { id: 'test-user-id', email: 'test@example.com' },
        workspace: mockWorkspace,
      })

      await caller.signUp(validSignUpInput)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        options: {
          data: {
            full_name: 'Test User',
            locale: 'en',
            timezone: 'America/New_York',
          },
        },
      })
    })
  })

  describe('updateProfile', () => {
    const validUpdateInput = {
      fullName: 'Updated Name',
      avatarUrl: 'https://example.com/avatar.jpg',
      bio: 'Updated bio',
      website: 'https://example.com',
      company: 'Example Corp',
      jobTitle: 'Developer',
    }

    it('should update profile successfully', async () => {
      // Mock successful Supabase update
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock successful database update
      mockDb.user.update.mockResolvedValue({ id: 'test-user-id' })

      const mockProfile = { id: 'profile-id', bio: 'Updated bio' }
      mockDb.profile.upsert.mockResolvedValue(mockProfile)

      const validUpdateInput = {
        fullName: 'Updated Name',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Updated bio',
      }

      const result = await caller.updateProfile(validUpdateInput)

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: {
          full_name: 'Updated Name',
          avatar_url: 'https://example.com/avatar.jpg',
        },
      })

      expect(result).toEqual({ profile: mockProfile })
    })

    it('should handle Supabase update error', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      await expect(
        caller.updateProfile(validUpdateInput)
      ).rejects.toThrow(TRPCError)
    })

    it('should update only profile data when no metadata changes', async () => {
      const profileOnlyInput = {
        bio: 'Updated bio',
        website: 'https://example.com',
        company: 'Example Corp',
        jobTitle: 'Developer',
      }

      const mockProfile = { id: 'profile-id', bio: 'Updated bio' }
      mockDb.profile.upsert.mockResolvedValue(mockProfile)

      const validUpdateInput = {
        bio: 'Updated bio',
        website: 'https://example.com',
        company: 'Example Corp',
        jobTitle: 'Developer',
      }

      const result = await caller.updateProfile(validUpdateInput)

      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled()
      expect(result).toEqual({ profile: mockProfile })
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await caller.signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should handle sign out error', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      await expect(
        caller.signOut()
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      const validInput = { confirmation: 'DELETE MY ACCOUNT' as const }

      mockDb.profile.deleteMany.mockResolvedValue({ count: 1 })
      mockDb.user.delete.mockResolvedValue({ id: 'test-user-id' })
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      const result = await caller.deleteAccount(validInput)

      expect(mockDb.profile.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
      })
      expect(mockDb.user.delete).toHaveBeenCalledWith({
        where: { id: 'test-user-id' },
      })
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should handle sign out error during account deletion', async () => {
      const validInput = { confirmation: 'DELETE MY ACCOUNT' as const }

      mockDb.profile.deleteMany.mockResolvedValue({ count: 1 })
      mockDb.user.delete.mockResolvedValue({ id: 'test-user-id' })
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      })

      await expect(
        caller.deleteAccount(validInput)
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const validInput = { token: 'test-token', type: 'signup' as const }

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const result = await caller.verifyEmail(validInput)

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'test-token',
        type: 'signup',
      })

      expect(result).toEqual({
        success: true,
        isLoggedIn: true,
        email: 'test@example.com',
      })
    })

    it('should handle verification error', async () => {
      const validInput = { token: 'test-token', type: 'signup' as const }

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid token' },
      })

      await expect(
        caller.verifyEmail(validInput)
      ).rejects.toThrow(TRPCError)
    })
  })

  describe('resendVerificationEmail', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      // Bypass MSW for fetch calls in these tests
      mockFetch.mockClear()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should resend verification email for existing user', async () => {
      const validInput = { email: 'test@example.com' }

      mockDb.user.findUnique.mockResolvedValue({ id: 'test-user-id' })
      
      // Mock fetch for REST API call
      mockFetch.mockResolvedValue({ ok: true })

      // Mock service client
      const mockServiceClient = { auth: { resend: vi.fn() } }
      mockCreateServiceClient.mockResolvedValue(mockServiceClient as any)

      const resultPromise = caller.resendVerificationEmail(validInput)
      
      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(250)
      
      const result = await resultPromise

      expect(result).toEqual({ success: true })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.supabase.co/auth/v1/resend',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            type: 'signup',
            email: 'test@example.com',
          }),
        })
      )
    })

    it('should return success for non-existent user (prevent enumeration)', async () => {
      const validInput = { email: 'nonexistent@example.com' }

      mockDb.user.findUnique.mockResolvedValue(null)

      const resultPromise = caller.resendVerificationEmail(validInput)
      
      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(250)
      
      const result = await resultPromise

      expect(result).toEqual({ success: true })
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fallback to Supabase client when fetch fails', async () => {
      const validInput = { email: 'test@example.com' }

      mockDb.user.findUnique.mockResolvedValue({ id: 'test-user-id' })
      
      // Mock fetch failure
      mockFetch.mockResolvedValue({ ok: false })

      // Mock service client fallback
      const mockServiceClient = {
        auth: {
          resend: vi.fn().mockResolvedValue({ error: null }),
        },
      }
      mockCreateServiceClient.mockResolvedValue(mockServiceClient as any)

      const resultPromise = caller.resendVerificationEmail(validInput)
      
      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(250)
      
      const result = await resultPromise

      expect(result).toEqual({ success: true })
      expect(mockServiceClient.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
      })
    })

    it('should handle service client error gracefully', async () => {
      const validInput = { email: 'test@example.com' }

      mockDb.user.findUnique.mockResolvedValue({ id: 'test-user-id' })
      
      // Mock fetch failure
      mockFetch.mockResolvedValue({ ok: false })

      // Mock service client error
      const mockServiceClient = {
        auth: {
          resend: vi.fn().mockResolvedValue({ error: { message: 'Resend failed' } }),
        },
      }
      mockCreateServiceClient.mockResolvedValue(mockServiceClient as any)

      const resultPromise = caller.resendVerificationEmail(validInput)
      
      // Fast-forward timers
      await vi.advanceTimersByTimeAsync(250)
      
      const result = await resultPromise

      // Should still return success to prevent enumeration
      expect(result).toEqual({ success: true })
    })
  })
})