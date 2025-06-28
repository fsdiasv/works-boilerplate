'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PasswordInput } from '@/components/ui/password-input'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SocialLoginButton } from '@/components/ui/social-login-button'

export default function LoginPage() {
  const t = useTranslations('auth.loginPage')
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
        <h1 className='mb-2 text-3xl font-bold text-slate-800'>{t('title')}</h1>
        <p className='mb-8 text-sm text-slate-500'>
          {t('subtitle')}{' '}
          <Link
            href={`/${locale}/signup`}
            className='font-semibold text-blue-600 hover:text-blue-700'
          >
            {t('subtitleLink')}
          </Link>
        </p>

        <form onSubmit={e => void handleSubmit(e)} className='space-y-6'>
          <FormInput
            id='email'
            name='email'
            type='email'
            label={t('emailLabel')}
            placeholder={t('emailPlaceholder')}
            required
            autoComplete='email'
          />

          <div>
            <PasswordInput
              id='password'
              name='password'
              label={t('passwordLabel')}
              placeholder={t('passwordPlaceholder')}
              required
              autoComplete='current-password'
            />
            <div className='mt-2 text-right'>
              <Link
                href={`/${locale}/forgot-password`}
                className='text-sm font-semibold text-blue-600 hover:text-blue-700'
              >
                {t('forgotPasswordLink')}
              </Link>
            </div>
          </div>

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
      </div>
    </AuthLayout>
  )
}
