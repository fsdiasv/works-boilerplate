'use client'

import { motion } from 'framer-motion'
import { ArrowDown, RefreshCw } from 'lucide-react'
import type React from 'react'

import { usePullToRefresh } from '@/hooks/useGestureNavigation'
import { cn } from 'src/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  threshold?: number
  enabled?: boolean
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  enabled = true,
  className,
}: PullToRefreshProps) {
  const { bind, pullDistance, isRefreshing, canRefresh } = usePullToRefresh({
    onRefresh,
    threshold,
    enabled,
  })

  const progress = Math.min(pullDistance / threshold, 1)
  const indicatorOpacity = Math.min(pullDistance / 40, 1)
  const indicatorScale = Math.min(0.5 + progress * 0.5, 1)

  return (
    <div {...bind()} className={cn('relative overflow-hidden', className)}>
      {/* Pull indicator */}
      <motion.div
        className='absolute inset-x-0 top-0 z-10 flex justify-center'
        style={{
          y: Math.max(0, pullDistance - 60),
          opacity: indicatorOpacity,
        }}
      >
        <div className='bg-background flex h-12 w-12 items-center justify-center rounded-full shadow-lg'>
          {isRefreshing ? (
            <RefreshCw
              className='text-primary h-5 w-5 animate-spin'
              style={{ scale: indicatorScale }}
            />
          ) : (
            <motion.div
              animate={{
                rotate: canRefresh ? 180 : 0,
                scale: indicatorScale,
              }}
              transition={{ duration: 0.2 }}
            >
              <ArrowDown
                className={cn(
                  'h-5 w-5 transition-colors',
                  canRefresh ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        style={{
          y: pullDistance * 0.5,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* Progress indicator */}
      {pullDistance > 0 && (
        <div className='absolute inset-x-0 top-0 z-0'>
          <div
            className='bg-primary h-1 transition-all duration-200'
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
