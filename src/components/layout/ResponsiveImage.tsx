'use client'

import Image from 'next/image'
import { forwardRef, useEffect, useRef, useState } from 'react'
import type React from 'react'

import { cn } from '@/lib/utils'

import { useDeviceCapabilities, useViewport } from './ResponsiveUtils'

interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  quality?: number | { default: number; mobile?: number; tablet?: number; desktop?: number }
  sizes?: string
  className?: string
  containerClassName?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | number
  loading?: 'lazy' | 'eager' | 'adaptive'
  placeholder?: 'blur' | 'empty' | 'skeleton'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
  fallback?: React.ReactNode
  preload?: boolean
  formats?: string[]
  srcSet?: {
    mobile?: string
    tablet?: string
    desktop?: string
  }
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]',
}

export const ResponsiveImage = forwardRef<HTMLDivElement, ResponsiveImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      fill = false,
      priority = false,
      quality = 85,
      sizes,
      className,
      containerClassName,
      aspectRatio,
      loading = 'adaptive',
      placeholder = 'skeleton',
      blurDataURL,
      onLoad,
      onError,
      fallback,
      preload = false,
      formats = ['webp', 'avif'],
      srcSet,
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [isIntersecting, setIsIntersecting] = useState(false)
    const imageRef = useRef<HTMLDivElement>(null)

    const { isMobile, isTablet } = useViewport()
    const { networkSpeed, isTouch } = useDeviceCapabilities()

    // Adaptive quality based on device and network
    const getQuality = () => {
      if (typeof quality === 'number') return quality

      if (isMobile) return quality.mobile || quality.default
      if (isTablet) return quality.tablet || quality.default
      return quality.desktop || quality.default
    }

    // Adaptive loading strategy
    const getLoadingStrategy = () => {
      if (loading !== 'adaptive') return loading

      // High priority images always eager
      if (priority) return 'eager'

      // Slow network = lazy load everything
      if (networkSpeed === 'slow') return 'lazy'

      // Mobile = lazy load non-critical images
      if (isMobile) return 'lazy'

      return 'lazy'
    }

    // Responsive sizes if not provided
    const getResponsiveSizes = () => {
      if (sizes) return sizes

      if (fill) {
        return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      }

      return undefined
    }

    // Get responsive source
    const getResponsiveSrc = () => {
      if (!srcSet) return src

      if (isMobile && srcSet.mobile) return srcSet.mobile
      if (isTablet && srcSet.tablet) return srcSet.tablet
      if (srcSet.desktop) return srcSet.desktop

      return src
    }

    // Intersection observer for lazy loading
    useEffect(() => {
      if (getLoadingStrategy() !== 'lazy' || !imageRef.current) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setIsIntersecting(true)
            observer.disconnect()
          }
        },
        {
          rootMargin: '50px',
          threshold: 0.01,
        }
      )

      observer.observe(imageRef.current)
      return () => observer.disconnect()
    }, [])

    // Preload critical images
    useEffect(() => {
      if (!preload || typeof window === 'undefined') return

      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = getResponsiveSrc()

      // Add format hints
      if (formats.includes('webp')) {
        link.type = 'image/webp'
      } else if (formats.includes('avif')) {
        link.type = 'image/avif'
      }

      document.head.appendChild(link)

      return () => {
        document.head.removeChild(link)
      }
    }, [preload, src])

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

    const shouldRenderImage = getLoadingStrategy() === 'eager' || isIntersecting || priority

    return (
      <div
        ref={ref || imageRef}
        className={cn(
          'relative overflow-hidden',
          // Aspect ratio support
          aspectRatio != null && typeof aspectRatio === 'string' && aspectRatioClasses[aspectRatio],
          // Layout shift prevention
          !fill && width && height && 'bg-transparent',
          containerClassName
        )}
        style={
          aspectRatio != null && typeof aspectRatio === 'number'
            ? { aspectRatio: aspectRatio.toString() }
            : !fill && width && height
              ? { aspectRatio: `${width}/${height}` }
              : undefined
        }
      >
        {shouldRenderImage && (
          <Image
            src={getResponsiveSrc()}
            alt={alt}
            {...(!fill && width != null && height != null ? { width, height } : { fill: true })}
            priority={priority}
            quality={getQuality()}
            sizes={getResponsiveSizes()}
            loading={getLoadingStrategy()}
            placeholder={placeholder === 'blur' && blurDataURL ? 'blur' : 'empty'}
            {...(blurDataURL != null && blurDataURL.length > 0 ? { blurDataURL } : {})}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              hasError && 'opacity-50',
              className
            )}
          />
        )}

        {/* Loading skeleton */}
        {isLoading && placeholder === 'skeleton' && (
          <div className='bg-muted absolute inset-0 animate-pulse' />
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

ResponsiveImage.displayName = 'ResponsiveImage'

/**
 * Picture component for art-directed responsive images
 */
interface PictureProps extends Omit<ResponsiveImageProps, 'srcSet'> {
  sources: Array<{
    srcSet: string
    media?: string
    type?: string
  }>
}

export const Picture = forwardRef<HTMLDivElement, PictureProps>(
  ({ sources, src, alt, className, containerClassName, ...props }, ref) => {
    return (
      <div ref={ref} className={containerClassName}>
        <picture>
          {sources.map((source, index) => (
            <source key={index} srcSet={source.srcSet} media={source.media} type={source.type} />
          ))}
          <ResponsiveImage src={src} alt={alt} {...(className && { className })} {...props} />
        </picture>
      </div>
    )
  }
)

Picture.displayName = 'Picture'
