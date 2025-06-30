'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/auth-layout'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'
import { PrimaryButton } from '@/components/ui/primary-button'
import { useAuth } from '@/hooks/use-auth'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPasswordPage')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)
  const { updatePassword } = useAuth()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const passwordValue = watch('password', '')

  useEffect(() => {
    // Check if we have the required token/code in the URL
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (token === null || token === '' || type !== 'recovery') {
      setIsValidToken(false)
    }
  }, [searchParams])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      await updatePassword(data.password)
      // Redirect to login after successful password reset
      router.push(`/${locale}/auth/login`)
    } catch {
      // Error is handled by auth context with toast
    } finally {
      setIsLoading(false)
    }
  }

  if (!isValidToken) {
    return (
      <AuthLayout>
        <div className='w-full text-center'>
          <h1 className='mb-4 text-2xl font-bold text-slate-800 sm:text-3xl'>
            {t('invalidTokenTitle')}
          </h1>
          <p className='mb-6 text-sm text-slate-500 sm:text-base'>{t('invalidTokenMessage')}</p>
          <Link
            href={`/${locale}/auth/forgot-password`}
            className='font-semibold text-blue-600 hover:text-blue-700'
          >
            {t('requestNewLink')}
          </Link>
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
