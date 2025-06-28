'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PrimaryButton } from '@/components/ui/primary-button'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPasswordPage')
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
    <AuthLayout showTestimonial={false}>
      <div className='w-full text-center'>
        <h1 className='mb-4 text-3xl font-bold text-slate-800'>{t('title')}</h1>
        <p className='mb-8 text-sm text-slate-500'>{t('description')}</p>

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

          <PrimaryButton type='submit' isLoading={isLoading}>
            {t('submitButton')}
          </PrimaryButton>
        </form>

        <p className='mt-8 text-sm text-slate-500'>
          {t('backToLogin')}{' '}
          <Link
            href={`/${locale}/login`}
            className='font-semibold text-blue-600 hover:text-blue-700'
          >
            {t('backToLoginLink')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
