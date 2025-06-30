'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PasswordInput } from '@/components/ui/password-input'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SocialLoginButton } from '@/components/ui/social-login-button'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignUpPage() {
  const t = useTranslations('auth.signupPage')
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async () => {
    setIsLoading(true)
    // TODO: Implement actual signup API call with form data
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
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
            autoComplete='email'
            {...(errors.email && { error: errors.email.message })}
            {...register('email')}
          />

          <PasswordInput
            id='password'
            label={t('passwordLabel')}
            placeholder={t('passwordPlaceholder')}
            autoComplete='new-password'
            {...(errors.password && { error: errors.password.message })}
            {...register('password')}
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
