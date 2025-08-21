'use client'

import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { forwardRef, useEffect, useState } from 'react'

import { useDebounce } from '@/hooks/use-debounce'
import { api } from '@/trpc/react'

import { FormInput } from './form-input'

interface WorkspaceSlugInputProps {
  workspaceName: string
  value?: string
  onChange?: (slug: string) => void
  onValidityChange?: (isValid: boolean) => void
  error?: string | undefined
  placeholder?: string
  disabled?: boolean
  isPublic?: boolean
}

export const WorkspaceSlugInput = forwardRef<HTMLInputElement, WorkspaceSlugInputProps>(
  (
    {
      workspaceName,
      value = '',
      onChange,
      onValidityChange,
      error,
      placeholder,
      disabled,
      isPublic = false,
    },
    ref
  ) => {
    const t = useTranslations('workspace.slug')
    const [slug, setSlug] = useState(value)
    const [isGenerating, setIsGenerating] = useState(false)
    const debouncedSlug = useDebounce(slug, 500)

    // Generate slug from workspace name - call both hooks unconditionally
    const generateSlugPublicQuery = api.workspace.generateSlugPublic.useQuery(
      { name: workspaceName },
      {
        enabled: false,
        retry: false,
      }
    )

    const generateSlugPrivateQuery = api.workspace.generateSlug.useQuery(
      { name: workspaceName },
      {
        enabled: false,
        retry: false,
      }
    )

    // Select the appropriate result based on isPublic
    const generateSlugMutation = isPublic ? generateSlugPublicQuery : generateSlugPrivateQuery

    // Check slug availability - call both hooks unconditionally
    const checkSlugPublicQuery = api.workspace.checkSlugPublic.useQuery(
      { slug: debouncedSlug },
      {
        enabled: debouncedSlug.length >= 3 && debouncedSlug.match(/^[a-z0-9-]+$/) !== null,
        retry: false,
      }
    )

    const checkSlugPrivateQuery = api.workspace.checkSlug.useQuery(
      { slug: debouncedSlug },
      {
        enabled: debouncedSlug.length >= 3 && debouncedSlug.match(/^[a-z0-9-]+$/) !== null,
        retry: false,
      }
    )

    // Select the appropriate result based on isPublic
    const checkSlugMutation = isPublic ? checkSlugPublicQuery : checkSlugPrivateQuery

    // Generate slug when workspace name changes
    useEffect(() => {
      if (workspaceName === '' || workspaceName.length < 2 || value !== '') return

      // Create abort controller for cleanup
      const abortController = new AbortController()

      // Delay slug generation to prevent excessive queries
      const timeoutId = setTimeout(() => {
        if (abortController.signal.aborted) return

        setIsGenerating(true)
        void generateSlugMutation
          .refetch()
          .then(result => {
            if (
              !abortController.signal.aborted &&
              result.data?.slug !== undefined &&
              result.data.slug !== ''
            ) {
              setSlug(result.data.slug)
              onChange?.(result.data.slug)
            }
            setIsGenerating(false)
          })
          .catch(() => {
            // Ignore errors from aborted requests
            if (!abortController.signal.aborted) {
              setIsGenerating(false)
            }
          })
      }, 300) // 300ms delay

      // Cleanup function
      return () => {
        clearTimeout(timeoutId)
        abortController.abort()
        setIsGenerating(false)
      }
    }, [workspaceName]) // eslint-disable-line react-hooks/exhaustive-deps

    // Handle manual slug changes
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newSlug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')

      setSlug(newSlug)
      onChange?.(newSlug)
    }

    // Update validity when slug availability changes
    useEffect(() => {
      const isValid =
        debouncedSlug.length >= 3 &&
        debouncedSlug.match(/^[a-z0-9-]+$/) !== null &&
        checkSlugMutation.data?.available === true

      onValidityChange?.(isValid)
    }, [debouncedSlug, checkSlugMutation.data?.available, onValidityChange])

    // Determine status icon
    const getStatusIcon = () => {
      if (isGenerating || checkSlugMutation.isLoading) {
        return <Loader2 className='h-4 w-4 animate-spin text-slate-400' />
      }

      if (debouncedSlug.length < 3) return null

      if (checkSlugMutation.data?.available === false) {
        return <XCircle className='h-4 w-4 text-red-500' />
      }

      if (checkSlugMutation.data?.available === true) {
        return <CheckCircle2 className='h-4 w-4 text-green-500' />
      }

      return null
    }

    // Determine error message
    const getErrorMessage = () => {
      if (error !== undefined && error !== '') return error

      if (debouncedSlug.length > 0 && debouncedSlug.length < 3) {
        return t('minLength')
      }

      if (debouncedSlug.length > 0 && debouncedSlug.match(/^[a-z0-9-]+$/) === null) {
        return t('invalid')
      }

      if (checkSlugMutation.data?.available === false) {
        return t('unavailable')
      }

      return undefined
    }

    return (
      <div className='space-y-2'>
        <FormInput
          ref={ref}
          id='workspace-slug'
          label={t('label')}
          placeholder={placeholder ?? t('placeholder')}
          value={slug}
          onChange={handleSlugChange}
          disabled={disabled === true || isGenerating}
          {...(getErrorMessage() !== undefined && { error: getErrorMessage() })}
          icon={getStatusIcon()}
        />
        <p className='text-xs text-slate-500'>
          {t('hint', { url: `${window.location.origin}/${slug || 'your-workspace'}` })}
        </p>
      </div>
    )
  }
)

WorkspaceSlugInput.displayName = 'WorkspaceSlugInput'
