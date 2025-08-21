'use client'

import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { validateSessionSecurity } from '@/lib/session-security'
import { createClient } from '@/lib/supabase/client'
import { performLogoutCleanup } from '@/lib/utils/auth-cleanup'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  error: SupabaseAuthError | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: (redirectTo?: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'github' | 'apple') => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  updateEmail: (newEmail: string) => Promise<void>
  updateProfile: (updates: Partial<User['user_metadata']>) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  initialSession?: Session | null | undefined
}

export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null)
  const [session, setSession] = useState<Session | null>(initialSession ?? null)
  const [loading, setLoading] = useState(!initialSession)
  const [error, setError] = useState<SupabaseAuthError | null>(null)

  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('auth.toast')
  const supabase = useMemo(() => createClient(), [])
  const isLoggingOut = useRef(false)
  const lastActivity = useRef<Date>(new Date())

  // Update last activity on any user interaction
  useEffect(() => {
    const updateActivity = () => {
      lastActivity.current = new Date()
    }

    // Listen for user interactions
    window.addEventListener('mousedown', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('scroll', updateActivity)
    window.addEventListener('touchstart', updateActivity)

    return () => {
      window.removeEventListener('mousedown', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('scroll', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
    }
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
      } else {
        setSession(null)
        setUser(null)
      }

      setLoading(false)

      // Handle auth events
      switch (event) {
        case 'SIGNED_IN':
          // console.log('🔔 SIGNED_IN event fired')
          // console.log('📍 Current pathname:', window.location.pathname)

          // Skip auto-redirect if we're in specific auth flows
          const currentPath = window.location.pathname
          const isInAuthCallback = currentPath.includes('/auth/callback')
          const isInResetPassword = currentPath.includes('/auth/reset-password')

          // Check for recovery flow - via URL parameters or path
          const urlParams = new URLSearchParams(window.location.search)
          const isRecoveryType = urlParams.get('type') === 'recovery'
          const isRecoveryFlow =
            isRecoveryType ||
            isInAuthCallback ||
            isInResetPassword ||
            currentPath.includes('/auth/reset-password')

          // console.log('🔍 Recovery flow checks:', {
          //   urlType: isRecoveryType,
          //   inCallback: isInAuthCallback,
          //   inResetPassword: isInResetPassword,
          //   isRecoveryFlow,
          // })

          if (isRecoveryFlow) {
            // console.log('✅ Recovery/auth flow detected, skipping auto-redirect')
            // Note: Recovery flow cookie is now httpOnly and will be cleaned up server-side
            break
          }
          // console.log('➡️ No special auth flow, proceeding with auto-redirect')

          // Check for redirectTo in URL params or use dashboard as default
          const redirectToParam = urlParams.get('redirectTo')
          const redirectTo =
            redirectToParam !== null && redirectToParam !== ''
              ? redirectToParam
              : `/${locale}/dashboard`

          // Ensure the redirect URL is safe and starts with the locale
          const safeRedirectTo = redirectTo.startsWith(`/${locale}`)
            ? redirectTo
            : `/${locale}${redirectTo.startsWith('/') ? redirectTo : '/dashboard'}`

          router.push(safeRedirectTo)
          break
        case 'SIGNED_OUT':
          // Only redirect if not manually logging out and not on auth pages
          if (!isLoggingOut.current && !window.location.pathname.includes('/auth/')) {
            router.push(`/${locale}`)
          }
          break
        case 'PASSWORD_RECOVERY':
          router.push(`/${locale}/auth/reset-password`)
          break
        case 'USER_UPDATED':
          if (currentSession) {
            setUser(currentSession.user)
          }
          break
      }
    })

    // Check active session on mount
    void supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (activeSession) {
        setSession(activeSession)
        setUser(activeSession.user)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, locale, t])

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null)
        setLoading(true)

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          setError(signInError)

          // Check if error is due to unverified email
          if (signInError.message.toLowerCase().includes('email not confirmed')) {
            toast.error(t('errors.emailNotVerified'), {
              action: {
                label: t('resendVerification'),
                onClick: () => {
                  // Emit a custom event to handle resend verification
                  window.dispatchEvent(new CustomEvent('resendVerification', { detail: { email } }))
                },
              },
            })
          } else {
            toast.error(signInError.message)
          }

          throw signInError
        }
      } catch (err) {
        const authError = err as SupabaseAuthError
        // Error toast already shown above, just re-throw
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase, t]
  )

  const signOut = useCallback(
    async (redirectTo?: string) => {
      try {
        setError(null)
        setLoading(true)
        isLoggingOut.current = true

        // Perform cleanup before signing out
        await performLogoutCleanup()

        // Sign out from Supabase
        const { error: signOutError } = await supabase.auth.signOut()

        if (signOutError) {
          setError(signOutError)
          throw signOutError
        }

        // Clear local state
        setUser(null)
        setSession(null)

        // Show success message
        toast.success(t('signedOut'))

        // Navigate to specified page or home
        const destination =
          redirectTo !== undefined && redirectTo !== '' ? redirectTo : `/${locale}`
        const safeDestination = destination.startsWith(`/${locale}`)
          ? destination
          : `/${locale}${destination.startsWith('/') ? destination : `/${destination}`}`

        router.push(safeDestination)
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message || t('signOutError'))
        throw authError
      } finally {
        setLoading(false)
        // Reset the flag after a delay to ensure navigation completes
        setTimeout(() => {
          isLoggingOut.current = false
        }, 1000)
      }
    },
    [supabase, router, locale, t]
  )

  const signInWithProvider = useCallback(async (provider: 'google' | 'github' | 'apple') => {
    try {
      setError(null)
      setLoading(true)

      // Use secure OAuth endpoint that handles state management server-side
      const response = await fetch('/api/auth/oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      })

      if (!response.ok) {
        const errorData: unknown = await response.json()
        const errorMessage =
          (errorData !== null &&
          errorData !== undefined &&
          typeof errorData === 'object' &&
          'error' in errorData
            ? (errorData.error as string)
            : null) ?? 'OAuth initiation failed'
        throw new Error(errorMessage)
      }

      const responseData: unknown = await response.json()
      const url =
        responseData !== null &&
        responseData !== undefined &&
        typeof responseData === 'object' &&
        'url' in responseData
          ? (responseData.url as string)
          : null

      if (url === null || url === '') {
        throw new Error('No OAuth URL received')
      }

      // Redirect to the OAuth provider
      window.location.href = url
    } catch (err) {
      const error = err as Error
      // Create a proper SupabaseAuthError-like object
      const authError = new Error(error.message) as SupabaseAuthError
      authError.name = 'AuthError'
      setError(authError)
      toast.error(error.message)
      throw authError
    } finally {
      setLoading(false)
    }
  }, [])

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        setError(null)
        setLoading(true)

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        })

        if (resetError) {
          setError(resetError)
          throw resetError
        }

        toast.success(t('resetPasswordEmail'))
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase, t]
  )

  const updatePassword = useCallback(
    async (newPassword: string) => {
      try {
        setError(null)
        setLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        })

        if (updateError) {
          setError(updateError)
          throw updateError
        }

        // Check if we're in a password reset flow
        const isPasswordReset = window.location.pathname.includes('/auth/reset-password')
        toast.success(isPasswordReset ? t('passwordResetSuccess') : t('passwordUpdated'))
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase, t]
  )

  const updateEmail = useCallback(
    async (newEmail: string) => {
      try {
        setError(null)
        setLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({
          email: newEmail,
        })

        if (updateError) {
          setError(updateError)
          throw updateError
        }

        toast.success(t('checkNewEmail'))
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase, t]
  )

  const updateProfile = useCallback(
    async (updates: Partial<User['user_metadata']>) => {
      try {
        setError(null)
        setLoading(true)

        const { error: updateError } = await supabase.auth.updateUser({
          data: updates,
        })

        if (updateError) {
          setError(updateError)
          throw updateError
        }

        toast.success(t('profileUpdated'))
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase, t]
  )

  const refreshSession = useCallback(async () => {
    try {
      setError(null)
      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession()

      if (refreshError) {
        setError(refreshError)
        throw refreshError
      }

      if (refreshedSession) {
        setSession(refreshedSession)
        setUser(refreshedSession.user)
      }
    } catch (err) {
      const authError = err as SupabaseAuthError
      console.error('Failed to refresh session:', authError)
      // Don't show toast for refresh errors
    }
  }, [supabase])

  // Session security validation with automatic actions
  useEffect(() => {
    if (!session) return

    const checkSessionSecurity = async () => {
      const securityCheck = validateSessionSecurity(
        session,
        lastActivity.current,
        navigator.userAgent
        // IP address would come from server-side
      )

      if (!securityCheck.isSecure) {
        const criticalEvents = securityCheck.events.filter(
          e => e.severity === 'critical' || e.severity === 'high'
        )

        if (criticalEvents.length > 0) {
          console.warn('Session security issues detected:', securityCheck.events)

          // Take automatic action for critical security events
          for (const event of criticalEvents) {
            if (event.type === 'session_expired') {
              // Check time to expiry
              const expiresAt = new Date((session.expires_at ?? 0) * 1000)
              const timeToExpiry = expiresAt.getTime() - new Date().getTime()

              if (timeToExpiry < 5 * 60 * 1000) {
                // Less than 5 minutes - attempt automatic refresh
                try {
                  await refreshSession()
                  toast.success(t('sessionRefreshed'))
                } catch {
                  // Refresh failed, warn user
                  toast.warning(t('sessionExpiringSoon'))
                }
              } else {
                // Just warn for now
                toast.warning(t('sessionWillExpire'))
              }
            } else if (event.type === 'suspicious_activity' && event.severity === 'critical') {
              // For critical suspicious activity, force re-authentication
              toast.error(t('suspiciousActivityDetected'))
              await signOut()
            }
          }
        }
      }
    }

    // Check immediately and then every 5 minutes
    void checkSessionSecurity()
    const interval = setInterval(() => void checkSessionSecurity(), 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [session, refreshSession, signOut, t])

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signIn,
      signOut,
      signInWithProvider,
      resetPassword,
      updatePassword,
      updateEmail,
      updateProfile,
      refreshSession,
    }),
    [
      user,
      session,
      loading,
      error,
      signIn,
      signOut,
      signInWithProvider,
      resetPassword,
      updatePassword,
      updateEmail,
      updateProfile,
      refreshSession,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
