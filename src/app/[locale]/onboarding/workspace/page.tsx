'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { FormInput } from '@/components/ui/form-input'
import { PrimaryButton } from '@/components/ui/primary-button'
import { WorkspaceSlugInput } from '@/components/ui/workspace-slug-input'
import { api } from '@/trpc/react'

const createWorkspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name is too long'),
  slug: z
    .string()
    .min(3, 'Workspace URL must be at least 3 characters')
    .max(50, 'Workspace URL is too long')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
})

type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>

export default function OnboardingWorkspacePage() {
  const t = useTranslations('workspace')
  const router = useRouter()
  const locale = useLocale()
  const [isSlugValid, setIsSlugValid] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
  })

  const workspaceNameValue = watch('name', '')

  const createWorkspaceMutation = api.workspace.create.useMutation({
    onSuccess: () => {
      toast.success(t('createSuccess'))
      router.push(`/${locale}/dashboard`)
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    if (!isSlugValid) {
      toast.error(t('slug.unavailable'))
      return
    }

    await createWorkspaceMutation.mutateAsync({
      name: data.name,
      slug: data.slug,
    })
  }

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl'>
            {t('onboarding.title')}
          </h1>
          <p className='mt-2 text-sm text-slate-600'>{t('onboarding.subtitle')}</p>
        </div>

        <div className='rounded-lg bg-white px-6 py-8 shadow sm:px-10'>
          <form onSubmit={e => void handleSubmit(onSubmit)(e)} className='space-y-6'>
            <FormInput
              id='workspace-name'
              label={t('form.name')}
              placeholder={t('form.namePlaceholder')}
              {...(errors.name && { error: errors.name.message })}
              {...register('name')}
            />

            <WorkspaceSlugInput
              workspaceName={workspaceNameValue}
              onChange={slug => setValue('slug', slug)}
              onValidityChange={setIsSlugValid}
              error={errors.slug?.message}
            />

            <PrimaryButton
              type='submit'
              isLoading={createWorkspaceMutation.isPending}
              disabled={!isSlugValid}
              className='w-full'
            >
              {t('form.create')}
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  )
}
