'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/lib/utils'

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
}

const PrimaryButton = forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  ({ className, children, isLoading, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white sm:px-4 sm:py-3 sm:text-base',
          'hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200',
          'min-h-[44px]', // Ensure 44px minimum touch target
          className
        )}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading === true ? (
          <span className='flex items-center justify-center'>
            <svg
              className='mr-3 -ml-1 h-5 w-5 animate-spin text-white'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

PrimaryButton.displayName = 'PrimaryButton'

export { PrimaryButton }
