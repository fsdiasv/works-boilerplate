'use client'

import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import React, { useState, useRef, useCallback, useEffect } from 'react'

import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  threshold?: number
  maxPull?: number
  className?: string
  disabled?: boolean
  refreshIndicatorClassName?: string
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 150,
  className,
  disabled = false,
  refreshIndicatorClassName,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef<number>(0)
  const currentY = useRef<number>(0)

  const controls = useAnimation()
  const indicatorControls = useAnimation()

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return

      const container = containerRef.current
      if (!container) return

      // Only activate if at the top of the scroll
      if (container.scrollTop !== 0) return

      startY.current = e.touches[0]?.clientY || 0
      setIsPulling(true)
    },
    [disabled, isRefreshing]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || disabled || isRefreshing) return

      currentY.current = e.touches[0]?.clientY || 0
      const distance = Math.max(0, currentY.current - startY.current)
      const cappedDistance = Math.min(distance * 0.5, maxPull)

      setPullDistance(cappedDistance)

      // Update container transform
      controls.start({
        y: cappedDistance,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
      })

      // Update indicator rotation
      const rotation = (cappedDistance / threshold) * 180
      indicatorControls.start({
        rotate: rotation,
        scale: cappedDistance >= threshold ? 1.1 : 1,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      })

      // Prevent default to avoid browser pull-to-refresh
      if (cappedDistance > 5) {
        e.preventDefault()
      }
    },
    [isPulling, disabled, isRefreshing, maxPull, threshold, controls, indicatorControls]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled || isRefreshing) return

    setIsPulling(false)

    if (pullDistance >= threshold) {
      // Trigger refresh
      setIsRefreshing(true)

      // Haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(10)
      }

      // Animate to refresh position
      controls.start({
        y: 60,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
      })

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)

        // Animate back to original position
        controls.start({
          y: 0,
          transition: { type: 'spring', stiffness: 400, damping: 30 },
        })

        indicatorControls.start({
          rotate: 0,
          scale: 1,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        })
      }
    } else {
      // Snap back
      setPullDistance(0)
      controls.start({
        y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
      })

      indicatorControls.start({
        rotate: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      })
    }
  }, [
    isPulling,
    disabled,
    isRefreshing,
    pullDistance,
    threshold,
    onRefresh,
    controls,
    indicatorControls,
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  return (
    <div className={cn('relative h-full overflow-hidden', className)}>
      {/* Pull indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing || pullDistance > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: pullDistance > 20 || isRefreshing ? 1 : 0,
              y: 0,
            }}
            exit={{ opacity: 0, y: -20 }}
            className='absolute inset-x-0 top-0 z-50 flex justify-center'
            style={{ height: 60 }}
          >
            <div
              className={cn('flex h-full items-center justify-center', refreshIndicatorClassName)}
            >
              <motion.div
                animate={indicatorControls}
                className={cn(
                  'bg-background rounded-full p-2 shadow-lg',
                  pullDistance >= threshold && !isRefreshing && 'bg-primary text-primary-foreground'
                )}
              >
                <RefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        ref={containerRef}
        animate={controls}
        className='h-full overflow-auto overscroll-none'
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  )
}
