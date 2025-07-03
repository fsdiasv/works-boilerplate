'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { AuthLayout } from '@/components/auth/auth-layout'
import { FormInput } from '@/components/ui/form-input'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator'
import { PrimaryButton } from '@/components/ui/primary-button'
import { SocialLoginButton } from '@/components/ui/social-login-button'
import { WorkspaceSlugInput } from '@/components/ui/workspace-slug-input'
import { api } from '@/trpc/react'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  workspaceName: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name is too long'),
  workspaceSlug: z
    .string()
    .min(3, 'Workspace URL must be at least 3 characters')
    .max(50, 'Workspace URL is too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignUpPage() {
  const t = useTranslations('auth.signupPage')
  const tWorkspace = useTranslations('workspace')
  const locale = useLocale()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSlugValid, setIsSlugValid] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const passwordValue = watch('password', '')
  const workspaceNameValue = watch('workspaceName', '')

  const signUpMutation = api.auth.signUp.useMutation({
    onSuccess: () => {
      toast.success(t('verificationEmailSent'))
      // Redirect to a page that tells the user to check their email
      router.push(`/${locale}/auth/check-email`)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    if (!isSlugValid) {
      toast.error(tWorkspace('slug.unavailable'))
      return
    }

    setIsLoading(true)
    try {
      await signUpMutation.mutateAsync({
        email: data.email,
        password: data.password,
        fullName: data.name,
        locale,
        workspaceName: data.workspaceName,
        workspaceSlug: data.workspaceSlug,
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
            autoComplete='email'
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

          <hr className='border-slate-200' />

          <div className='space-y-4'>
            <h3 className='text-lg font-semibold text-slate-800'>{tWorkspace('createFirst')}</h3>

            <FormInput
              id='workspace-name'
              label={tWorkspace('form.name')}
              placeholder={tWorkspace('form.namePlaceholder')}
              {...(errors.workspaceName && { error: errors.workspaceName.message })}
              {...register('workspaceName')}
            />

            <WorkspaceSlugInput
              workspaceName={workspaceNameValue}
              onChange={slug => setValue('workspaceSlug', slug)}
              onValidityChange={setIsSlugValid}
              error={errors.workspaceSlug?.message}
              isPublic={true}
            />
          </div>

          <PrimaryButton
            type='submit'
            isLoading={isLoading || signUpMutation.isPending}
            disabled={!isSlugValid}
          >
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
