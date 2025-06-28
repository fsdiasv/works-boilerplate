'use client'

import { useEffect, useRef, useState } from 'react'
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

import { cn } from '@/lib/utils'

interface WebVitalsMetrics {
  cls: number | null
  fcp: number | null
  inp: number | null
  lcp: number | null
  ttfb: number | null
}

interface WebVitalsProps {
  onReport?: (metrics: WebVitalsMetrics) => void
  showIndicator?: boolean
  className?: string
}

/**
 * Component for monitoring and optimizing Core Web Vitals
 */
export const WebVitals: React.FC<WebVitalsProps> = ({
  onReport,
  showIndicator = process.env.NODE_ENV === 'development',
  className,
}) => {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    cls: null,
    fcp: null,
    inp: null,
    lcp: null,
    ttfb: null,
  })

  useEffect(() => {
    const handleMetric = (metric: Metric) => {
      setMetrics(prev => {
        const newMetrics = {
          ...prev,
          [metric.name.toLowerCase()]: metric.value,
        }
        onReport?.(newMetrics)
        return newMetrics
      })

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${metric.name}:`, metric.value.toFixed(2))
      }
    }

    // Monitor all Core Web Vitals
    onCLS(handleMetric)
    onFCP(handleMetric)
    onINP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)
  }, [onReport])

  if (!showIndicator) return null

  const getMetricStatus = (metric: string, value: number | null) => {
    if (value === null) return 'pending'

    // Thresholds based on Google's Core Web Vitals
    const thresholds = {
      cls: { good: 0.1, needsImprovement: 0.25 },
      fcp: { good: 1800, needsImprovement: 3000 },
      inp: { good: 200, needsImprovement: 500 },
      lcp: { good: 2500, needsImprovement: 4000 },
      ttfb: { good: 800, needsImprovement: 1800 },
    }

    const threshold = thresholds[metric as keyof typeof thresholds]
    if (!threshold) return 'pending'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.needsImprovement) return 'needs-improvement'
    return 'poor'
  }

  const statusColors = {
    good: 'bg-green-500',
    'needs-improvement': 'bg-yellow-500',
    poor: 'bg-red-500',
    pending: 'bg-gray-300',
  }

  return (
    <div
      className={cn(
        'bg-background/90 fixed bottom-4 left-4 z-40 rounded-lg p-3 shadow-lg backdrop-blur',
        'border-border border text-xs',
        className
      )}
    >
      <div className='mb-2 font-semibold'>Core Web Vitals</div>
      <div className='space-y-1'>
        {Object.entries(metrics).map(([key, value]) => {
          const status = getMetricStatus(key, value)
          return (
            <div key={key} className='flex items-center gap-2'>
              <div
                className={cn('h-2 w-2 rounded-full', statusColors[status])}
                aria-label={`${key.toUpperCase()} status: ${status}`}
              />
              <span className='font-mono uppercase'>{key}:</span>
              <span>{value !== null ? `${value.toFixed(2)}` : 'measuring...'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Hook for preventing layout shifts
 */
export function useLayoutShiftPrevention() {
  const elementsRef = useRef<Map<string, DOMRect>>(new Map())

  useEffect(() => {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement && node.dataset.preventShift) {
              const rect = node.getBoundingClientRect()
              elementsRef.current.set(node.dataset.preventShift, rect)

              // Apply dimensions to prevent shift
              node.style.minHeight = `${rect.height}px`
              node.style.minWidth = `${rect.width}px`
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [])

  const preventShift = (elementId: string, dimensions: { width: number; height: number }) => {
    elementsRef.current.set(elementId, {
      width: dimensions.width,
      height: dimensions.height,
      top: 0,
      left: 0,
      right: dimensions.width,
      bottom: dimensions.height,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
  }

  return { preventShift }
}

/**
 * Component wrapper that prevents layout shifts
 */
interface LayoutStableProps {
  children: React.ReactNode
  width?: number | string
  height?: number | string
  aspectRatio?: number
  className?: string
}

export const LayoutStable: React.FC<LayoutStableProps> = ({
  children,
  width,
  height,
  aspectRatio,
  className,
}) => {
  const style: React.CSSProperties = {}

  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height
  if (aspectRatio) style.aspectRatio = aspectRatio.toString()

  return (
    <div className={cn('relative', className)} style={style} data-prevent-shift='true'>
      {children}
    </div>
  )
}

/**
 * Font loading optimization for preventing layout shifts
 */
export function useFontLoadOptimization(fonts: string[]) {
  useEffect(() => {
    if ('fonts' in document) {
      Promise.all(
        fonts.map(font =>
          document.fonts.load(font).catch(err => {
            console.warn(`Failed to preload font: ${font}`, err)
          })
        )
      )
    }
  }, [fonts])
}
