'use client'

import { useEffect, useState } from 'react'

/**
 * Custom hook to detect and monitor system theme changes
 * Returns the current system theme preference
 */
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | undefined>(undefined)

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return

    // Get initial system theme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    // Listen for system theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return systemTheme
}
