'use client'

import { useDrag } from '@use-gesture/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface UseGestureNavigationOptions {
  enabled?: boolean
  threshold?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  enableBackGesture?: boolean
  enableForwardGesture?: boolean
}

export function useGestureNavigation({
  enabled = true,
  threshold = 100,
  onSwipeLeft,
  onSwipeRight,
  enableBackGesture = true,
  enableForwardGesture = false,
}: UseGestureNavigationOptions = {}) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleSwipeLeft = useCallback(() => {
    if (onSwipeLeft) {
      onSwipeLeft()
    } else if (enableForwardGesture) {
      router.forward()
    }
  }, [onSwipeLeft, enableForwardGesture, router])

  const handleSwipeRight = useCallback(() => {
    if (onSwipeRight) {
      onSwipeRight()
    } else if (enableBackGesture) {
      router.back()
    }
  }, [onSwipeRight, enableBackGesture, router])

  const bind = useDrag(
    ({ movement, velocity, direction, cancel, last }) => {
      const [mx] = movement
      const [vx] = velocity
      const [dx] = direction
      if (!enabled) return

      // Prevent navigation if already navigating
      if (isNavigating) {
        cancel()
        return
      }

      // Check for swipe gestures
      if (last && (Math.abs(mx) > threshold || Math.abs(vx) > 0.5)) {
        setIsNavigating(true)

        if (dx > 0 && mx > threshold) {
          // Swipe right
          handleSwipeRight()
        } else if (dx < 0 && mx < -threshold) {
          // Swipe left
          handleSwipeLeft()
        }

        // Reset navigating state after animation
        setTimeout(() => setIsNavigating(false), 300)
      }
    },
    {
      axis: 'x',
      bounds: { left: -200, right: 200 },
      rubberband: true,
    }
  )

  return {
    bind: enabled === true ? bind : () => ({}),
    isNavigating,
  }
}

// Pull to refresh hook
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void
  threshold?: number
  enabled?: boolean
  resistance?: number
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
  resistance = 0.5,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [canRefresh, setCanRefresh] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    setCanRefresh(false)

    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }

    // Haptic feedback
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      void navigator.vibrate(50)
    }
  }, [onRefresh, isRefreshing])

  const bind = useDrag(
    ({ movement, direction, first, last }) => {
      const [, my] = movement
      const [, dy] = direction
      if (!enabled || isRefreshing) return

      // Only trigger on downward swipes from the top
      if (first && window.scrollY > 0) return

      if (dy > 0 && my > 0) {
        const distance = Math.min(my * resistance, threshold * 1.5)
        setPullDistance(distance)
        setCanRefresh(distance >= threshold)
      }

      if (last) {
        if (canRefresh) {
          void handleRefresh()
        } else {
          setPullDistance(0)
          setCanRefresh(false)
        }
      }
    },
    {
      axis: 'y',
      bounds: { top: 0, bottom: threshold * 2 },
      rubberband: true,
    }
  )

  // Reset state when not enabled
  useEffect(() => {
    if (!enabled) {
      setPullDistance(0)
      setCanRefresh(false)
    }
  }, [enabled])

  return {
    bind: enabled === true ? bind : () => ({}),
    pullDistance,
    isRefreshing,
    canRefresh,
  }
}

// Swipe navigation between views
interface UseSwipeNavigationOptions {
  views: string[]
  currentView: string
  onViewChange: (view: string) => void
  enabled?: boolean
  threshold?: number
}

export function useSwipeNavigation({
  views,
  currentView,
  onViewChange,
  enabled = true,
  threshold = 50,
}: UseSwipeNavigationOptions) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const currentIndex = views.indexOf(currentView)

  const bind = useDrag(
    ({ movement, dragging, velocity, direction, last }) => {
      const [mx] = movement
      const [vx] = velocity
      const [dx] = direction
      if (!enabled) return

      setIsDragging(dragging ?? false)

      if (!last) {
        setDragOffset(mx)
        return
      }

      // Determine if we should navigate
      const shouldNavigate = Math.abs(mx) > threshold || Math.abs(vx) > 0.5

      if (shouldNavigate) {
        if (dx > 0 && currentIndex > 0) {
          // Swipe right - go to previous view
          const prevView = views[currentIndex - 1]
          if (prevView != null) onViewChange(prevView)
        } else if (dx < 0 && currentIndex < views.length - 1) {
          // Swipe left - go to next view
          const nextView = views[currentIndex + 1]
          if (nextView != null) onViewChange(nextView)
        }
      }

      // Reset
      setDragOffset(0)
      setIsDragging(false)
    },
    {
      axis: 'x',
      bounds: { left: -200, right: 200 },
      rubberband: true,
    }
  )

  return {
    bind: enabled === true ? bind : () => ({}),
    dragOffset,
    isDragging,
    canGoBack: currentIndex > 0,
    canGoForward: currentIndex < views.length - 1,
  }
}
