'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect current viewport size
 */
export function useViewport() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet:
      typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
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
      const connection = (navigator as any).connection
      const networkSpeed = connection?.effectiveType === '4g' ? 'fast' : 'slow'

      // Device memory
      const deviceMemory = (navigator as any).deviceMemory || 8

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
    const connection = (navigator as any).connection
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
