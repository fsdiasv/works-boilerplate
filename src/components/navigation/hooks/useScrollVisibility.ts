import { useEffect, useState, useRef, useCallback } from 'react'

import type { NavigationVisibility, NavigationBehavior } from '../types'

interface UseScrollVisibilityOptions extends NavigationBehavior {
  initialVisible?: boolean
  onVisibilityChange?: (visible: boolean) => void
}

/**
 * Hook to manage component visibility based on scroll behavior
 * Extracted from BottomTabNavigation and SmartHeader components
 */
export function useScrollVisibility(options: UseScrollVisibilityOptions = {}) {
  const {
    hideOnScroll = true,
    scrollThreshold = 10,
    animationDuration = 300,
    initialVisible = true,
    onVisibilityChange,
  } = options

  const [visibility, setVisibility] = useState<NavigationVisibility>({
    isVisible: initialVisible,
    isAnimating: false,
    lastScrollY: 0,
  })

  const animationTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const ticking = useRef(false)

  const updateVisibility = useCallback(
    (currentScrollY: number) => {
      if (!hideOnScroll) return

      const scrollDiff = currentScrollY - visibility.lastScrollY
      const isScrollingDown = scrollDiff > 0
      const hasScrolledEnough = Math.abs(scrollDiff) > scrollThreshold

      if (hasScrolledEnough) {
        const shouldBeVisible = !isScrollingDown || currentScrollY <= 0

        if (shouldBeVisible !== visibility.isVisible) {
          // Clear any existing animation timeout
          if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current)
          }

          setVisibility({
            isVisible: shouldBeVisible,
            isAnimating: true,
            lastScrollY: currentScrollY,
          })

          onVisibilityChange?.(shouldBeVisible)

          // Reset animation state after duration
          animationTimeoutRef.current = setTimeout(() => {
            setVisibility(prev => ({ ...prev, isAnimating: false }))
          }, animationDuration)
        } else {
          setVisibility(prev => ({ ...prev, lastScrollY: currentScrollY }))
        }
      }
    },
    [
      hideOnScroll,
      scrollThreshold,
      visibility.lastScrollY,
      visibility.isVisible,
      animationDuration,
      onVisibilityChange,
    ]
  )

  const handleScroll = useCallback(() => {
    if (!ticking.current) {
      window.requestAnimationFrame(() => {
        updateVisibility(window.scrollY)
        ticking.current = false
      })
      ticking.current = true
    }
  }, [updateVisibility])

  useEffect(() => {
    if (!hideOnScroll) return

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
    }
  }, [hideOnScroll, handleScroll])

  const show = useCallback(() => {
    setVisibility(prev => ({ ...prev, isVisible: true }))
    onVisibilityChange?.(true)
  }, [onVisibilityChange])

  const hide = useCallback(() => {
    setVisibility(prev => ({ ...prev, isVisible: false }))
    onVisibilityChange?.(false)
  }, [onVisibilityChange])

  return {
    isVisible: visibility.isVisible,
    isAnimating: visibility.isAnimating,
    show,
    hide,
  }
}
