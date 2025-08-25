import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import LoginPage from '@/app/[locale]/auth/login/page'

// Mock dependencies
vi.mock('sonner')

// Mock useAuth hook
const mockSignIn = vi.fn()
const mockSignOut = vi.fn()
const mockSignInWithProvider = vi.fn()
const mockResetPassword = vi.fn()
const mockUpdatePassword = vi.fn()
const mockUpdateEmail = vi.fn()
const mockUpdateProfile = vi.fn()
const mockRefreshSession = vi.fn()

const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  error: null,
  signIn: mockSignIn,
  signOut: mockSignOut,
  signInWithProvider: mockSignInWithProvider,
  resetPassword: mockResetPassword,
  updatePassword: mockUpdatePassword,
  updateEmail: mockUpdateEmail,
  updateProfile: mockUpdateProfile,
  refreshSession: mockRefreshSession,
}

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock next/navigation
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'auth.loginPage': {
        title: 'Sign in to your account',
        subtitle: 'Welcome back! Please enter your details.',
        subtitleLink: 'Sign up',
        emailLabel: 'Email',
        emailPlaceholder: 'Enter your email',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        forgotPasswordLink: 'Forgot password?',
        submitButton: 'Sign in',
        divider: 'Or continue with',
        emailVerified: 'Email verified successfully!',
      },
      'auth.errors': {
        generic: 'Something went wrong',
        oauthProviderError: 'OAuth provider error',
        oauthMissingCode: 'OAuth missing code',
        oauthStateMismatch: 'OAuth state mismatch',
        oauthExchangeFailed: 'OAuth exchange failed',
        oauthInvalidSession: 'OAuth invalid session',
        oauthSessionMismatch: 'OAuth session mismatch',
        oauthCodeReused: 'OAuth code reused',
        oauthUnexpectedError: 'OAuth unexpected error',
        expiredLink: 'Expired link',
      },
      auth: {
        'signupPage.verificationEmailSent': 'Verification email sent',
      },
    }
    return translations[namespace]?.[key] || key
  },
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock tRPC
const mockResendVerificationMutation = {
  mutate: vi.fn(),
  isLoading: false,
  error: null,
}

vi.mock('@/trpc/react', () => ({
  api: {
    auth: {
      resendVerificationEmail: {
        useMutation: vi.fn(() => mockResendVerificationMutation),
      },
    },
  },
}))

// Mock auth components
vi.mock('@/components/auth/auth-layout', () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='auth-layout'>{children}</div>
  ),
}))

