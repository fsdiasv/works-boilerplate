import { vi } from 'vitest'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { testUsers, testCredentials } from '../fixtures/users'

// Helper to create mock user
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: null,
    phone_confirmed_at: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {
      full_name: 'Test User',
      avatar_url: null,
      ...overrides.user_metadata
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    ...overrides
  }
}

// Helper to create mock session
export function createMockSession(userOverrides: Partial<User> = {}): Session {
  const user = createMockUser(userOverrides)
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Date.now() / 1000 + 3600,
    token_type: 'bearer',
    user
  }
}

export class MockAuthError extends Error implements AuthError {
  name = 'AuthError' as const
  status: number
  
  constructor(message: string, status: number = 400) {
    super(message)
    this.status = status
  }
}

export function createMockSupabaseAuth() {
  return {
    signInWithPassword: vi.fn().mockImplementation(async ({ email, password }) => {
      if (email === testCredentials.valid.email && password === testCredentials.valid.password) {
        return {
          data: {
            user: testUsers.defaultUser,
            session: {
              access_token: 'mock-access-token',
              refresh_token: 'mock-refresh-token',
              expires_in: 3600,
              expires_at: Date.now() / 1000 + 3600,
              token_type: 'bearer',
              user: testUsers.defaultUser
            } as Session
          },
          error: null
        }
      }
      
      return {
        data: { user: null, session: null },
        error: new MockAuthError('Invalid login credentials', 400)
      }
    }),

    signUp: vi.fn().mockImplementation(async ({ email, password, options }) => {
      if (email && password && password.length >= 6) {
        const user = {
          ...testUsers.defaultUser,
          email,
          user_metadata: options?.data || {}
        }
        
        return {
          data: {
            user,
            session: null // Email confirmation required
          },
          error: null
        }
      }
      
      return {
        data: { user: null, session: null },
        error: new MockAuthError('Signup failed', 400)
      }
    }),

    signOut: vi.fn().mockResolvedValue({
      error: null
    }),

    resetPasswordForEmail: vi.fn().mockImplementation(async (email: string) => {
      if (email && email.includes('@')) {
        return { data: {}, error: null }
      }
      
      return {
        data: {},
        error: new MockAuthError('Invalid email', 400)
      }
    }),

    updateUser: vi.fn().mockImplementation(async (attributes) => {
      return {
        data: {
          user: {
            ...testUsers.defaultUser,
            ...attributes,
            user_metadata: {
              ...testUsers.defaultUser.user_metadata,
              ...attributes.data
            }
          }
        },
        error: null
      }
    }),

    onAuthStateChange: vi.fn().mockImplementation((callback) => {
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      }
    }),

    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null
    }),

    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null
    })
  }
}

export function createAuthEventMocks() {
  const mockCallback = vi.fn()
  
  const triggerAuthEvent = (event: string, session?: Session | null) => {
    mockCallback(event, session)
  }
  
  return {
    mockCallback,
    triggerAuthEvent,
    triggerSignIn: (session: Session) => triggerAuthEvent('SIGNED_IN', session),
    triggerSignOut: () => triggerAuthEvent('SIGNED_OUT', null),
    triggerTokenRefreshed: (session: Session) => triggerAuthEvent('TOKEN_REFRESHED', session),
    triggerPasswordRecovery: (session: Session) => triggerAuthEvent('PASSWORD_RECOVERY', session)
  }
}

export function mockAuthContextValue(overrides: any = {}) {
  return {
    user: null,
    session: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signInWithProvider: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    updateEmail: vi.fn(),
    updateProfile: vi.fn(),
    refreshSession: vi.fn(),
    ...overrides
  }
}

export async function waitForAuthStateChange() {
  // Wait for auth state changes to propagate
  await new Promise(resolve => setTimeout(resolve, 100))
}

export function expectToastMessage(toastMock: any, type: 'success' | 'error', message?: string) {
  expect(toastMock[type]).toHaveBeenCalled()
  if (message) {
    expect(toastMock[type]).toHaveBeenCalledWith(expect.stringContaining(message))
  }
}

export function createSecurePasswordTestCases() {
  return {
    weak: [
      '123',
      'password',
      '12345678',
      'qwerty',
      'abc123'
    ],
    medium: [
      'Password123',
      'mypassword1',
      'TestPass99'
    ],
    strong: [
      'MySecur3P@ssw0rd!',
      'Str0ng#P@ssw0rd',
      'C0mpl3x!T3st#P@ss'
    ]
  }
}