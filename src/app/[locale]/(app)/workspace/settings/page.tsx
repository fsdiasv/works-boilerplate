'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LogoUploader } from '@/components/workspace/logo-uploader'
import { SlugInput } from '@/components/workspace/slug-input'
import { useWorkspace } from '@/contexts/workspace-context'
import { api } from '@/trpc/react'

const workspaceSettingsSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  logo: z.string().url().optional().nullable(),
})

type WorkspaceSettingsForm = z.infer<typeof workspaceSettingsSchema>

export default function WorkspaceSettingsPage() {
  const t = useTranslations('workspace.settings.general')
  const tCommon = useTranslations('common')
  const { activeWorkspace } = useWorkspace()
  const [isCheckingSlug, setIsCheckingSlug] = useState(false)

  const utils = api.useUtils()

  const updateWorkspace = api.workspace.update.useMutation({
    onSuccess: () => {
      toast.success(t('updateSuccess'))
      void utils.workspace.getActive.invalidate()
    },
    onError: error => {
      toast.error(error.message)
    },
  })

  const checkSlugAvailability = api.workspace.checkSlugAvailability.useMutation()

  const form = useForm<WorkspaceSettingsForm>({
    resolver: zodResolver(workspaceSettingsSchema),
    defaultValues: {
      name: activeWorkspace?.name ?? '',
      slug: activeWorkspace?.slug ?? '',
      logo: activeWorkspace?.logo ?? null,
    },
  })

  const onSubmit = async (data: WorkspaceSettingsForm) => {
    if (!activeWorkspace) return

    // Check slug availability if changed
    if (data.slug !== activeWorkspace.slug) {
      setIsCheckingSlug(true)
      try {
        const { available } = await checkSlugAvailability.mutateAsync({
          slug: data.slug,
          workspaceId: activeWorkspace.id,
        })

        if (!available) {
          form.setError('slug', {
            type: 'manual',
            message: t('slugTaken'),
          })
          setIsCheckingSlug(false)
          return
        }
      } catch {
        setIsCheckingSlug(false)
        return
      }
      setIsCheckingSlug(false)
    }

    updateWorkspace.mutate({
      workspaceId: activeWorkspace.id,
      ...data,
    })
  }

  if (!activeWorkspace) {
    return null
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-lg font-medium'>{t('title')}</h2>
        <p className='text-muted-foreground text-sm'>{t('description')}</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={e => {
            e.preventDefault()
            void form.handleSubmit(onSubmit)(e)
          }}
          className='space-y-6'
        >
          <Card>
            <CardHeader>
              <CardTitle>{t('workspaceInfo')}</CardTitle>
              <CardDescription>{t('workspaceInfoDescription')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>{t('nameDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='slug'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('slug')}</FormLabel>
                    <FormControl>
                      <SlugInput
                        {...field}
                        workspaceId={activeWorkspace.id}
                        currentSlug={activeWorkspace.slug}
                        onAvailabilityCheck={setIsCheckingSlug}
                      />
                    </FormControl>
                    <FormDescription>{t('slugDescription')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('workspaceLogo')}</CardTitle>
              <CardDescription>{t('workspaceLogoDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name='logo'
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LogoUploader
                        value={field.value}
                        onChange={field.onChange}
                        workspaceName={form.watch('name')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className='flex justify-end'>
            <Button type='submit' disabled={updateWorkspace.isPending || isCheckingSlug}>
              {(updateWorkspace.isPending || isCheckingSlug) && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              {tCommon('save')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
