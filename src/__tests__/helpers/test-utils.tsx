/* eslint-disable */
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/lib/theme-provider'
import type { User, Session } from '@supabase/supabase-js'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialSession?: Session | null
  user?: User | null
  locale?: string
  messages?: Record<string, any>
  queryClient?: QueryClient
}

// Default test messages
const defaultMessages = {
  auth: {
    toast: {
      signInSuccess: 'Sign in successful',
      signOutSuccess: 'Sign out successful',
      signInError: 'Sign in failed',
      signUpSuccess: 'Sign up successful',
      signUpError: 'Sign up failed',
      passwordResetSuccess: 'Password reset email sent',
      passwordResetError: 'Password reset failed',
    },
    validation: {
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      invalidEmail: 'Invalid email format',
      passwordTooShort: 'Password too short',
    },
  },
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
  },
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderWithProviders(ui: React.ReactElement, options: CustomRenderOptions = {}) {
  const {
    initialSession = null,
    user = null,
    locale = 'en',
    messages = defaultMessages,
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options

  // Create a mock session if user is provided but no session
  const session =
    initialSession ||
    (user
      ? ({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_in: 3600,
          expires_at: Date.now() / 1000 + 3600,
          token_type: 'bearer',
          user,
        } as Session)
      : null)

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <AuthProvider initialSession={session}>{children}</AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </QueryClientProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

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
      ...overrides.user_metadata,
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    ...overrides,
  } as User
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
    user,
  }
}

// Helper for auth state testing
export function renderWithAuth(
  ui: React.ReactElement,
  options: {
    authenticated?: boolean
    user?: Partial<User>
    locale?: string
    messages?: Record<string, any>
  } = {}
) {
  const { authenticated = true, user: userOverrides = {}, ...renderOptions } = options

  const session = authenticated ? createMockSession(userOverrides) : null

  return renderWithProviders(ui, {
    initialSession: session,
    ...renderOptions,
  })
}

// Helper for form testing
export async function waitForFormValidation() {
  // Wait for form validation to complete
  await new Promise(resolve => setTimeout(resolve, 100))
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
