'use client'

import type React from 'react'

import { useWebVitals, useLayoutShiftMonitoring } from '@/hooks/useWebVitals'

interface PerformanceMonitorProps {
  enabled?: boolean
  showInDevelopment?: boolean
  children?: React.ReactNode
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  showInDevelopment = true,
  children,
}: PerformanceMonitorProps) {
  const { metrics, performanceScore } = useWebVitals({ enabled })
  const { totalCLS, hasShifts } = useLayoutShiftMonitoring(enabled)

  if (!enabled || (!showInDevelopment && process.env.NODE_ENV === 'development')) {
    return <>{children}</>
  }

  const getScoreColor = (score: string) => {
    return score === 'good'
      ? 'text-green-400'
      : score === 'needs-improvement'
        ? 'text-yellow-400'
        : 'text-red-400'
  }

  return (
    <>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <div className='fixed right-4 bottom-4 z-50 rounded-lg bg-black/90 p-3 text-xs text-white'>
          <div className='font-semibold'>Performance Score: {performanceScore.overall}%</div>
          <div className='mt-1 space-y-1'>
            {metrics.lcp != null && metrics.lcp > 0 && (
              <div className={getScoreColor(performanceScore.scores.lcp)}>
                LCP: {Math.round(metrics.lcp)}ms
              </div>
            )}
            {metrics.cls !== undefined && (
              <div className={getScoreColor(performanceScore.scores.cls)}>
                CLS: {metrics.cls.toFixed(3)}
              </div>
            )}
            {hasShifts && (
              <div className='text-yellow-400'>Layout Shifts: {totalCLS.toFixed(3)}</div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
