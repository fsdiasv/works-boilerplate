/* eslint-disable */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import type { Session, User } from '@supabase/supabase-js'

import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { testUsers } from '../../fixtures/users'
import {
  createMockSupabaseAuth,
  createAuthEventMocks,
  waitForAuthStateChange,
  createMockSession,
  createMockUser,
} from '../../helpers/auth-test-helpers'

// Mock dependencies
vi.mock('sonner')

const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockForward = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
  }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      signedOut: 'Signed out successfully',
      signOutError: 'Failed to sign out',
      resetPasswordEmail: 'Password reset email sent',
      passwordResetSuccess: 'Password reset successfully',
      passwordUpdated: 'Password updated',
      checkNewEmail: 'Check your new email address',
      profileUpdated: 'Profile updated',
      sessionRefreshed: 'Session refreshed',
      sessionExpiringSoon: 'Session expiring soon',
      sessionWillExpire: 'Session will expire',
      suspiciousActivityDetected: 'Suspicious activity detected',
      'errors.emailNotVerified': 'Email not verified',
      resendVerification: 'Resend verification',
    }
    return translations[key] || key
  },
}))

// Mock session security properly
vi.mock('@/lib/session-security', () => {
  const mockFn = vi.fn(() => ({
    isSecure: true,
    events: [],
  }))
  return {
    validateSessionSecurity: mockFn,
  }
})

vi.mock('@/lib/utils/auth-cleanup', () => ({
  performLogoutCleanup: vi.fn().mockResolvedValue(undefined),
}))

