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
import { PrimaryButton } from '@/components/ui/primary-button'
import { api } from '@/trpc/react'

const resendSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
})

type ResendFormData = z.infer<typeof resendSchema>

export default function ResendVerificationPage() {
  const t = useTranslations('auth.resendVerificationPage')
  const tAuth = useTranslations('auth')
  const tError = useTranslations('auth.errors')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  // Pre-fill email if passed as query param
  const defaultEmail = searchParams.get('email') ?? ''
  const reason = searchParams.get('reason')

  // Show toast if user came from expired link
  useEffect(() => {
    if (reason === 'expired_link') {
      toast.error(tError('expiredLink'))
    }
  }, [reason, tError])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: defaultEmail,
    },
  })

  const resendVerificationMutation = api.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast.success(tAuth('signupPage.verificationEmailSent'))
      setIsLoading(false)
    },
    onError: error => {
      toast.error(error.message || tAuth('errors.genericError'))
      setIsLoading(false)
    },
  })

  const onSubmit = (data: ResendFormData) => {
    setIsLoading(true)
    resendVerificationMutation.mutate({ email: data.email })
  }

  return (
    <AuthLayout>
      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='text-center text-2xl leading-9 font-bold tracking-tight text-gray-900'>
          {t('title')}
        </h2>
        <p className='mt-2 text-center text-sm text-gray-600'>{t('description')}</p>
        <div className='mb-6 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100'>
            <svg
              className='h-8 w-8 text-orange-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
              />
            </svg>
          </div>
          <p className='text-sm text-gray-600'>{t('subtitle')}</p>
        </div>

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

          <PrimaryButton type='submit' isLoading={isLoading}>
            {t('submitButton')}
          </PrimaryButton>
        </form>

        <div className='mt-6 text-center'>
          <p className='text-sm text-gray-600'>
            {t('backToLogin.text')}{' '}
            <Link
              href={`/${locale}/auth/login`}
              className='font-semibold text-blue-600 hover:text-blue-700'
            >
              {t('backToLogin.link')}
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
