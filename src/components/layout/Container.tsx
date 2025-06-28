'use client'

import type React from 'react'
import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  centerContent?: boolean
  enableQueries?: boolean
}

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-none',
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = 'lg', centerContent = true, enableQueries = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base container styles
          'w-full px-4 sm:px-6 lg:px-8',
          containerSizes[size],
          // Center content
          {
            'mx-auto': centerContent,
          },
          // Container queries support
          {
            'container-queries': enableQueries,
          },
          className
        )}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'
