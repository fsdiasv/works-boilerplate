'use client'

import { forwardRef, useEffect, useState } from 'react'
import type React from 'react'

import { cn } from '@/lib/utils'
import type { BeforeInstallPromptEvent } from '@/lib/pwa'

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
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

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
        setDeferredPrompt(e as BeforeInstallPromptEvent)
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

      await deferredPrompt.prompt()
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
          // Mobile-first base styles
          'relative min-h-screen w-full',
          // Responsive layout adjustments
          'flex flex-col',
          // Full screen mode
          fullScreen && 'fixed inset-0',
          // Safe area padding
          getSafeAreaClass(),
          // Standalone mode specific styles
          isStandalone && 'standalone-mode',
          // Ensure proper touch scrolling on mobile
          'overflow-x-hidden overflow-y-auto',
          '-webkit-overflow-scrolling-touch',
          className
        )}
        {...props}
      >
        {children}

        {/* Install prompt for PWA - Mobile-first responsive design */}
        {showInstallPrompt && deferredPrompt && !isPWAInstalled && (
          <div className='animate-slide-up fixed right-4 bottom-20 left-4 z-50 mx-auto w-full max-w-sm md:right-8 md:bottom-8 md:left-auto md:w-96'>
            <div className='bg-background rounded-lg border p-4 shadow-lg md:p-6'>
              <h3 className='mb-2 text-base font-semibold md:text-lg'>Install App</h3>
              <p className='text-muted-foreground mb-3 text-sm md:mb-4'>
                Install this app on your device for a better experience
              </p>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <button
                  onClick={handleInstallClick}
                  className='bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-3 text-sm font-medium transition-colors active:scale-95 sm:flex-1 sm:py-2 min-h-[44px] touch-manipulation'
                  aria-label="Install the app"
                >
                  Install
                </button>
                <button
                  onClick={() => setDeferredPrompt(null)}
                  className='hover:bg-muted w-full rounded-md border px-4 py-3 text-sm font-medium transition-colors active:scale-95 sm:w-auto sm:py-2 min-h-[44px] touch-manipulation'
                  aria-label="Dismiss install prompt"
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
 * Viewport meta tag manager for PWA with mobile-first defaults
 */
export function useViewportMeta(options: {
  width?: string
  height?: string
  initialScale?: number
  minimumScale?: number
  maximumScale?: number
  userScalable?: boolean
  viewportFit?: 'auto' | 'contain' | 'cover'
} = {}) {
  useEffect(() => {
    let viewport = document.querySelector('meta[name="viewport"]')
    
    // Create viewport meta tag if it doesn't exist
    if (!viewport) {
      viewport = document.createElement('meta')
      viewport.setAttribute('name', 'viewport')
      document.head.appendChild(viewport)
    }

    // Mobile-first viewport settings with sensible defaults
    const content = [
      options.width ? `width=${options.width}` : 'width=device-width',
      options.height ? `height=${options.height}` : null,
      options.initialScale !== undefined ? `initial-scale=${options.initialScale}` : 'initial-scale=1',
      options.minimumScale !== undefined ? `minimum-scale=${options.minimumScale}` : 'minimum-scale=1',
      options.maximumScale !== undefined ? `maximum-scale=${options.maximumScale}` : 'maximum-scale=5',
      options.userScalable !== undefined
        ? `user-scalable=${options.userScalable ? 'yes' : 'no'}`
        : 'user-scalable=yes', // Allow zooming by default for accessibility
      options.viewportFit ? `viewport-fit=${options.viewportFit}` : 'viewport-fit=cover',
      // Add shrink-to-fit=no for iOS 9+ compatibility
      'shrink-to-fit=no',
    ]
      .filter(Boolean)
      .join(', ')

    viewport.setAttribute('content', content)
    
    // Return cleanup function to restore original viewport if component unmounts
    return () => {
      // Only reset to default if we created the viewport tag
      if (viewport && viewport.parentNode && !document.querySelector('meta[name="viewport"][data-original]')) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1')
      }
    }
  }, [options.width, options.height, options.initialScale, options.minimumScale, options.maximumScale, options.userScalable, options.viewportFit])
}
