'use client'

import dynamic from 'next/dynamic'
import { forwardRef, useEffect, useRef, useState } from 'react'
import type React from 'react'

import { useDeviceCapabilities } from './ResponsiveUtils'

/**
 * Adaptive component loader that loads components based on device capabilities
 */
interface AdaptiveLoaderProps {
  children?: React.ReactNode
  fallback?: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  loadOn?: 'immediate' | 'interaction' | 'idle' | 'visible'
  threshold?: number
  rootMargin?: string
  loadCondition?: () => boolean
  className?: string
}

export const AdaptiveLoader = forwardRef<HTMLDivElement, AdaptiveLoaderProps>(
  (
    {
      children,
      fallback,
      loadingComponent = <div className='bg-muted h-32 animate-pulse rounded' />,
      loadOn = 'visible',
      threshold = 0.1,
      rootMargin = '50px',
      loadCondition,
      className,
    },
    ref
  ) => {
    const [shouldLoad, setShouldLoad] = useState(loadOn === 'immediate')
    const elementRef = useRef<HTMLDivElement>(null)

    const { networkSpeed, deviceMemory } = useDeviceCapabilities()

    // Check if component should load based on conditions
    useEffect(() => {
      if (loadCondition && !loadCondition()) {
        return undefined
      }

      switch (loadOn) {
        case 'immediate':
          setShouldLoad(true)
          break

        case 'idle':
          if ('requestIdleCallback' in window) {
            const id = requestIdleCallback(() => setShouldLoad(true))
            return () => cancelIdleCallback(id)
          } else {
            // Fallback for browsers without requestIdleCallback
            const timeout = setTimeout(() => setShouldLoad(true), 1)
            return () => clearTimeout(timeout)
          }
          break

        case 'interaction': {
          const handleInteraction = () => {
            setShouldLoad(true)
            cleanup()
          }

          const events = ['click', 'touchstart', 'mouseenter', 'focus']
          const cleanup = () => {
            events.forEach(event => {
              document.removeEventListener(event, handleInteraction)
            })
          }

          events.forEach(event => {
            document.addEventListener(event, handleInteraction, { once: true })
          })

          return cleanup
        }

        case 'visible': {
          if (!elementRef.current) return undefined

          const observer = new IntersectionObserver(
            ([entry]) => {
              if (entry?.isIntersecting === true) {
                setShouldLoad(true)
                observer.disconnect()
              }
            },
            { threshold, rootMargin }
          )

          observer.observe(elementRef.current)
          return () => observer.disconnect()
        }

        default:
          break
      }

      return undefined
    }, [loadOn, loadCondition, threshold, rootMargin])

    // Show fallback for low-end devices or slow networks
    if (networkSpeed === 'slow' || deviceMemory < 4) {
      return fallback != null ? <>{fallback}</> : null
    }

    if (!shouldLoad) {
      return (
        <div ref={ref ?? elementRef} className={className}>
          {loadingComponent}
        </div>
      )
    }

    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    )
  }
)

AdaptiveLoader.displayName = 'AdaptiveLoader'

/**
 * Component for dynamically importing heavy components
 */
interface DynamicComponentProps<P = Record<string, unknown>> {
  loader: () => Promise<{ default: React.ComponentType<P> }>
  props?: P
  fallback?: React.ReactNode
  loadOn?: 'immediate' | 'interaction' | 'idle' | 'visible'
  ssr?: boolean
}

export function DynamicComponent<P extends Record<string, unknown> = Record<string, unknown>>({
  loader,
  props = {} as P,
  fallback = <div className='bg-muted h-32 animate-pulse rounded' />,
  loadOn = 'visible',
  ssr = false,
}: DynamicComponentProps<P>) {
  const Component = dynamic(loader, {
    loading: () => <>{fallback}</>,
    ssr,
  })

  return (
    <AdaptiveLoader loadOn={loadOn} fallback={fallback}>
      <Component {...props} />
    </AdaptiveLoader>
  )
}

/**
 * Progressive enhancement wrapper
 */
interface ProgressiveEnhancementProps {
  basic: React.ReactNode
  enhanced: React.ReactNode
  enhanceOn?: 'immediate' | 'interaction' | 'idle'
  className?: string
}

export function ProgressiveEnhancement({
  basic,
  enhanced,
  enhanceOn = 'idle',
  className,
}: ProgressiveEnhancementProps) {
  const [isEnhanced, setIsEnhanced] = useState(false)
  const { isTouch, networkSpeed } = useDeviceCapabilities()

  useEffect(() => {
    // Don't enhance on slow networks or low-end devices
    if (networkSpeed === 'slow') {
      return undefined
    }

    switch (enhanceOn) {
      case 'immediate':
        setIsEnhanced(true)
        break

      case 'idle': {
        if ('requestIdleCallback' in window) {
          const id = requestIdleCallback(() => setIsEnhanced(true))
          return () => cancelIdleCallback(id)
        } else {
          const timeout = setTimeout(() => setIsEnhanced(true), 1)
          return () => clearTimeout(timeout)
        }
        break
      }

      case 'interaction': {
        const handleInteraction = () => setIsEnhanced(true)
        const event = isTouch ? 'touchstart' : 'mouseenter'

        document.addEventListener(event, handleInteraction, { once: true })
        return () => document.removeEventListener(event, handleInteraction)
      }

      default:
        break
    }

    return undefined
  }, [enhanceOn, networkSpeed, isTouch])

  return <div className={className}>{isEnhanced ? enhanced : basic}</div>
}

/**
 * Resource hint component for preloading/prefetching
 */
interface ResourceHintProps {
  href: string
  as?: 'script' | 'style' | 'image' | 'font' | 'document'
  type?: string
  crossOrigin?: 'anonymous' | 'use-credentials'
  rel?: 'preload' | 'prefetch' | 'preconnect' | 'dns-prefetch'
}

export function ResourceHint({ href, as, type, crossOrigin, rel = 'preload' }: ResourceHintProps) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = rel
    link.href = href

    if (as !== undefined && as.length > 0) link.as = as
    if (type !== undefined && type.length > 0) link.type = type
    if (crossOrigin) link.crossOrigin = crossOrigin

    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [href, as, type, crossOrigin, rel])

  return null
}
