'use client'

import { forwardRef, useEffect, useState } from 'react'
import type React from 'react'

import { cn } from '@/lib/utils'

interface PWALayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  safeArea?: boolean | 'all' | 'top' | 'bottom' | 'horizontal'
  fullScreen?: boolean
  preventPullToRefresh?: boolean
  showInstallPrompt?: boolean
  navigationBarColor?: string
  statusBarColor?: string
}

/**
 * PWA-optimized layout component with safe area handling and standalone mode support
 */
export const PWALayout = forwardRef<HTMLDivElement, PWALayoutProps>(
  (
    {
      children,
      className,
      safeArea = true,
      fullScreen = false,
      preventPullToRefresh = true,
      showInstallPrompt = true,
      navigationBarColor,
      ...props
    },
    ref
  ) => {
    const [isStandalone, setIsStandalone] = useState(false)
    const [isPWAInstalled, setIsPWAInstalled] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
      // Check if running in standalone mode
      const checkStandalone = () => {
        const standalone = window.matchMedia('(display-mode: standalone)').matches
        setIsStandalone(standalone)
        setIsPWAInstalled(standalone || (window.navigator as any).standalone === true)
      }

      checkStandalone()

      // Listen for display mode changes
      const mediaQuery = window.matchMedia('(display-mode: standalone)')
      mediaQuery.addEventListener('change', checkStandalone)

      return () => mediaQuery.removeEventListener('change', checkStandalone)
    }, [])

    useEffect(() => {
      // Prevent pull-to-refresh on mobile
      if (!preventPullToRefresh) {
        return undefined
      }

      let touchStartY = 0

      const preventPull = (e: TouchEvent) => {
        if (e.touches && e.touches.length > 0 && e.touches[0]) {
          const touchY = e.touches[0].clientY
          const touchDiff = touchY - touchStartY

          if (window.scrollY === 0 && touchDiff > 0 && e.cancelable) {
            e.preventDefault()
          }
        }
      }

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches && e.touches.length > 0 && e.touches[0]) {
          touchStartY = e.touches[0].clientY
        }
      }

      document.addEventListener('touchstart', handleTouchStart, { passive: false })
      document.addEventListener('touchmove', preventPull, { passive: false })

      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchmove', preventPull)
      }
    }, [preventPullToRefresh])

    useEffect(() => {
      // Listen for install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e)
      }

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }, [])

    useEffect(() => {
      // Set theme colors for PWA
      if (navigationBarColor) {
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) {
          meta.setAttribute('content', navigationBarColor)
        }
      }
    }, [navigationBarColor])

    const handleInstallClick = async () => {
      if (!deferredPrompt) return

      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }

    const getSafeAreaClass = () => {
      if (!safeArea) return ''

      const safeAreaClasses = {
        all: 'p-safe-top p-safe-bottom p-safe-left p-safe-right',
        top: 'pt-safe-top',
        bottom: 'pb-safe-bottom',
        horizontal: 'px-safe-left px-safe-right',
      }

      return typeof safeArea === 'boolean' ? safeAreaClasses.all : safeAreaClasses[safeArea]
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          // Full screen mode
          fullScreen && 'fixed inset-0',
          // Safe area padding
          getSafeAreaClass(),
          // Standalone mode specific styles
          isStandalone && 'standalone-mode',
          className
        )}
        {...props}
      >
        {children}

        {/* Install prompt for PWA */}
        {showInstallPrompt && deferredPrompt && !isPWAInstalled && (
          <div className='animate-slide-up fixed right-4 bottom-20 left-4 z-50 mx-auto max-w-sm'>
            <div className='bg-background rounded-lg border p-4 shadow-lg'>
              <h3 className='mb-2 font-semibold'>Install App</h3>
              <p className='text-muted-foreground mb-3 text-sm'>
                Install this app on your device for a better experience
              </p>
              <div className='flex gap-2'>
                <button
                  onClick={handleInstallClick}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-md px-4 py-2 text-sm font-medium'
                >
                  Install
                </button>
                <button
                  onClick={() => setDeferredPrompt(null)}
                  className='hover:bg-muted rounded-md border px-4 py-2 text-sm font-medium'
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
)

PWALayout.displayName = 'PWALayout'

/**
 * Hook for PWA features detection
 */
export function usePWAFeatures() {
  const [features, setFeatures] = useState({
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
    isIOS: false,
    isAndroid: false,
    hasNotificationSupport: false,
    hasShareSupport: false,
  })

  useEffect(() => {
    const checkFeatures = async () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isAndroid = /Android/.test(navigator.userAgent)
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true

      const hasNotificationSupport = 'Notification' in window
      const hasShareSupport = 'share' in navigator

      setFeatures({
        isInstalled: isStandalone,
        isStandalone,
        canInstall: !isStandalone,
        isIOS,
        isAndroid,
        hasNotificationSupport,
        hasShareSupport,
      })
    }

    checkFeatures()
  }, [])

  return features
}

/**
 * Safe area inset component
 */
interface SafeAreaInsetProps {
  position: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const SafeAreaInset: React.FC<SafeAreaInsetProps> = ({ position, className }) => {
  const insetClasses = {
    top: 'h-safe-top',
    bottom: 'h-safe-bottom',
    left: 'w-safe-left',
    right: 'w-safe-right',
  }

  return <div className={cn(insetClasses[position], className)} aria-hidden='true' />
}

/**
 * Viewport meta tag manager for PWA
 */
export function useViewportMeta(options: {
  width?: string
  height?: string
  initialScale?: number
  minimumScale?: number
  maximumScale?: number
  userScalable?: boolean
  viewportFit?: 'auto' | 'contain' | 'cover'
}) {
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (!viewport) return

    const content = [
      options.width ? `width=${options.width}` : 'width=device-width',
      options.height ? `height=${options.height}` : null,
      options.initialScale ? `initial-scale=${options.initialScale}` : 'initial-scale=1',
      options.minimumScale ? `minimum-scale=${options.minimumScale}` : null,
      options.maximumScale ? `maximum-scale=${options.maximumScale}` : null,
      options.userScalable !== undefined
        ? `user-scalable=${options.userScalable ? 'yes' : 'no'}`
        : null,
      options.viewportFit ? `viewport-fit=${options.viewportFit}` : 'viewport-fit=cover',
    ]
      .filter(Boolean)
      .join(', ')

    viewport.setAttribute('content', content)
  }, [options])
}
