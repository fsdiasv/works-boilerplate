'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

export interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className='w-full'>
        {label != null && label !== '' && (
          <label htmlFor={id} className='mb-1 block text-sm font-medium text-slate-800'>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-md border border-slate-300 px-3 py-2 text-sm',
            'placeholder:text-slate-500',
            'focus:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error != null &&
              error !== '' &&
              'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error != null && error !== ''}
          aria-describedby={error != null && error !== '' ? `${id}-error` : undefined}
          {...props}
        />
        {error != null && error !== '' && (
          <p id={`${id}-error`} className='mt-1 text-sm text-red-600'>
            {error}
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export { FormInput }
