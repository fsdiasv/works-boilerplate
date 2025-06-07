'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'

/**
 * Theme provider component for dark mode support
 *
 * Wraps the next-themes provider with PWA-optimized settings
 * for mobile-first applications.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange={false}
      storageKey='works-boilerplate-theme'
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

/**
 * Hook to detect system theme preference
 *
 * @returns Whether system prefers dark mode
 */
export function useSystemTheme(): boolean {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setIsDark(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isDark
}

/**
 * Hook to check if running in standalone PWA mode
 *
 * @returns Whether app is running in standalone mode
 */
export function useStandaloneMode(): boolean {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      // @ts-expect-error Legacy iOS PWA detection
      Boolean(window.navigator.standalone) ||
      document.referrer.includes('android-app://')

    setIsStandalone(isStandaloneMode)
  }, [])

  return isStandalone
}

/**
 * Hook to manage theme with localStorage persistence
 *
 * @param defaultTheme - Default theme value
 * @returns Theme state and setter
 */
export function useTheme(defaultTheme = 'system'): [string, (theme: string) => void] {
  const [theme, setTheme] = useState(defaultTheme)

  useEffect(() => {
    const stored = localStorage.getItem('works-boilerplate-theme')
    if (stored != null) {
      setTheme(stored)
    }
  }, [])

  const updateTheme = useCallback((newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('works-boilerplate-theme', newTheme)

    // Apply theme class to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System theme
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  return [theme, updateTheme]
}
