'use client'

import { useEffect, useState } from 'react'

// TypeScript interfaces for browser APIs
interface NetworkInformation extends EventTarget {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  addEventListener(type: 'change', listener: EventListener): void
  removeEventListener(type: 'change', listener: EventListener): void
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation
  deviceMemory?: number
}

/**
 * Hook to detect current viewport size
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      })
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewport
}

/**
 * Hook to detect device capabilities
 */
export function useDeviceCapabilities() {
  const [capabilities, setCapabilities] = useState({
    isTouch: false,
    isStandalone: false,
    hasReducedMotion: false,
    networkSpeed: 'unknown' as 'slow' | 'fast' | 'unknown',
    deviceMemory: 8,
  })

  useEffect(() => {
    const checkCapabilities = () => {
      // Touch capability
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // PWA standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches

      // Reduced motion preference
      const hasReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Network speed detection
      const navigatorWithConnection = navigator as NavigatorWithConnection
      const connection = navigatorWithConnection.connection
      const networkSpeed = connection?.effectiveType === '4g' ? 'fast' : 'slow'

      // Device memory
      const deviceMemory = navigatorWithConnection.deviceMemory || 8

      setCapabilities({
        isTouch,
        isStandalone,
        hasReducedMotion,
        networkSpeed,
        deviceMemory,
      })
    }

    checkCapabilities()

    // Listen for network changes
    const navigatorWithConnection = navigator as NavigatorWithConnection
    const connection = navigatorWithConnection.connection
    if (connection) {
      connection.addEventListener('change', checkCapabilities)
      return () => connection.removeEventListener('change', checkCapabilities)
    }

    return undefined
  }, [])

  return capabilities
}

/**
 * Hook for viewport-aware values
 */
export function useResponsiveValue<T>(values: {
  base: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}) {
  const { width } = useViewport()

  if (width >= 1536 && values['2xl'] !== undefined) return values['2xl']
  if (width >= 1280 && values.xl !== undefined) return values.xl
  if (width >= 1024 && values.lg !== undefined) return values.lg
  if (width >= 768 && values.md !== undefined) return values.md
  if (width >= 640 && values.sm !== undefined) return values.sm
  return values.base
}

/**
 * Hook for container queries
 */
export function useContainerQuery(ref: React.RefObject<HTMLElement>) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setContainerSize({ width, height })
      }
    })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref])

  return {
    ...containerSize,
    isSmall: containerSize.width < 640,
    isMedium: containerSize.width >= 640 && containerSize.width < 1024,
    isLarge: containerSize.width >= 1024,
  }
}
