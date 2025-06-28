'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type React from 'react'

import { triggerHapticFeedback } from '../../utils/haptics'

type BackButtonProps = {
  children: React.ReactNode
  className?: string
  fallbackUrl?: string
  ariaLabel?: string
  onClick?: () => void
  enableHapticFeedback?: boolean
}

export default function BackButton({
  children,
  className,
  fallbackUrl,
  ariaLabel,
  onClick,
  enableHapticFeedback = true,
}: BackButtonProps) {
  const router = useRouter()

  const handleClick = useCallback(() => {
    // Trigger haptic feedback
    if (enableHapticFeedback) {
      triggerHapticFeedback('selection')
    }

    // Custom onClick takes precedence
    if (onClick) {
      onClick()
      return
    }

    // Check if we're in a browser environment (not SSR)
    if (typeof window === 'undefined') {
      return
    }

    // Try to go back, but use fallback if no history
    // Note: We can't reliably detect if history.back() will work,
    // so we provide a fallback option for better UX
    if (fallbackUrl !== undefined && fallbackUrl !== '' && window.history.length <= 1) {
      router.push(fallbackUrl)
    } else {
      window.history.back()
    }
  }, [onClick, fallbackUrl, router, enableHapticFeedback])

  return (
    <button
      type='button'
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel ?? 'Go back'}
    >
      {children}
    </button>
  )
}
