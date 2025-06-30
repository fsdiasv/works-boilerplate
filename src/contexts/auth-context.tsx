'use client'

import type { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import { performLogoutCleanup } from '@/lib/utils/auth-cleanup'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  error: SupabaseAuthError | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>
  signOut: () => Promise<void>
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
          router.push(`/${locale}/dashboard`)
          break
        case 'SIGNED_OUT':
          // Only redirect if not manually logging out
          if (!isLoggingOut.current) {
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
          throw signInError
        }
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase]
  )

  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, unknown>) => {
      try {
        setError(null)
        setLoading(true)

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ...metadata,
              locale,
            },
            emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`,
          },
        })

        if (signUpError) {
          setError(signUpError)
          throw signUpError
        }

        toast.success(t('checkEmail'))
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase, locale, t]
  )

  const signOut = useCallback(async () => {
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

      // Navigate to home page
      router.push(`/${locale}`)
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
  }, [supabase, router, locale, t])

  const signInWithProvider = useCallback(
    async (provider: 'google' | 'github' | 'apple') => {
      try {
        setError(null)
        setLoading(true)

        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/${locale}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        })

        if (oauthError) {
          setError(oauthError)
          throw oauthError
        }
      } catch (err) {
        const authError = err as SupabaseAuthError
        toast.error(authError.message)
        throw authError
      } finally {
        setLoading(false)
      }
    },
    [supabase, locale]
  )

  const resetPassword = useCallback(
    async (email: string) => {
      try {
        setError(null)
        setLoading(true)

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
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
    [supabase, locale, t]
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

        toast.success(t('passwordUpdated'))
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

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signIn,
      signUp,
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
      signUp,
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
