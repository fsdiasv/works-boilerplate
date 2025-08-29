import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with Tailwind CSS conflict resolution
 *
 * This utility merges class names using clsx for conditional classes
 * and tailwind-merge to resolve Tailwind CSS class conflicts.
 *
 * @param inputs - Class names, objects, or arrays to merge
 * @returns Optimized class string with conflicts resolved
 *
 * @example
 * ```ts
 * cn('px-2 py-1', 'px-4') // "py-1 px-4" (px-2 is overridden)
 * cn('btn', { 'btn-primary': isPrimary, 'btn-secondary': !isPrimary })
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats bytes to human readable format
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.23 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Truncates text to specified length with ellipsis
 *
 * @param text - Text to truncate
 * @param length - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return `${text.slice(0, length)}...`
}

/**
 * Debounce function for performance optimization
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Sleep utility for async operations
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Checks if device supports touch
 *
 * @returns True if touch is supported
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  // Legacy IE navigator interface extension
  const legacyNavigator = navigator as Navigator & { msMaxTouchPoints?: number }
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (legacyNavigator.msMaxTouchPoints ?? 0) > 0
  )
}

/**
 * Gets viewport dimensions safely
 *
 * @returns Viewport width and height
 */
export function getViewport(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 }
  }

  return {
    width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  }
}

/**
 * Checks if user prefers reduced motion
 *
 * @returns True if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Gets safe area insets for PWA
 *
 * @returns Safe area insets object
 */
export function getSafeAreaInsets(): {
  top: number
  right: number
  bottom: number
  left: number
} {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const computedStyle = getComputedStyle(document.documentElement)

  return {
    top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top').replace('px', '') || '0'),
    right: parseInt(
      computedStyle.getPropertyValue('--safe-area-inset-right').replace('px', '') || '0'
    ),
    bottom: parseInt(
      computedStyle.getPropertyValue('--safe-area-inset-bottom').replace('px', '') || '0'
    ),
    left: parseInt(
      computedStyle.getPropertyValue('--safe-area-inset-left').replace('px', '') || '0'
    ),
  }
}
