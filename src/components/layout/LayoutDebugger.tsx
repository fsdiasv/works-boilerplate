'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

import { useViewport } from './ResponsiveUtils'

interface LayoutDebuggerProps {
  showGrid?: boolean
  showBreakpoints?: boolean
  showContainerQueries?: boolean
  showTouchTargets?: boolean
  showViewportInfo?: boolean
  showPerformance?: boolean
  className?: string
}

export const LayoutDebugger: React.FC<LayoutDebuggerProps> = ({
  showGrid = true,
  showBreakpoints = true,
  showContainerQueries = true,
  showTouchTargets = true,
  showViewportInfo = true,
  showPerformance = true,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [gridEnabled, setShowGrid] = useState(showGrid)
  const [touchTargetsEnabled, setShowTouchTargets] = useState(showTouchTargets)
  const [containerQueriesEnabled, setShowContainerQueries] = useState(showContainerQueries)
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memory: 0,
    layoutShifts: 0,
  })
  const viewport = useViewport()

  // Toggle debugger visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Monitor performance metrics
  useEffect(() => {
    if (!showPerformance || !isVisible) return

    let frameCount = 0
    let lastTime = performance.now()
    let rafId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime >= lastTime + 1000) {
        setPerformanceMetrics(prev => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
        }))
        frameCount = 0
        lastTime = currentTime
      }

      rafId = requestAnimationFrame(measureFPS)
    }

    rafId = requestAnimationFrame(measureFPS)

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setPerformanceMetrics(prev => ({
          ...prev,
          memory: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
        }))
      }
    }, 1000)

    // Monitor layout shifts
    let layoutShiftCount = 0
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift') {
          layoutShiftCount++
          setPerformanceMetrics(prev => ({
            ...prev,
            layoutShifts: layoutShiftCount,
          }))
        }
      }
    })

    observer.observe({ entryTypes: ['layout-shift'] })

    return () => {
      cancelAnimationFrame(rafId)
      clearInterval(memoryInterval)
      observer.disconnect()
    }
  }, [showPerformance, isVisible])

  // Handle debug styles
  useEffect(() => {
    const styleId = 'layout-debugger-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!isVisible) {
      if (styleElement) {
        styleElement.remove()
      }
      return
    }

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    const styles: string[] = []

    if (touchTargetsEnabled) {
      styles.push(`
        button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"]) {
          position: relative;
        }
        button::after, a::after, input::after, textarea::after, select::after, [role="button"]::after, [tabindex]:not([tabindex="-1"])::after {
          content: '';
          position: absolute;
          inset: 0;
          min-width: 44px;
          min-height: 44px;
          border: 2px dashed rgba(255, 0, 255, 0.5);
          pointer-events: none;
          transform: translate(-50%, -50%);
          left: 50%;
          top: 50%;
        }
      `)
    }

    if (containerQueriesEnabled) {
      styles.push(`
        [class*="@container"], .container-queries {
          outline: 2px dashed rgba(0, 255, 0, 0.5) !important;
          outline-offset: -2px;
        }
      `)
    }

    styleElement.textContent = styles.join('\n')

    return () => {
      if (styleElement) {
        styleElement.remove()
      }
    }
  }, [isVisible, touchTargetsEnabled, containerQueriesEnabled])

  if (!isVisible) {
    return (
      <button
        className='bg-primary text-primary-foreground hover:bg-primary/90 fixed right-4 bottom-4 z-50 rounded-full p-3 shadow-lg'
        onClick={() => setIsVisible(true)}
        aria-label='Toggle layout debugger'
      >
        <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z'
          />
        </svg>
      </button>
    )
  }

  return (
    <>
      {/* Grid overlay */}
      {gridEnabled && (
        <div
          className='pointer-events-none fixed inset-0 z-40'
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, rgba(255,0,0,0.1) 0px, transparent 1px, transparent 7px, rgba(255,0,0,0.1) 8px),
              repeating-linear-gradient(90deg, rgba(255,0,0,0.1) 0px, transparent 1px, transparent 7px, rgba(255,0,0,0.1) 8px)
            `,
            backgroundSize: '8px 8px',
          }}
        />
      )}

      {/* Touch target indicators are handled via useEffect */}

      {/* Container query indicators are handled via useEffect */}

      {/* Debug panel */}
      <div
        className={cn(
          'bg-background/95 fixed right-4 bottom-4 z-50 rounded-lg p-4 shadow-lg backdrop-blur',
          'border-border border',
          'max-w-sm',
          className
        )}
      >
        <div className='mb-3 flex items-center justify-between'>
          <h3 className='text-sm font-semibold'>Layout Debugger</h3>
          <button
            className='hover:bg-muted rounded p-1'
            onClick={() => setIsVisible(false)}
            aria-label='Close debugger'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Viewport info */}
        {showViewportInfo && (
          <div className='mb-3 space-y-1 text-xs'>
            <div>
              Viewport: {viewport.width} × {viewport.height}
            </div>
            <div>
              Device: {viewport.isMobile ? 'Mobile' : viewport.isTablet ? 'Tablet' : 'Desktop'}
            </div>
          </div>
        )}

        {/* Breakpoint indicator */}
        {showBreakpoints && (
          <div className='mb-3 text-xs'>
            <div className='font-medium'>Active Breakpoint:</div>
            <div className='mt-1 flex gap-1'>
              <span
                className={cn(
                  'rounded px-2 py-1',
                  viewport.width < 475 && 'bg-primary text-primary-foreground'
                )}
              >
                base
              </span>
              <span
                className={cn(
                  'rounded px-2 py-1',
                  viewport.width >= 475 &&
                    viewport.width < 640 &&
                    'bg-primary text-primary-foreground'
                )}
              >
                xs
              </span>
              <span
                className={cn(
                  'rounded px-2 py-1',
                  viewport.width >= 640 &&
                    viewport.width < 768 &&
                    'bg-primary text-primary-foreground'
                )}
              >
                sm
              </span>
              <span
                className={cn(
                  'rounded px-2 py-1',
                  viewport.width >= 768 &&
                    viewport.width < 1024 &&
                    'bg-primary text-primary-foreground'
                )}
              >
                md
              </span>
              <span
                className={cn(
                  'rounded px-2 py-1',
                  viewport.width >= 1024 &&
                    viewport.width < 1280 &&
                    'bg-primary text-primary-foreground'
                )}
              >
                lg
              </span>
              <span
                className={cn(
                  'rounded px-2 py-1',
                  viewport.width >= 1280 &&
                    viewport.width < 1536 &&
                    'bg-primary text-primary-foreground'
                )}
              >
                xl
              </span>
              <span
                className={cn(
                  'rounded px-2 py-1',
                  viewport.width >= 1536 && 'bg-primary text-primary-foreground'
                )}
              >
                2xl
              </span>
            </div>
          </div>
        )}

        {/* Performance metrics */}
        {showPerformance && (
          <div className='space-y-1 text-xs'>
            <div>FPS: {performanceMetrics.fps}</div>
            {performanceMetrics.memory > 0 && <div>Memory: {performanceMetrics.memory} MB</div>}
            <div>Layout Shifts: {performanceMetrics.layoutShifts}</div>
          </div>
        )}

        {/* Toggle options */}
        <div className='mt-3 space-y-1 border-t pt-3 text-xs'>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={gridEnabled}
              onChange={e => setShowGrid(e.target.checked)}
              className='rounded'
            />
            Show Grid
          </label>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={touchTargetsEnabled}
              onChange={e => setShowTouchTargets(e.target.checked)}
              className='rounded'
            />
            Show Touch Targets
          </label>
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={containerQueriesEnabled}
              onChange={e => setShowContainerQueries(e.target.checked)}
              className='rounded'
            />
            Show Container Queries
          </label>
        </div>

        <div className='text-muted-foreground mt-2 text-xs'>Press Ctrl+Shift+D to toggle</div>
      </div>
    </>
  )
}
