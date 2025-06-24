'use client'

import Image from 'next/image'
import { forwardRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  className?: string
  containerClassName?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number
  loading?: 'lazy' | 'eager'
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  fallback?: React.ReactNode
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-3/4',
  landscape: 'aspect-4/3',
}

export const OptimizedImage = forwardRef<HTMLDivElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      fill = false,
      priority = false,
      quality = 85,
      sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
      className,
      containerClassName,
      aspectRatio,
      loading = 'lazy',
      placeholder = 'empty',
      blurDataURL,
      onLoad,
      onError,
      fallback,
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = () => {
      setIsLoading(false)
      onLoad?.()
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
      onError?.()
    }

    if (hasError && fallback != null) {
      return <>{fallback}</>
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden',
          // Aspect ratio support
          aspectRatio != null && typeof aspectRatio === 'string' && aspectRatioClasses[aspectRatio],
          aspectRatio != null && typeof aspectRatio === 'number' && `aspect-[${aspectRatio}]`,
          // Loading state
          isLoading && 'bg-muted animate-pulse',
          containerClassName
        )}
      >
        <Image
          src={src}
          alt={alt}
          {...(!fill && width != null && height != null ? { width, height } : { fill: true })}
          priority={priority}
          quality={quality}
          sizes={sizes}
          loading={loading}
          placeholder={placeholder}
          {...(blurDataURL != null && blurDataURL.length > 0 ? { blurDataURL } : {})}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            hasError && 'opacity-50',
            className
          )}
        />
        {/* Loading skeleton */}
        {isLoading && (
          <div className='bg-muted absolute inset-0 flex items-center justify-center'>
            <div className='border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent' />
          </div>
        )}
        {/* Error state */}
        {hasError && fallback == null && (
          <div className='bg-muted text-muted-foreground absolute inset-0 flex items-center justify-center'>
            <svg
              className='h-8 w-8'
              fill='none'
              strokeWidth={1.5}
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z'
              />
            </svg>
          </div>
        )}
      </div>
    )
  }
)

OptimizedImage.displayName = 'OptimizedImage'

// Avatar image component with fallback
interface AvatarImageProps extends Omit<OptimizedImageProps, 'aspectRatio' | 'fallback'> {
  initials?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const avatarSizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
}

export const AvatarImage = forwardRef<HTMLDivElement, AvatarImageProps>(
  ({ initials, size = 'md', className, ...props }, ref) => {
    const fallback = initials != null && initials.length > 0 && (
      <div
        className={cn(
          'bg-muted text-muted-foreground flex items-center justify-center rounded-full font-semibold',
          avatarSizes[size]
        )}
      >
        {initials}
      </div>
    )

    return (
      <OptimizedImage
        ref={ref}
        aspectRatio='square'
        className={cn('rounded-full', className)}
        containerClassName={cn('rounded-full', avatarSizes[size])}
        fallback={fallback}
        {...props}
      />
    )
  }
)

AvatarImage.displayName = 'AvatarImage'