vi.mock('@/components/ui/form-input', () => ({
  FormInput: (props: {
    id: string
    type?: string
    placeholder?: string
    [key: string]: unknown
  }) => (
    <input
      data-testid={props.id}
      type={props.type ?? 'text'}
      placeholder={props.placeholder ?? ''}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/password-input', () => ({
  PasswordInput: (props: { id: string; placeholder?: string; [key: string]: unknown }) => (
    <input
      data-testid={props.id}
      type='password'
      placeholder={props.placeholder ?? ''}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/primary-button', () => ({
  PrimaryButton: ({
    children,
    isLoading,
    ...props
  }: {
    children: React.ReactNode
    isLoading?: boolean
    [key: string]: unknown
  }) => (
    <button {...props} disabled={isLoading ?? false} data-testid='submit-button'>
      {isLoading === true ? 'Loading...' : children}
    </button>
  ),
}))

vi.mock('@/components/ui/remember-me-checkbox', () => ({
  RememberMeCheckbox: ({
    checked,
    onCheckedChange,
    ...props
  }: {
    checked?: boolean
    onCheckedChange?: (checked: boolean) => void
    [key: string]: unknown
  }) => (
    <input
      data-testid='remember-me'
      type='checkbox'
      checked={checked ?? false}
      onChange={e => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/social-login-button', () => ({
  SocialLoginButton: ({ provider }: { provider: string }) => (
    <button data-testid={`social-login-${provider}`}>Sign in with {provider}</button>
  ),
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    mockSearchParams.delete('error')
    mockSearchParams.delete('verified')
    mockSearchParams.delete('email')

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: vi.fn(),
        removeItem: vi.fn(),
        getItem: vi.fn(),
      },
      writable: true,
    })

    // Mock matchMedia for next-themes
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('should render login form elements', () => {
    render(<LoginPage />)

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByText('Welcome back! Please enter your details.')).toBeInTheDocument()
    expect(screen.getByTestId('email')).toBeInTheDocument()
    expect(screen.getByTestId('password')).toBeInTheDocument()
    expect(screen.getByTestId('remember-me')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByText('Forgot password?')).toBeInTheDocument()
  })

  it('should render social login buttons', () => {
    render(<LoginPage />)

    expect(screen.getByTestId('social-login-google')).toBeInTheDocument()
    expect(screen.getByTestId('social-login-twitter')).toBeInTheDocument()
    expect(screen.getByTestId('social-login-github')).toBeInTheDocument()
  })

  it('should handle form validation errors', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    // Submit without filling fields
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      // Form validation should prevent submission
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  it('should fill email from search params', () => {
    mockSearchParams.set('email', 'test@example.com')
    render(<LoginPage />)

    const emailInput = screen.getByTestId('email') as HTMLInputElement
    expect(emailInput.value ?? '').toBe('test@example.com')
  })

  it('should handle email verification success message', () => {
    mockSearchParams.set('verified', 'true')
    render(<LoginPage />)

    expect(toast.success).toHaveBeenCalledWith('Email verified successfully!')
  })

  it('should handle OAuth errors from search params', () => {
    mockSearchParams.set('error', 'oauth_error')
    render(<LoginPage />)

    expect(toast.error).toHaveBeenCalledWith('OAuth provider error')
  })

  it('should handle generic errors from search params', () => {
    mockSearchParams.set('error', 'unknown_error')
    render(<LoginPage />)

    expect(toast.error).toHaveBeenCalledWith('Something went wrong')
  })

  it('should handle expired link error', () => {
    mockSearchParams.set('error', 'expired_link')
    render(<LoginPage />)

    expect(toast.error).toHaveBeenCalledWith('Expired link')
  })

  it('should handle remember me checkbox', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const rememberMeCheckbox = screen.getByTestId('remember-me') as HTMLInputElement
    expect(rememberMeCheckbox.checked).toBe(false)

    await user.click(rememberMeCheckbox)
    expect(rememberMeCheckbox.checked).toBe(true)
  })

  it('should show loading state during form submission', async () => {
    const user = userEvent.setup()

    // Mock signIn to return a promise that takes time
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<LoginPage />)

    // Fill form
    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.type(screen.getByTestId('password'), 'password123')

    // Submit form
    await user.click(screen.getByTestId('submit-button'))

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  it('should call signIn with correct credentials', async () => {
    const user = userEvent.setup()

    mockSignIn.mockResolvedValue(undefined)

    render(<LoginPage />)

    // Fill form
    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.type(screen.getByTestId('password'), 'password123')

    // Submit form
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('should handle remember me localStorage interaction', async () => {
    const user = userEvent.setup()
    const setItemSpy = vi.spyOn(window.localStorage, 'setItem')
    const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem')

    mockSignIn.mockResolvedValue(undefined)

    render(<LoginPage />)

    // Fill form and check remember me
    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.type(screen.getByTestId('password'), 'password123')
    await user.click(screen.getByTestId('remember-me'))

    // Submit form
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith('rememberMe', 'true')
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    // Test unchecking remember me
    vi.clearAllMocks()
    await user.click(screen.getByTestId('remember-me')) // uncheck
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(removeItemSpy).toHaveBeenCalledWith('rememberMe')
    })
  })

  it('should handle resend verification event listener', () => {
    render(<LoginPage />)

    // Simulate custom event
    const customEvent = new CustomEvent('resendVerification', {
      detail: { email: 'test@example.com' },
    })

    window.dispatchEvent(customEvent)

    expect(mockResendVerificationMutation.mutate).toHaveBeenCalledWith({
      email: 'test@example.com',
    })
  })

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(<LoginPage />)

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resendVerification', expect.any(Function))
  })
})
