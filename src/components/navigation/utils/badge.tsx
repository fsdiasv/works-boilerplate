import React from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import type { NavigationBadge } from '../types'

/**
 * Format badge value with max count support
 */
export function formatBadgeValue(value: number | string, maxCount: number = 99): string {
  if (typeof value === 'string') return value
  if (value > maxCount) return `${maxCount}+`
  return value.toString()
}

/**
 * Check if badge should be displayed
 */
export function shouldShowBadge(badge?: NavigationBadge | number | string): boolean {
  if (badge === undefined) return false

  if (typeof badge === 'object') {
    const value = badge.value
    if (typeof value === 'number') {
      return badge.showZero === true ? true : value > 0
    }
    return typeof value === 'string' && value !== ''
  }

  if (typeof badge === 'number') {
    return badge > 0
  }

  return badge !== ''
}

/**
 * Render a navigation badge with consistent styling
 */
export function renderNavigationBadge(
  badge?: NavigationBadge | number | string,
  className?: string
): React.ReactNode | null {
  if (!shouldShowBadge(badge)) return null

  const config: NavigationBadge =
    typeof badge === 'object' ? badge : { value: badge as string | number }

  const { value, variant = 'destructive', maxCount = 99 } = config
  const displayValue = formatBadgeValue(value, maxCount)

  return (
    <Badge
      variant={variant}
      className={cn('ml-auto flex h-5 min-w-[20px] items-center justify-center px-1', className)}
    >
      {displayValue}
    </Badge>
  )
}

/**
 * Badge configuration helpers
 */
export const BADGE_PRESETS = {
  notification: (count: number): NavigationBadge => ({
    value: count,
    variant: 'destructive',
    showZero: false,
    maxCount: 99,
  }),

  message: (count: number): NavigationBadge => ({
    value: count,
    variant: 'default',
    showZero: false,
    maxCount: 999,
  }),

  update: (): NavigationBadge => ({
    value: '•',
    variant: 'secondary',
  }),

  new: (): NavigationBadge => ({
    value: 'NEW',
    variant: 'secondary',
  }),
} as const
