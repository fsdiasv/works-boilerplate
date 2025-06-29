'use client'

import type React from 'react'
import { forwardRef, type HTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical' | 'responsive'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive'
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  wrap?: boolean
  reverse?: boolean
  fullWidth?: boolean
  fullHeight?: boolean
  asChild?: boolean
}

const directionClasses = {
  horizontal: 'flex-row',
  vertical: 'flex-col',
  responsive: 'flex-col @sm:flex-row',
}

const gapClasses = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
  responsive: 'gap-4 @sm:gap-6 @lg:gap-8',
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = 'vertical',
      gap = 'md',
      align = 'stretch',
      justify = 'start',
      wrap = false,
      reverse = false,
      fullWidth = false,
      fullHeight = false,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Component = asChild ? Slot : 'div'

    return (
      <Component
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          gapClasses[gap],
          alignClasses[align],
          justifyClasses[justify],
          {
            'flex-wrap': wrap,
            'flex-row-reverse': reverse && direction === 'horizontal',
            'flex-col-reverse': reverse && direction === 'vertical',
            'w-full': fullWidth,
            'h-full': fullHeight,
          },
          className
        )}
        {...props}
      />
    )
  }
)

Stack.displayName = 'Stack'

/**
 * Spacer component for flexible spacing in Stack layouts
 */
interface SpacerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto'
  axis?: 'horizontal' | 'vertical' | 'both'
}

const spacerSizes = {
  xs: 'h-2 w-2',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
  auto: 'flex-1',
}

const spacerAxis = {
  horizontal: 'h-0',
  vertical: 'w-0',
  both: '',
}

export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(
  ({ className, size = 'auto', axis = 'both', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          size === 'auto' ? 'flex-1' : spacerSizes[size],
          axis !== 'both' && spacerAxis[axis],
          className
        )}
        aria-hidden='true'
        {...props}
      />
    )
  }
)

Spacer.displayName = 'Spacer'
