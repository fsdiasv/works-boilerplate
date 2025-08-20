'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'
import { PrimaryButton } from '@/components/ui/primary-button'
import { useAuth } from '@/hooks/use-auth'

type ResetPasswordFormData = {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPasswordPage')
  const tValidation = useTranslations('validation')
  const locale = useLocale()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const { updatePassword, user } = useAuth()

  const resetPasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, tValidation('passwordMinLength'))
        .regex(/[A-Z]/, tValidation('passwordUppercase'))
        .regex(/[a-z]/, tValidation('passwordLowercase'))
        .regex(/[0-9]/, tValidation('passwordNumber')),
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: tValidation('passwordMatch'),
      path: ['confirmPassword'],
    })

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const passwordValue = watch('password', '')

  // Check if user has a valid session from password recovery
  useEffect(() => {
    // Check if we're in recovery flow (cookie set by callback route)
    const isRecoveryFlow = document.cookie.includes('recovery_flow=true')
    // console.log('🔍 Reset password page - checking recovery flow:', isRecoveryFlow)
    // console.log('👤 User present?', !!user)

    let waitTimer: NodeJS.Timeout | undefined

    // If in recovery flow, wait a bit more for the session to be established
    if (isRecoveryFlow && user === null) {
      // console.log('⏳ In recovery flow but no user yet, waiting...')
      setIsCheckingSession(true)
      // Give more time for the session to be established
      waitTimer = setTimeout(() => {
        // Need to check again in case user state changed
        setIsCheckingSession(false)
      }, 1500)
    } else if (user === null) {
      // Not in recovery flow and no user - invalid access
      // console.log('❌ No recovery flow and no user, redirecting')
      toast.error(t('invalidSession'))
      router.push(`/${locale}/auth/forgot-password`)
    } else {
      // User is present
      // console.log('✅ User session present')
      setIsCheckingSession(false)
    }

    return () => {
      if (waitTimer) {
        clearTimeout(waitTimer)
      }
    }
  }, [user, router, locale, t])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      await updatePassword(data.password)

      // Success toast is handled by auth context
      // Redirect to login after successful password reset
      // User needs to log in with new password
      router.push(`/${locale}/auth/login`)
    } catch {
      // Error is handled by auth context with toast
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <AuthLayout>
        <div className='w-full text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-sm text-slate-500'>{t('checkingSession')}</p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className='w-full'>
        <h1 className='mb-2 text-3xl font-bold text-slate-800 sm:text-4xl lg:text-4xl xl:text-5xl'>
          {t('title')}
        </h1>
        <p className='mb-8 text-sm text-slate-500 sm:text-base'>{t('subtitle')}</p>

        <form onSubmit={e => void handleSubmit(onSubmit)(e)} className='space-y-6'>
          <div>
            <PasswordInput
              id='password'
              label={t('passwordLabel')}
              placeholder={t('passwordPlaceholder')}
              autoComplete='new-password'
              {...(errors.password && { error: errors.password.message })}
              {...register('password')}
            />
            <PasswordStrengthIndicator password={passwordValue} className='mt-2' />
          </div>

          <PasswordInput
            id='confirmPassword'
            label={t('confirmPasswordLabel')}
            placeholder={t('confirmPasswordPlaceholder')}
            autoComplete='new-password'
            {...(errors.confirmPassword && { error: errors.confirmPassword.message })}
            {...register('confirmPassword')}
          />

          <PrimaryButton type='submit' isLoading={isLoading}>
            {t('submitButton')}
          </PrimaryButton>
        </form>

        <div className='mt-6 text-center'>
          <Link
            href={`/${locale}/auth/login`}
            className='text-sm font-semibold text-blue-600 hover:text-blue-700'
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
