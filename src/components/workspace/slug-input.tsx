'use client'

import { Check, X, Loader2 } from 'lucide-react'
import { useState, useEffect, forwardRef } from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { api } from '@/trpc/react'

interface SlugInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  workspaceId: string
  currentSlug: string
  onAvailabilityCheck: (checking: boolean) => void
}

export const SlugInput = forwardRef<HTMLInputElement, SlugInputProps>(
  ({ workspaceId, currentSlug, onAvailabilityCheck, className, ...props }, ref) => {
    const [isChecking, setIsChecking] = useState(false)
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null)

    const checkSlugAvailability = api.workspace.checkSlugAvailability.useMutation()

    const debouncedCheck = useDebouncedCallback(async (slug: string) => {
      if (!slug || slug === currentSlug) {
        setIsAvailable(null)
        setIsChecking(false)
        onAvailabilityCheck(false)
        return
      }

      setIsChecking(true)
      onAvailabilityCheck(true)

      try {
        const { available } = await checkSlugAvailability.mutateAsync({
          slug,
          workspaceId,
        })
        setIsAvailable(available)
      } catch {
        setIsAvailable(false)
      } finally {
        setIsChecking(false)
        onAvailabilityCheck(false)
      }
    }, 500)

    useEffect(() => {
      if (props.value !== undefined && typeof props.value === 'string' && props.value !== '') {
        void debouncedCheck(props.value)
      }
    }, [props.value, debouncedCheck])

    return (
      <div className='relative'>
        <Input
          ref={ref}
          className={cn(
            'pr-10',
            isAvailable === false && 'border-destructive focus-visible:ring-destructive',
            isAvailable === true && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          {...props}
        />
        <div className='absolute top-1/2 right-3 -translate-y-1/2'>
          {isChecking && <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />}
          {!isChecking && isAvailable === true && <Check className='h-4 w-4 text-green-500' />}
          {!isChecking && isAvailable === false && <X className='text-destructive h-4 w-4' />}
        </div>
      </div>
    )
  }
)

SlugInput.displayName = 'SlugInput'
