'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PasswordInput } from '@/components/ui/password-input'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SocialLoginButton } from '@/components/ui/social-login-button'

export default function SignUpPage() {
  const t = useTranslations('auth.signupPage')
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
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
            href={`/${locale}/login`}
            className='font-semibold text-blue-600 hover:text-blue-700'
          >
            {t('subtitleLink')}
          </Link>
        </p>

        <form onSubmit={e => void handleSubmit(e)} className='space-y-6'>
          <FormInput
            id='name'
            name='name'
            label={t('nameLabel')}
            placeholder={t('namePlaceholder')}
            required
            autoComplete='name'
          />

          <FormInput
            id='email'
            name='email'
            type='email'
            label={t('emailLabel')}
            placeholder={t('emailPlaceholder')}
            required
            autoComplete='email'
          />

          <PasswordInput
            id='password'
            name='password'
            label={t('passwordLabel')}
            placeholder={t('passwordPlaceholder')}
            required
            autoComplete='new-password'
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

          <div className='mt-6 flex gap-4'>
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
