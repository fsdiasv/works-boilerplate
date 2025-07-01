'use client'

import { Eye, EyeOff } from 'lucide-react'
import { forwardRef, useState } from 'react'

import { cn } from '@/lib/utils'

import { FormInput, FormInputProps } from './form-input'

const PasswordInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <div className='relative'>
        <FormInput
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-12', className)}
          {...props}
        />
        <button
          type='button'
          onClick={() => setShowPassword(!showPassword)}
          className='absolute top-[50%] right-0 flex h-[44px] w-[44px] -translate-y-[50%] items-center justify-center rounded-r-md text-slate-500 hover:text-slate-700 focus:text-slate-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none'
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className='h-5 w-5' aria-hidden='true' />
          ) : (
            <Eye className='h-5 w-5' aria-hidden='true' />
          )}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
