'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SocialLoginButton } from '@/components/ui/social-login-button'
import { api } from '@/trpc/react'

export default function SignUpPage() {
  const t = useTranslations('auth.signupPage')
  const tAuth = useTranslations('auth')
  const tValidation = useTranslations('validation')
  const locale = useLocale()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const signupSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(2, tValidation('nameMinLength'))
          .max(100, tValidation('max', { max: 100 })),
        email: z.string().email(tValidation('email')).min(1, tValidation('required')),
        password: z
          .string()
          .min(8, tValidation('passwordMinLength'))
          .regex(/[A-Z]/, tValidation('passwordUppercase'))
          .regex(/[a-z]/, tValidation('passwordLowercase'))
          .regex(/[0-9]/, tValidation('passwordNumber'))
          .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/, tValidation('passwordSpecialChar'))
          .refine(
            password => {
              // Check for dictionary words
              const commonWords = [
                'password',
                'admin',
                'user',
                'login',
                'welcome',
                'secret',
                'access',
              ]
              const lowerPassword = password.toLowerCase()
              return !commonWords.some(word => lowerPassword.includes(word))
            },
            { message: tValidation('passwordCommonWords') }
          ),
      }),
    [tValidation]
  )

  type SignupFormData = z.infer<typeof signupSchema>

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const passwordValue = watch('password', '')

  const signUpMutation = api.auth.signUp.useMutation({
    onSuccess: () => {
      toast.success(t('verificationEmailSent'))
      // Small delay to ensure all operations complete before navigation
      setTimeout(() => {
        router.push(`/${locale}/auth/check-email`)
      }, 100)
    },
    onError: error => {
      // Handle specific error cases
      if (error.data?.code === 'CONFLICT') {
        if (error.message.includes('Email already registered')) {
          toast.error(tAuth('errors.emailAlreadyRegistered'))
        } else {
          toast.error(error.message)
        }
      } else {
        toast.error(error.message)
      }
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      await signUpMutation.mutateAsync({
        email: data.email,
        password: data.password,
        fullName: data.name,
        locale,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className='w-full'>
        <h1 className='mb-2 text-3xl font-bold text-slate-800 sm:text-4xl lg:text-5xl'>
          {t('title')}
        </h1>
        <p className='mb-8 text-sm text-slate-500 sm:text-base lg:text-lg'>
          {t('subtitle')}{' '}
          <Link
            href={`/${locale}/auth/login`}
            className='font-semibold text-blue-600 hover:text-blue-700'
          >
            {t('subtitleLink')}
          </Link>
        </p>

        <form onSubmit={e => void handleSubmit(onSubmit)(e)} className='space-y-6'>
          <FormInput
            id='name'
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            autoComplete='name'
            {...(errors.name && { error: errors.name.message })}
            {...register('name')}
          />

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
              autoComplete='new-password'
              {...(errors.password && { error: errors.password.message })}
              {...register('password')}
            />
            <PasswordStrengthIndicator password={passwordValue} className='mt-2' />
          </div>

          <PrimaryButton type='submit' isLoading={isLoading || signUpMutation.isPending}>
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

        <p className='mt-8 text-center text-xs text-slate-500'>
          {t('legalText')}{' '}
          <Link
            href={`/${locale}/terms`}
            className='font-semibold text-slate-800 hover:text-blue-600'
          >
            {t('termsOfService')}
          </Link>{' '}
          {t('and')}{' '}
          <Link
            href={`/${locale}/privacy`}
            className='font-semibold text-slate-800 hover:text-blue-600'
          >
            {t('privacyPolicy')}
          </Link>
          .
        </p>
      </div>
    </AuthLayout>
  )
}
