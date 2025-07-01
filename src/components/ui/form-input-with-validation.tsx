'use client'

import { Check, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { forwardRef, InputHTMLAttributes, useState, useEffect } from 'react'

import { useDebouncedValidation } from '@/hooks/use-debounced-validation'
import { cn } from '@/lib/utils'

export interface FormInputWithValidationProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  validator?: (value: string) => string | undefined
  showValidationState?: boolean
  validationDelay?: number
}

const FormInputWithValidation = forwardRef<HTMLInputElement, FormInputWithValidationProps>(
  (
    {
      className,
      label,
      error,
      id,
      validator,
      showValidationState = true,
      validationDelay = 500,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const t = useTranslations('validation')
    const [localValue, setLocalValue] = useState((value as string) || '')
    const { validationError, isValidating } = useDebouncedValidation(localValue, {
      delay: validationDelay,
      ...(validator && { validator }),
    })

    useEffect(() => {
      setLocalValue((value as string) || '')
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value)
      onChange?.(e)
    }

    const displayError = error ?? validationError
    const isValid =
      localValue !== '' && displayError === undefined && !isValidating && validator !== undefined

    return (
      <div className='w-full'>
        {label != null && label !== '' && (
          <label htmlFor={id} className='mb-1 block text-sm font-medium text-slate-800'>
            {label}
          </label>
        )}
        <div className='relative'>
          <input
            ref={ref}
            id={id}
            value={localValue}
            onChange={handleChange}
            className={cn(
              'w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:px-4 sm:py-3 sm:text-base',
              'placeholder:text-slate-500',
              'focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'min-h-[44px]', // Ensure 44px minimum touch target
              'transition-colors duration-200',
              showValidationState === true && validator !== undefined && 'pr-10',
              displayError !== undefined &&
                displayError !== '' &&
                'border-red-500 focus:border-red-500 focus:ring-red-500',
              isValid === true && 'border-green-500 focus:border-green-500 focus:ring-green-500',
              className
            )}
            aria-invalid={displayError != null && displayError !== ''}
            aria-describedby={
              displayError != null && displayError !== '' ? `${id}-error` : undefined
            }
            {...props}
            // Suppress hydration warning for browser extension attributes
            suppressHydrationWarning
          />
          {showValidationState === true &&
            validator !== undefined &&
            !isValidating &&
            localValue !== '' && (
              <div className='absolute top-[50%] right-3 -translate-y-[50%]'>
                {isValid === true ? (
                  <Check className='h-5 w-5 text-green-500' aria-label={t('validInput')} />
                ) : displayError !== undefined && displayError !== '' ? (
                  <AlertCircle className='h-5 w-5 text-red-500' aria-label={t('invalidInput')} />
                ) : null}
              </div>
            )}
        </div>
        {displayError != null && displayError !== '' && (
          <p id={`${id}-error`} className='mt-1 text-sm text-red-600' role='alert'>
            {displayError}
          </p>
        )}
      </div>
    )
  }
)

FormInputWithValidation.displayName = 'FormInputWithValidation'

export { FormInputWithValidation }
