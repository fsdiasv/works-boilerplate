'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PrimaryButton } from '@/components/ui/primary-button'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPasswordPage')
  const locale = useLocale()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (_data: ForgotPasswordFormData) => {
    setIsLoading(true)
    // TODO: Implement actual password reset API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  return (
    <AuthLayout showTestimonial={false}>
      <div className='w-full text-center'>
        <h1 className='mb-4 text-3xl font-bold text-slate-800 sm:text-4xl lg:text-5xl'>
          {t('title')}
        </h1>
        <p className='mb-8 text-sm text-slate-500 sm:text-base lg:text-lg'>{t('description')}</p>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className='space-y-6'>
          <FormInput
            id='email'
            type='email'
            label={t('emailLabel')}
            placeholder={t('emailPlaceholder')}
            autoComplete='email'
            {...(errors.email && { error: errors.email.message })}
            {...register('email')}
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
