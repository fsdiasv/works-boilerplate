'use client'

import { useEffect, useState } from 'react'
import { Metric, onCLS, onFCP, onLCP, onTTFB } from 'web-vitals'

interface WebVitalsMetrics {
  cls?: number
  fcp?: number
  lcp?: number
  ttfb?: number
}

interface UseWebVitalsOptions {
  enabled?: boolean
  onMetric?: (metric: Metric) => void
}

export function useWebVitals({ enabled = true, onMetric }: UseWebVitalsOptions = {}) {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({})
  const [isReporting, setIsReporting] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const handleMetric = (metric: Metric) => {
      setMetrics(prev => ({
        ...prev,
        [metric.name.toLowerCase()]: metric.value,
      }))

      onMetric?.(metric)

      // Log metrics in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric.rating)
      }
    }

    // Collect Core Web Vitals
    onCLS(handleMetric)
    onFCP(handleMetric)
    onLCP(handleMetric)
    onTTFB(handleMetric)

    setIsReporting(true)

    return () => {
      setIsReporting(false)
    }
  }, [enabled, onMetric])

  // Calculate performance scores based on Google's thresholds
  const getPerformanceScore = () => {
    const scores = {
      cls:
        typeof metrics.cls === 'number' && metrics.cls >= 0
          ? metrics.cls <= 0.1
            ? 'good'
            : metrics.cls <= 0.25
              ? 'needs-improvement'
              : 'poor'
          : 'unknown',
      fcp:
        typeof metrics.fcp === 'number' && metrics.fcp > 0
          ? metrics.fcp <= 1800
            ? 'good'
            : metrics.fcp <= 3000
              ? 'needs-improvement'
              : 'poor'
          : 'unknown',
      lcp:
        typeof metrics.lcp === 'number' && metrics.lcp > 0
          ? metrics.lcp <= 2500
            ? 'good'
            : metrics.lcp <= 4000
              ? 'needs-improvement'
              : 'poor'
          : 'unknown',
      ttfb:
        typeof metrics.ttfb === 'number' && metrics.ttfb > 0
          ? metrics.ttfb <= 800
            ? 'good'
            : metrics.ttfb <= 1800
              ? 'needs-improvement'
              : 'poor'
          : 'unknown',
    }

    const goodCount = Object.values(scores).filter(score => score === 'good').length
    const totalCount = Object.values(scores).filter(score => score !== 'unknown').length

    return {
      scores,
      overall: totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0,
    }
  }

  return {
    metrics,
    isReporting,
    performanceScore: getPerformanceScore(),
  }
}

// Layout shift monitoring hook
export function useLayoutShiftMonitoring(enabled = true) {
  const [layoutShifts, setLayoutShifts] = useState<LayoutShift[]>([])
  const [totalCLS, setTotalCLS] = useState(0)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries() as LayoutShift[]

      entries.forEach(entry => {
        // Only count layout shifts without recent user input
        if (!entry.hadRecentInput) {
          setLayoutShifts(prev => [...prev, entry])
          setTotalCLS(prev => prev + entry.value)
        }
      })
    })

    observer.observe({ type: 'layout-shift', buffered: true })

    return () => {
      observer.disconnect()
    }
  }, [enabled])

  const getShiftsByElement = () => {
    const shiftMap = new Map<string, number>()

    layoutShifts.forEach(shift => {
      if (shift.sources.length > 0) {
        shift.sources.forEach(source => {
          const element = source.node?.nodeName ?? 'Unknown'
          shiftMap.set(element, (shiftMap.get(element) ?? 0) + shift.value)
        })
      }
    })

    return Array.from(shiftMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
  }

  return {
    layoutShifts,
    totalCLS,
    shiftsByElement: getShiftsByElement(),
    hasShifts: layoutShifts.length > 0,
  }
}