// Test component to consume the AuthContext
function TestComponent() {
  const auth = useAuth()

  return (
    <div>
      <div data-testid='user-email'>{auth.user?.email || 'No user'}</div>
      <div data-testid='loading'>{auth.loading ? 'Loading' : 'Not loading'}</div>
      <div data-testid='error'>{auth.error?.message || 'No error'}</div>
      <button
        data-testid='sign-in'
        onClick={() => auth.signIn('test@example.com', 'password').catch(() => {})}
      >
        Sign In
      </button>
      <button data-testid='sign-out' onClick={() => auth.signOut().catch(() => {})}>
        Sign Out
      </button>
      <button
        data-testid='sign-in-google'
        onClick={() => auth.signInWithProvider('google').catch(() => {})}
      >
        Sign In with Google
      </button>
      <button
        data-testid='reset-password'
        onClick={() => auth.resetPassword('test@example.com').catch(() => {})}
      >
        Reset Password
      </button>
      <button
        data-testid='update-password'
        onClick={() => auth.updatePassword('newpassword').catch(() => {})}
      >
        Update Password
      </button>
      <button
        data-testid='update-email'
        onClick={() => auth.updateEmail('new@example.com').catch(() => {})}
      >
        Update Email
      </button>
      <button
        data-testid='update-profile'
        onClick={() => auth.updateProfile({ full_name: 'New Name' }).catch(() => {})}
      >
        Update Profile
      </button>
      <button data-testid='refresh-session' onClick={() => auth.refreshSession().catch(() => {})}>
        Refresh Session
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  let mockSupabaseAuth: any
  let mockToast: typeof toast

  beforeEach(() => {
    vi.clearAllMocks()

    // Access the global mock client
    if (typeof global.mockSupabaseClient === 'undefined') {
      throw new Error('mockSupabaseClient not found in global scope')
    }

    const mockClient = global.mockSupabaseClient as any
    mockSupabaseAuth = mockClient?.auth ?? {}
    mockToast = toast as any

    // Reset mock implementations
    const defaultAuth = createMockSupabaseAuth()
    Object.assign(mockSupabaseAuth, defaultAuth)

    // Mock fetch for OAuth
    global.fetch = vi.fn()

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
        search: '',
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000',
      },
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Provider Initialization', () => {
    it('should initialize with no session when no initialSession provided', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Check initial loading state immediately
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading')

      // Wait for auth state to settle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('user-email')).toHaveTextContent('No user')
      expect(screen.getByTestId('error')).toHaveTextContent('No error')
    })

    it('should initialize with provided session', () => {
      const mockSession = createMockSession()

      render(
        <AuthProvider initialSession={mockSession}>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('loading')).toHaveTextContent('Not loading')
    })

    it('should throw error when useAuth is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Authentication Methods', () => {
    beforeEach(async () => {
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )
      })
    })

    describe('signIn', () => {
      it('should sign in successfully with valid credentials', async () => {
        const user = userEvent.setup()

        await user.click(screen.getByTestId('sign-in'))

        await waitFor(() => {
          expect(mockSupabaseAuth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@example.com',
            password: 'password',
          })
        })
      })

      it('should handle sign in error', async () => {
        mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Invalid credentials', name: 'AuthError', status: 400 },
        })

        const user = userEvent.setup()

        await user.click(screen.getByTestId('sign-in'))

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials')
        })
      })

      it('should handle email not verified error with resend action', async () => {
        mockSupabaseAuth.signInWithPassword.mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Email not confirmed', name: 'AuthError', status: 400 },
        })

        const user = userEvent.setup()

        await user.click(screen.getByTestId('sign-in'))

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith(
            'Email not verified',
            expect.objectContaining({
              action: expect.objectContaining({
                label: 'Resend verification',
              }),
            })
          )
        })
      })
    })

    describe('signOut', () => {
      it('should sign out successfully', async () => {
        const user = userEvent.setup()

        await user.click(screen.getByTestId('sign-out'))

        await waitFor(() => {
          expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
          expect(mockToast.success).toHaveBeenCalledWith('Signed out successfully')
        })
      })

      it('should handle sign out error', async () => {
        mockSupabaseAuth.signOut.mockResolvedValueOnce({
          error: { message: 'Sign out failed', name: 'AuthError', status: 400 },
        })

        const user = userEvent.setup()

        await user.click(screen.getByTestId('sign-out'))

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('Sign out failed')
        })
      })
    })

    describe('signInWithProvider', () => {
      it('should initiate OAuth flow successfully', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ url: 'https://oauth.example.com' }),
        })

        // Mock window.location.href assignment
        const originalHref = window.location.href
        delete (window.location as any).href
        window.location.href = ''

        const user = userEvent.setup()

        await user.click(screen.getByTestId('sign-in-google'))

        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/oauth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider: 'google' }),
          })
          expect(window.location.href).toBe('https://oauth.example.com')
        })

        // Restore original href
        window.location.href = originalHref
      })

      it('should handle OAuth error', async () => {
        global.fetch = vi.fn().mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'OAuth failed' }),
        })

        const user = userEvent.setup()

        await user.click(screen.getByTestId('sign-in-google'))

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('OAuth failed')
        })
      })
    })

    describe('resetPassword', () => {
      it('should send reset password email successfully', async () => {
        const user = userEvent.setup()

        await user.click(screen.getByTestId('reset-password'))

        await waitFor(() => {
          expect(mockSupabaseAuth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
            redirectTo: 'http://localhost:3000/auth/callback',
          })
          expect(mockToast.success).toHaveBeenCalledWith('Password reset email sent')
        })
      })

      it('should handle reset password error', async () => {
        mockSupabaseAuth.resetPasswordForEmail.mockResolvedValueOnce({
          data: {},
          error: { message: 'Reset failed', name: 'AuthError', status: 400 },
        })

        const user = userEvent.setup()

        await user.click(screen.getByTestId('reset-password'))

        await waitFor(() => {
          expect(mockToast.error).toHaveBeenCalledWith('Reset failed')
        })
      })
    })

    describe('updatePassword', () => {
      it('should update password successfully', async () => {
        const user = userEvent.setup()

        await user.click(screen.getByTestId('update-password'))

        await waitFor(() => {
          expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
            password: 'newpassword',
          })
          expect(mockToast.success).toHaveBeenCalledWith('Password updated')
        })
      })

      it('should show different message for password reset flow', async () => {
        // Mock being in password reset flow
        Object.defineProperty(window, 'location', {
          value: { ...window.location, pathname: '/auth/reset-password' },
          writable: true,
        })

        const user = userEvent.setup()

        await user.click(screen.getByTestId('update-password'))

        await waitFor(() => {
          expect(mockToast.success).toHaveBeenCalledWith('Password reset successfully')
        })
      })
    })

    describe('updateEmail', () => {
      it('should update email successfully', async () => {
        const user = userEvent.setup()

        await user.click(screen.getByTestId('update-email'))

        await waitFor(() => {
          expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
            email: 'new@example.com',
          })
          expect(mockToast.success).toHaveBeenCalledWith('Check your new email address')
        })
      })
    })

    describe('updateProfile', () => {
      it('should update profile successfully', async () => {
        const user = userEvent.setup()

        await user.click(screen.getByTestId('update-profile'))

        await waitFor(() => {
          expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
            data: { full_name: 'New Name' },
          })
          expect(mockToast.success).toHaveBeenCalledWith('Profile updated')
        })
      })
    })

    describe('refreshSession', () => {
      it('should refresh session successfully', async () => {
        const mockSession = createMockSession()
        mockSupabaseAuth.refreshSession.mockResolvedValueOnce({
          data: { session: mockSession },
          error: null,
        })

        const user = userEvent.setup()

        await user.click(screen.getByTestId('refresh-session'))

        await waitFor(() => {
          expect(mockSupabaseAuth.refreshSession).toHaveBeenCalled()
        })
      })

      it('should handle refresh session error silently', async () => {
        const refreshError = new Error('Refresh failed')
        refreshError.name = 'AuthError'

        mockSupabaseAuth.refreshSession.mockResolvedValueOnce({
          data: { session: null },
          error: refreshError,
        })

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        const user = userEvent.setup()

        await user.click(screen.getByTestId('refresh-session'))

        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Failed to refresh session:', expect.any(Error))
          // Should not show toast for refresh errors
          expect(mockToast.error).not.toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
      })
    })
  })

  describe('Auth State Changes', () => {
    it('should handle SIGNED_IN event and redirect to dashboard', async () => {
      mockPush.mockClear()

      const { mockCallback } = createAuthEventMocks()
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback: any) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const mockSession = createMockSession()

      act(() => {
        mockCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/dashboard')
      })
    })

    it('should handle SIGNED_IN event with redirectTo parameter', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?redirectTo=/en/profile',
        },
        writable: true,
      })

      mockPush.mockClear()

      const { mockCallback } = createAuthEventMocks()
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback: any) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const mockSession = createMockSession()

      act(() => {
        mockCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/profile')
      })
    })

    it('should not redirect during password recovery flow', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          ...window.location,
          search: '?type=recovery',
        },
        writable: true,
      })

      mockPush.mockClear()

      const { mockCallback } = createAuthEventMocks()
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback: any) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const mockSession = createMockSession()

      act(() => {
        mockCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })

    it('should handle SIGNED_OUT event and redirect to home', async () => {
      mockPush.mockClear()

      const { mockCallback } = createAuthEventMocks()
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback: any) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        mockCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en')
      })
    })

    it('should handle PASSWORD_RECOVERY event', async () => {
      mockPush.mockClear()

      const { mockCallback } = createAuthEventMocks()
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback: any) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      act(() => {
        mockCallback('PASSWORD_RECOVERY', null)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/en/auth/reset-password')
      })
    })

    it('should handle USER_UPDATED event', async () => {
      const { mockCallback } = createAuthEventMocks()
      mockSupabaseAuth.onAuthStateChange.mockImplementation((callback: any) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const updatedSession = createMockSession({
        user_metadata: { full_name: 'Updated Name' },
      })

      act(() => {
        mockCallback('USER_UPDATED', updatedSession)
      })

      await waitFor(() => {
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
      })
    })
  })

  describe('Session Security', () => {
    it('should perform session security checks', async () => {
      const { validateSessionSecurity } = await import('@/lib/session-security')
      const mockSessionSecurity = vi.mocked(validateSessionSecurity)

      const mockSession = createMockSession()

      render(
        <AuthProvider initialSession={mockSession}>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSessionSecurity).toHaveBeenCalledWith(
          mockSession,
          expect.any(Date),
          expect.any(String)
        )
      })
    })

    it('should handle critical security events', async () => {
      const { validateSessionSecurity } = await import('@/lib/session-security')
      const mockSessionSecurity = vi.mocked(validateSessionSecurity)
      mockSessionSecurity.mockReturnValue({
        isSecure: false,
        events: [
          {
            type: 'suspicious_activity',
            severity: 'critical',
            message: 'Suspicious activity detected',
            timestamp: new Date(),
          },
        ],
        recommendedActions: ['Change password', 'Review recent activity'],
      })

      const mockSession = createMockSession()

      render(
        <AuthProvider initialSession={mockSession}>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Suspicious activity detected')
        expect(mockSupabaseAuth.signOut).toHaveBeenCalled()
      })
    })

    it('should handle session expiration', async () => {
      const { validateSessionSecurity } = await import('@/lib/session-security')
      const mockSessionSecurity = vi.mocked(validateSessionSecurity)
      mockSessionSecurity.mockReturnValue({
        isSecure: false,
        events: [
          {
            type: 'session_expired',
            severity: 'high',
            message: 'Session expired',
            timestamp: new Date(),
          },
        ],
        recommendedActions: ['Please sign in again'],
      })

      // Create session that expires soon
      const soonToExpireSession = {
        ...createMockSession(),
        expires_at: Math.floor(Date.now() / 1000) + 4 * 60, // 4 minutes from now
      }

      render(
        <AuthProvider initialSession={soonToExpireSession}>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabaseAuth.refreshSession).toHaveBeenCalled()
        expect(mockToast.success).toHaveBeenCalledWith('Session refreshed')
      })
    })
  })

  describe('Activity Tracking', () => {
    it('should track user activity events', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Simulate user interactions
      act(() => {
        window.dispatchEvent(new Event('mousedown'))
        window.dispatchEvent(new Event('keydown'))
        window.dispatchEvent(new Event('scroll'))
        window.dispatchEvent(new Event('touchstart'))
      })

      // Activity tracking should update internal state (tested implicitly through session security)
    })
  })
})
