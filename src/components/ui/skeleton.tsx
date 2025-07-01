import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

interface SkeletonProps extends ComponentProps<'div'> {
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
}

function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'pulse',
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot='skeleton'
      className={cn(
        'bg-slate-200',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' &&
          'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%]',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        className
      )}
      aria-hidden='true'
      {...props}
    />
  )
}

export function SkeletonForm() {
  return (
    <div className='space-y-6'>
      {/* Title skeleton */}
      <div>
        <Skeleton className='mb-2 h-10 w-3/4' variant='text' />
        <Skeleton className='h-4 w-1/2' variant='text' />
      </div>

      {/* Form fields skeleton */}
      <div className='space-y-4'>
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className='mb-2 h-4 w-20' variant='text' />
            <Skeleton className='h-[44px] w-full' />
          </div>
        ))}
      </div>

      {/* Button skeleton */}
      <Skeleton className='h-[44px] w-full' />

      {/* Social buttons skeleton */}
      <div className='grid grid-cols-3 gap-3'>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className='h-[44px]' />
        ))}
      </div>
    </div>
  )
}

export function SkeletonButton() {
  return <Skeleton className='h-[44px] w-full rounded-md' />
}

export function SkeletonInput() {
  return (
    <div>
      <Skeleton className='mb-2 h-4 w-20' variant='text' />
      <Skeleton className='h-[44px] w-full rounded-md' />
    </div>
  )
}

export { Skeleton }
