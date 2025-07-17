'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PasswordInput } from '@/components/ui/password-input'
import { PrimaryButton } from '@/components/ui/primary-button'
import { RememberMeCheckbox } from '@/components/ui/remember-me-checkbox'
import { SocialLoginButton } from '@/components/ui/social-login-button'
import { useAuth } from '@/hooks/use-auth'
import { api } from '@/trpc/react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const t = useTranslations('auth.loginPage')
  const tError = useTranslations('auth.errors')
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { signIn } = useAuth()

  const resendVerificationMutation = api.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success(tAuth('signupPage.verificationEmailSent'))
    },
    onError: () => {
      toast.error(tError('generic'))
    },
  })

  // Handle OAuth callback errors and verification success
  useEffect(() => {
    const error = searchParams.get('error')
    const verified = searchParams.get('verified')

    // Handle successful email verification
    if (verified === 'true') {
      toast.success(t('emailVerified'))
    }

    // Handle errors
    if (error !== null && error !== '') {
      let errorMessage = tError('generic')

      switch (error) {
        case 'oauth_error':
          errorMessage = tError('oauthProviderError')
          break
        case 'missing_code':
          errorMessage = tError('oauthMissingCode')
          break
        case 'state_mismatch':
          errorMessage = tError('oauthStateMismatch')
          break
        case 'exchange_failed':
          errorMessage = tError('oauthExchangeFailed')
          break
        case 'invalid_session':
          errorMessage = tError('oauthInvalidSession')
          break
        case 'session_mismatch':
          errorMessage = tError('oauthSessionMismatch')
          break
        case 'code_reused':
          errorMessage = tError('oauthCodeReused')
          break
        case 'unexpected_error':
          errorMessage = tError('oauthUnexpectedError')
          break
        case 'expired_link':
          errorMessage = tError('expiredLink')
          break
      }

      toast.error(errorMessage)
    }
  }, [searchParams, tError, t])

  // Handle resend verification event
  useEffect(() => {
    const handleResendVerification = (event: CustomEvent<{ email: string }>) => {
      void resendVerificationMutation.mutate({ email: event.detail.email })
    }

    window.addEventListener('resendVerification', handleResendVerification as EventListener)
    return () => {
      window.removeEventListener('resendVerification', handleResendVerification as EventListener)
    }
  }, [resendVerificationMutation])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true')
      } else {
        localStorage.removeItem('rememberMe')
      }

      await signIn(data.email, data.password)
      // Redirect is handled by auth context
    } catch {
      // Error is handled by auth context with toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className='w-full'>
        <h1 className='mb-2 text-3xl font-bold text-slate-800 sm:text-4xl lg:text-4xl xl:text-5xl'>
          {t('title')}
        </h1>
        <p className='mb-8 text-sm text-slate-500 sm:text-base'>
          {t('subtitle')}{' '}
          <Link
            href={`/${locale}/auth/signup`}
            className='font-semibold text-blue-600 hover:text-blue-700'
          >
            {t('subtitleLink')}
          </Link>
        </p>

        <form onSubmit={e => void handleSubmit(onSubmit)(e)} className='space-y-6'>
          <FormInput
            id='email'
            type='email'
            label={t('emailLabel')}
            placeholder={t('emailPlaceholder')}
            autoComplete='username email'
            {...(errors.email && { error: errors.email.message })}
            {...register('email')}
          />

          <div>
            <PasswordInput
              id='password'
              label={t('passwordLabel')}
              placeholder={t('passwordPlaceholder')}
              autoComplete='current-password'
              {...(errors.password && { error: errors.password.message })}
              {...register('password')}
            />
            <div className='mt-2 text-right'>
              <Link
                href={`/${locale}/auth/forgot-password`}
                className='text-sm font-semibold text-blue-600 hover:text-blue-700'
              >
                {t('forgotPasswordLink')}
              </Link>
            </div>
          </div>

          <RememberMeCheckbox
            checked={rememberMe}
            onCheckedChange={setRememberMe}
            showTrustBadge={false}
          />

          <PrimaryButton type='submit' isLoading={isLoading}>
            {t('submitButton')}
          </PrimaryButton>
        </form>

        <div className='mt-6'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-slate-300' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='bg-white px-2 text-slate-500'>{t('divider')}</span>
            </div>
          </div>

          <div className='mt-6 grid grid-cols-3 gap-3'>
            <SocialLoginButton provider='google' />
            <SocialLoginButton provider='twitter' />
            <SocialLoginButton provider='github' />
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}
