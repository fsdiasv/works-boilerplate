/**
 * Navigation haptic feedback utilities
 * Provides cross-platform haptic feedback for navigation interactions
 */

export type HapticFeedbackType =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection'
  | 'success'
  | 'warning'
  | 'error'

interface HapticPattern {
  duration: number
  intensity: number
}

const HAPTIC_PATTERNS: Record<HapticFeedbackType, HapticPattern> = {
  light: { duration: 10, intensity: 50 },
  medium: { duration: 20, intensity: 100 },
  heavy: { duration: 30, intensity: 150 },
  selection: { duration: 15, intensity: 75 },
  success: { duration: 25, intensity: 100 },
  warning: { duration: 20, intensity: 125 },
  error: { duration: 40, intensity: 150 },
}

/**
 * Trigger haptic feedback on supported devices
 */
export function triggerHapticFeedback(type: HapticFeedbackType = 'light'): void {
  if (typeof window === 'undefined') return

  const pattern = HAPTIC_PATTERNS[type]

  // Check for Vibration API support
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern.duration)
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  // iOS-specific haptic feedback (when available)
  if (window.webkit?.messageHandlers?.haptic) {
    try {
      window.webkit.messageHandlers.haptic.postMessage(type)
    } catch (error) {
      console.warn('iOS haptic feedback failed:', error)
    }
  }
}

/**
 * Check if haptic feedback is supported on the current device
 */
export function isHapticFeedbackSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'vibrate' in navigator || !!window.webkit?.messageHandlers?.haptic
}

/**
 * Create a haptic feedback handler with debouncing
 */
export function createHapticHandler(
  type: HapticFeedbackType = 'light',
  debounceMs: number = 50
): () => void {
  let lastTriggerTime = 0

  return () => {
    const now = Date.now()
    if (now - lastTriggerTime < debounceMs) return

    lastTriggerTime = now
    triggerHapticFeedback(type)
  }
}

// Extend Window interface for iOS webkit
declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        haptic?: {
          postMessage: (type: string) => void
        }
      }
    }
  }
}
