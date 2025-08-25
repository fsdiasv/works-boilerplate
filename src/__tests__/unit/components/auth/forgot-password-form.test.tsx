import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import ForgotPasswordPage from '@/app/[locale]/auth/forgot-password/page'

// Mock useAuth hook
const mockResetPassword = vi.fn()

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    signInWithProvider: vi.fn(),
    resetPassword: mockResetPassword,
    updatePassword: vi.fn(),
    updateEmail: vi.fn(),
    updateProfile: vi.fn(),
    refreshSession: vi.fn(),
  }),
}))

// Mock next/navigation
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'auth.forgotPasswordPage': {
        title: 'Forgot your password?',
        description:
          "Don't worry! Enter your email address and we'll send you a link to reset your password.",
        emailLabel: 'Email address',
        emailPlaceholder: 'Enter your email address',
        submitButton: 'Send reset link',
        backToLogin: 'Remember your password?',
        backToLoginLink: 'Sign in here',
      },
    }
    return translations[namespace]?.[key] || key
  },
  useLocale: () => 'en',
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock auth components
vi.mock('@/components/auth/auth-layout', () => ({
  AuthLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='auth-layout'>{children}</div>
  ),
}))

vi.mock('@/components/ui/form-input', () => ({
  FormInput: (props: any) => (
    <input
      data-testid={props.id}
      type={props.type || 'text'}
      placeholder={props.placeholder}
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/primary-button', () => ({
  PrimaryButton: ({ children, isLoading, ...props }: any) => (
    <button {...props} disabled={isLoading} data-testid='submit-button'>
      {isLoading ? 'Loading...' : children}
    </button>
  ),
}))

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
    mockResetPassword.mockReset()

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

  it('should render forgot password form elements', () => {
    render(<ForgotPasswordPage />)

    expect(screen.getByText('Forgot your password?')).toBeInTheDocument()
    expect(
      screen.getByText(
        "Don't worry! Enter your email address and we'll send you a link to reset your password."
      )
    ).toBeInTheDocument()
    expect(screen.getByTestId('email')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
    expect(screen.getByText('Remember your password?')).toBeInTheDocument()
    expect(screen.getByText('Sign in here')).toBeInTheDocument()
  })

  it('should render back to login link with correct href', () => {
    render(<ForgotPasswordPage />)

    const backToLoginLink = screen.getByRole('link', { name: 'Sign in here' })
    expect(backToLoginLink).toHaveAttribute('href', '/en/auth/login')
  })

  it('should validate required email field', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)

    // Submit without filling email
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      // Form validation should prevent submission
      expect(mockResetPassword).not.toHaveBeenCalled()
    })
  })

  it('should validate email format', async () => {
    const user = userEvent.setup()
    render(<ForgotPasswordPage />)

    // Enter invalid email format
    await user.type(screen.getByTestId('email'), 'invalid-email')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockResetPassword).not.toHaveBeenCalled()
    })
  })

  it('should submit form with valid email', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue(undefined)

    render(<ForgotPasswordPage />)

    // Fill form with valid email
    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
    })
  })

  it('should show loading state during form submission', async () => {
    const user = userEvent.setup()

    // Create a promise that we can control
    let resolvePromise: () => void
    const resetPasswordPromise = new Promise<void>(resolve => {
      resolvePromise = resolve
    })
    mockResetPassword.mockReturnValue(resetPasswordPromise)

    render(<ForgotPasswordPage />)

    // Fill and submit form
    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.click(screen.getByTestId('submit-button'))

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })

    // Resolve the promise
    resolvePromise!()

    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByText('Send reset link')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  it('should handle successful password reset', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockResolvedValue(undefined)

    render(<ForgotPasswordPage />)

    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
    })

    // Button should be re-enabled after success
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  it('should handle password reset errors', async () => {
    const user = userEvent.setup()
    mockResetPassword.mockRejectedValue(new Error('Reset failed'))

    render(<ForgotPasswordPage />)

    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.click(screen.getByTestId('submit-button'))

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com')
    })

    // Button should be re-enabled after error
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  it('should reset loading state after error', async () => {
    const user = userEvent.setup()

    // Create a controlled promise to test loading state
    let rejectPromise: (error: Error) => void
    const resetPasswordPromise = new Promise<void>((_, reject) => {
      rejectPromise = reject
    })
    mockResetPassword.mockReturnValue(resetPasswordPromise)

    render(<ForgotPasswordPage />)

    await user.type(screen.getByTestId('email'), 'test@example.com')
    await user.click(screen.getByTestId('submit-button'))

    // Initially shows loading
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    // Reject the promise to trigger error
    rejectPromise!(new Error('Network error'))

    // Should reset loading state after error
    await waitFor(() => {
      expect(screen.getByText('Send reset link')).toBeInTheDocument()
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })
  })

  it('should show centered layout for forgot password form', () => {
    render(<ForgotPasswordPage />)

    // Check that the layout indicates centered content
    const mainDiv = screen.getByTestId('auth-layout').querySelector('div.w-full.text-center')
    expect(mainDiv).toBeInTheDocument()
  })

  it('should have proper form accessibility', () => {
    render(<ForgotPasswordPage />)

    const form = screen.getByTestId('submit-button').closest('form')
    expect(form).toBeInTheDocument()

    const emailInput = screen.getByTestId('email')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autocomplete', 'email')
  })
})
