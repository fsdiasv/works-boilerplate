import { useState, useEffect, useCallback } from 'react'

interface PWAFeatures {
  isStandalone: boolean
  isPWA: boolean
  safeAreaInsets: {
    top: number
    right: number
    bottom: number
    left: number
  }
  supportsVibration: boolean
  supportsBadging: boolean
  isOnline: boolean
  installPrompt: BeforeInstallPromptEvent | null
}


export function usePWAFeatures() {
  const [features, setFeatures] = useState<PWAFeatures>({
    isStandalone: false,
    isPWA: false,
    safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
    supportsVibration: false,
    supportsBadging: false,
    isOnline: true,
    installPrompt: null,
  })

  // Detect standalone mode
  const detectStandaloneMode = useCallback(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator.standalone === true) ||
      document.referrer.includes('android-app://') ||
      window.location.href.includes('mode=standalone')

    return isStandalone
  }, [])

  // Detect if running as PWA
  const detectPWA = useCallback(() => {
    const isPWA =
      detectStandaloneMode() ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches

    return isPWA
  }, [detectStandaloneMode])

  // Get safe area insets
  const getSafeAreaInsets = useCallback(() => {
    const root = document.documentElement
    const computedStyle = getComputedStyle(root)

    // Try to get pre-calculated CSS custom properties first
    const getInsetValue = (property: string, fallback: string): number => {
      const value = computedStyle.getPropertyValue(property)
      if (value && value !== '') {
        const parsed = parseInt(value)
        return isNaN(parsed) ? 0 : parsed
      }
      // For CSS env() variables, we need to check if they're already applied via CSS
      const fallbackValue = computedStyle.getPropertyValue(fallback)
      if (fallbackValue && fallbackValue !== '') {
        const parsed = parseInt(fallbackValue)
        return isNaN(parsed) ? 0 : parsed
      }
      return 0
    }

    return {
      top: getInsetValue('--sat', '--safe-area-inset-top'),
      right: getInsetValue('--sar', '--safe-area-inset-right'),
      bottom: getInsetValue('--sab', '--safe-area-inset-bottom'),
      left: getInsetValue('--sal', '--safe-area-inset-left'),
    }
  }, [])

  // Set CSS custom properties for safe areas
  const setSafeAreaProperties = useCallback(() => {
    const insets = getSafeAreaInsets()
    const root = document.documentElement

    root.style.setProperty('--safe-area-inset-top', `${insets.top}px`)
    root.style.setProperty('--safe-area-inset-right', `${insets.right}px`)
    root.style.setProperty('--safe-area-inset-bottom', `${insets.bottom}px`)
    root.style.setProperty('--safe-area-inset-left', `${insets.left}px`)

    return insets
  }, [getSafeAreaInsets])

  // Vibrate device
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
      return true
    }
    return false
  }, [])

  // Set app badge
  const setBadge = useCallback(
    async (count?: number) => {
      if ('setAppBadge' in navigator && features.supportsBadging) {
        try {
          if (count === undefined || count === 0) {
            // TypeScript doesn't know about these methods yet
            if (navigator.clearAppBadge) {
              await navigator.clearAppBadge()
            }
          } else {
            await navigator.setAppBadge?.(count)
          }
          return true
        } catch (error) {
          console.error('Failed to set badge:', error)
        }
      }
      return false
    },
    [features.supportsBadging]
  )

  // Clear app badge
  const clearBadge = useCallback(async () => {
    return setBadge(0)
  }, [setBadge])

  // Trigger install prompt
  const promptInstall = useCallback(async () => {
    if (!features.installPrompt) return false

    try {
      await features.installPrompt.prompt()
      const { outcome } = await features.installPrompt.userChoice

      // Clear the saved prompt
      setFeatures(prev => ({ ...prev, installPrompt: null }))

      return outcome === 'accepted'
    } catch (error) {
      console.error('Failed to prompt install:', error)
      return false
    }
  }, [features.installPrompt])

  // Initialize PWA features
  useEffect(() => {
    const updateFeatures = () => {
      const insets = setSafeAreaProperties()

      setFeatures(prev => ({
        ...prev,
        isStandalone: detectStandaloneMode(),
        isPWA: detectPWA(),
        safeAreaInsets: insets,
        supportsVibration: 'vibrate' in navigator,
        supportsBadging: 'setAppBadge' in navigator,
        isOnline: navigator.onLine,
      }))
    }

    // Initial detection
    updateFeatures()

    // Listen for install prompt
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault()
      setFeatures(prev => ({ ...prev, installPrompt: e as BeforeInstallPromptEvent }))
    }

    // Listen for online/offline
    const handleOnline = () => setFeatures(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setFeatures(prev => ({ ...prev, isOnline: false }))

    // Listen for display mode changes
    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = () => updateFeatures()

    // Listen for orientation changes (may affect safe areas)
    const handleOrientationChange = () => {
      setTimeout(updateFeatures, 100) // Delay to ensure values are updated
    }

    window.addEventListener('beforeinstallprompt', handleInstallPrompt)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)
    displayModeQuery.addEventListener('change', handleDisplayModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', handleOrientationChange)
      displayModeQuery.removeEventListener('change', handleDisplayModeChange)
    }
  }, [detectStandaloneMode, detectPWA, setSafeAreaProperties])

  return {
    ...features,
    vibrate,
    setBadge,
    clearBadge,
    promptInstall,
    canInstall: features.installPrompt !== null,
  }
}
