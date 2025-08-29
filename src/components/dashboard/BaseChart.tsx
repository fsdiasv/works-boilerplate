'use client'

import { AlertCircle, Settings, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import React from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Analyze error to provide better user experience
 */
function analyzeError(error: string) {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('unauthorized') || errorLower.includes('401')) {
    return {
      type: 'auth',
      icon: Users,
      titleKey: 'error.auth.title',
      descriptionKey: 'error.auth.description',
      actionKey: 'error.auth.action',
    }
  }
  
  if (errorLower.includes('no active workspace') || 
      errorLower.includes('precondition_failed') ||
      errorLower.includes('workspace')) {
    return {
      type: 'workspace',
      icon: Settings,
      titleKey: 'error.workspace.title',
      descriptionKey: 'error.workspace.description',
      actionKey: 'error.workspace.action',
    }
  }
  
  return {
    type: 'generic',
    icon: AlertCircle,
    titleKey: 'error.generic.title',
    descriptionKey: 'error.generic.description',
    actionKey: 'error.generic.action',
  }
}

/**
 * Base props interface for all chart components
 */
export interface BaseChartProps {
  loading?: boolean
  error?: string | undefined
  height?: number
  locale?: string
  timezone?: string
  className?: string | undefined
}

/**
 * Base chart wrapper component that handles loading, error states, and theming
 */
export interface BaseChartWrapperProps extends BaseChartProps {
  children: React.ReactNode
  translationKey?: string
}

export function BaseChartWrapper({
  loading = false,
  error,
  height = 400,
  className = '',
  children,
  translationKey = 'Chart',
}: BaseChartWrapperProps) {
  const t = useTranslations(translationKey)
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (loading) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='w-full space-y-4 p-6'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-64 w-full' />
            <div className='flex justify-center space-x-4'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    const errorInfo = analyzeError(error)
    const IconComponent = errorInfo.icon
    
    const handleErrorAction = () => {
      if (errorInfo.type === 'auth') {
        // Redirect to login or refresh page
        window.location.reload()
      } else if (errorInfo.type === 'workspace') {
        // Redirect to workspace selection
        window.location.href = '/workspace/select'
      } else {
        // Generic retry action
        window.location.reload()
      }
    }
    
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center p-4'>
          <Alert variant='destructive' className='max-w-md'>
            <IconComponent className='h-4 w-4' />
            <AlertTitle>
              {t(errorInfo.titleKey, { fallback: 'Error loading chart' })}
            </AlertTitle>
            <AlertDescription className='mt-2 space-y-3'>
              <p>{t(errorInfo.descriptionKey, { fallback: error })}</p>
              <Button 
                variant='outline' 
                size='sm' 
                onClick={handleErrorAction}
                className='w-full'
              >
                {t(errorInfo.actionKey, { fallback: 'Try again' })}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
      data-theme={isDark ? 'dark' : 'light'}
    >
      {children}
    </div>
  )
}

/**
 * Common chart configuration constants
 */
export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  secondary: '#6366f1',
  tertiary: '#8b5cf6',

  // Theme-aware colors
  grid: {
    light: '#e5e7eb',
    dark: '#374151',
  },
  text: {
    light: '#111827',
    dark: '#f3f4f6',
  },
  axis: {
    light: '#6b7280',
    dark: '#9ca3af',
  },
  tooltip: {
    light: '#ffffff',
    dark: '#1f2937',
  },
}

/**
 * Get theme-aware color
 */
export function getThemeColor(colorKey: keyof typeof CHART_COLORS, isDark: boolean) {
  const colorMap = CHART_COLORS[colorKey]
  if (typeof colorMap === 'object' && 'light' in colorMap && 'dark' in colorMap) {
    return isDark ? colorMap.dark : colorMap.light
  }
  return colorMap as string
}

/**
 * Common chart margin configuration
 */
export const CHART_MARGINS = {
  default: { top: 5, right: 30, left: 20, bottom: 5 },
  withLegend: { top: 5, right: 30, left: 20, bottom: 30 },
  compact: { top: 0, right: 0, left: 0, bottom: 0 },
}

/**
 * Format tick values for currency
 */
export function formatCurrencyTick(value: number, locale: string = 'pt-BR'): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toFixed(0)
}

/**
 * Format tick values for counts
 */
export function formatCountTick(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

/**
 * Common tooltip styles
 */
export const TOOLTIP_STYLES = {
  light: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '8px 12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  dark: {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '6px',
    padding: '8px 12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
  },
}

/**
 * Get performance color based on value and thresholds
 */
export function getPerformanceColor(
  value: number,
  threshold: number,
  type: 'positive' | 'negative' = 'positive'
): string {
  if (type === 'positive') {
    // Higher is better
    if (value >= threshold) return CHART_COLORS.success
    if (value >= threshold * 0.7) return CHART_COLORS.warning
    return CHART_COLORS.danger
  } else {
    // Lower is better (e.g., refund rate)
    if (value <= threshold) return CHART_COLORS.success
    if (value <= threshold * 1.3) return CHART_COLORS.warning
    return CHART_COLORS.danger
  }
}

/**
 * Custom hook for chart theme configuration
 */
export function useChartTheme() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return {
    isDark,
    gridColor: getThemeColor('grid', isDark),
    textColor: getThemeColor('text', isDark),
    axisColor: getThemeColor('axis', isDark),
    tooltipBg: getThemeColor('tooltip', isDark),
    tooltipStyle: isDark ? TOOLTIP_STYLES.dark : TOOLTIP_STYLES.light,
  }
}
