'use client'

import { motion, useAnimation, PanInfo } from 'framer-motion'
import React, { useState, useRef, useCallback, useEffect, Children } from 'react'

import { cn } from '@/lib/utils'

interface SwipeNavigationProps {
  children: React.ReactNode[]
  defaultIndex?: number
  onIndexChange?: (index: number) => void
  threshold?: number
  indicators?: boolean
  indicatorClassName?: string
  className?: string
  disabled?: boolean
}

export function SwipeNavigation({
  children,
  defaultIndex = 0,
  onIndexChange,
  threshold = 50,
  indicators = true,
  indicatorClassName,
  className,
  disabled = false,
}: SwipeNavigationProps) {
  const [currentIndex, setCurrentIndex] = useState(defaultIndex)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const controls = useAnimation()

  const childrenArray = Children.toArray(children)
  const totalPages = childrenArray.length

  const navigateToIndex = useCallback(
    (index: number, animated = true) => {
      if (index < 0 || index >= totalPages) return

      setCurrentIndex(index)
      onIndexChange?.(index)

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(5)
      }

      controls.start({
        x: `${-index * 100}%`,
        transition: animated ? { type: 'spring', stiffness: 300, damping: 30 } : { duration: 0 },
      })
    },
    [totalPages, onIndexChange, controls]
  )

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      setIsDragging(false)

      if (disabled) {
        navigateToIndex(currentIndex)
        return
      }

      const velocity = info.velocity.x
      const offset = info.offset.x

      // Determine swipe direction based on velocity and offset
      let newIndex = currentIndex

      if (Math.abs(velocity) > 500) {
        // Fast swipe
        newIndex = velocity > 0 ? currentIndex - 1 : currentIndex + 1
      } else if (Math.abs(offset) > threshold) {
        // Slow swipe past threshold
        newIndex = offset > 0 ? currentIndex - 1 : currentIndex + 1
      }

      // Clamp to valid range
      newIndex = Math.max(0, Math.min(totalPages - 1, newIndex))
      navigateToIndex(newIndex)
    },
    [currentIndex, disabled, threshold, totalPages, navigateToIndex]
  )

  const handleDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      switch (e.key) {
        case 'ArrowLeft':
          navigateToIndex(currentIndex - 1)
          break
        case 'ArrowRight':
          navigateToIndex(currentIndex + 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, disabled, navigateToIndex])

  // Update on defaultIndex change
  useEffect(() => {
    navigateToIndex(defaultIndex, false)
  }, [defaultIndex, navigateToIndex])

  return (
    <div ref={containerRef} className={cn('relative h-full overflow-hidden', className)}>
      {/* Swipeable container */}
      <motion.div
        className='flex h-full'
        drag={!disabled && totalPages > 1 ? 'x' : false}
        dragConstraints={containerRef}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ width: `${totalPages * 100}%` }}
      >
        {childrenArray.map((child, index) => (
          <div
            key={index}
            className='relative h-full flex-shrink-0'
            style={{ width: `${100 / totalPages}%` }}
          >
            {child}
          </div>
        ))}
      </motion.div>

      {/* Page indicators */}
      {indicators && totalPages > 1 && (
        <div className='absolute right-0 bottom-4 left-0 flex justify-center gap-2'>
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => navigateToIndex(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                'min-h-[8px] min-w-[8px]', // Ensure minimum touch target
                index === currentIndex ? 'bg-primary w-8' : 'bg-muted-foreground/30 w-2',
                indicatorClassName
              )}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
