import { useEffect, useState, useMemo } from 'react'

import type { SafeAreaInsets } from '../types'

interface UseSafeAreaInsetsOptions {
  fallbackInsets?: Partial<SafeAreaInsets>
  unit?: 'px' | 'rem'
  includePadding?: boolean
}

/**
 * Hook to get PWA safe area insets with proper fallbacks
 * Handles CSS env() variables for iOS and other PWA environments
 */
export function useSafeAreaInsets(options: UseSafeAreaInsetsOptions = {}) {
  const { fallbackInsets = {}, unit = 'px', includePadding = true } = options

  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: fallbackInsets.top ?? 0,
    right: fallbackInsets.right ?? 0,
    bottom: fallbackInsets.bottom ?? 0,
    left: fallbackInsets.left ?? 0,
  })

  useEffect(() => {
    const computeInsets = () => {
      const computedStyle = window.getComputedStyle(document.documentElement)

      const getInsetValue = (property: string, fallback: number = 0): number => {
        const value = computedStyle.getPropertyValue(property)
        if (!value || value === 'none' || value === '0px') return fallback

        const numericValue = parseFloat(value)
        return isNaN(numericValue) ? fallback : numericValue
      }

      setInsets({
        top: getInsetValue('--sat', fallbackInsets.top ?? 0),
        right: getInsetValue('--sar', fallbackInsets.right ?? 0),
        bottom: getInsetValue('--sab', fallbackInsets.bottom ?? 0),
        left: getInsetValue('--sal', fallbackInsets.left ?? 0),
      })
    }

    // Compute initial values
    computeInsets()

    // Re-compute on orientation change (important for mobile devices)
    window.addEventListener('orientationchange', computeInsets)
    window.addEventListener('resize', computeInsets)

    return () => {
      window.removeEventListener('orientationchange', computeInsets)
      window.removeEventListener('resize', computeInsets)
    }
  }, [fallbackInsets])

  // Convert to CSS values with proper units
  const cssInsets = useMemo(() => {
    const convertValue = (value: number) => {
      if (unit === 'rem') {
        // Assuming 16px base font size
        return `${value / 16}rem`
      }
      return `${value}px`
    }

    return {
      top: convertValue(insets.top),
      right: convertValue(insets.right),
      bottom: convertValue(insets.bottom),
      left: convertValue(insets.left),
    }
  }, [insets, unit])

  // Generate padding classes for Tailwind
  const paddingClasses = useMemo(() => {
    if (!includePadding) return {}

    return {
      top: insets.top > 0 ? `pt-[${cssInsets.top}]` : '',
      right: insets.right > 0 ? `pr-[${cssInsets.right}]` : '',
      bottom: insets.bottom > 0 ? `pb-[${cssInsets.bottom}]` : '',
      left: insets.left > 0 ? `pl-[${cssInsets.left}]` : '',
      all: [
        insets.top > 0 ? `pt-[${cssInsets.top}]` : '',
        insets.right > 0 ? `pr-[${cssInsets.right}]` : '',
        insets.bottom > 0 ? `pb-[${cssInsets.bottom}]` : '',
        insets.left > 0 ? `pl-[${cssInsets.left}]` : '',
      ]
        .filter(Boolean)
        .join(' '),
    }
  }, [insets, cssInsets, includePadding])

  // CSS custom properties style object
  const style = useMemo(
    () => ({
      '--safe-area-inset-top': cssInsets.top,
      '--safe-area-inset-right': cssInsets.right,
      '--safe-area-inset-bottom': cssInsets.bottom,
      '--safe-area-inset-left': cssInsets.left,
    }),
    [cssInsets]
  )

  return {
    insets,
    cssInsets,
    paddingClasses,
    style,
    hasInsets: insets.top > 0 || insets.right > 0 || insets.bottom > 0 || insets.left > 0,
  }
}
