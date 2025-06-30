'use client'

// PWA Installation and Service Worker Utilities

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export interface PWAInstallPrompt {
  isInstallable: boolean
  isInstalled: boolean
  isIOS: boolean
  isStandalone: boolean
  prompt: (() => Promise<void>) | null
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

/**
 * Initialize PWA installation detection
 */
export function initializePWA(): void {
  if (typeof window === 'undefined') return

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferredPrompt = e

    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent('pwa-installable', { detail: true }))
  })

  // Listen for app installation
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new CustomEvent('pwa-installed', { detail: true }))
  })
}

/**
 * Check if the app is running in standalone mode
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Check if the device is iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false

  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Check if the app is installable
 */
export function isInstallable(): boolean {
  return deferredPrompt !== null
}

/**
 * Check if the app is already installed
 */
export function isInstalled(): boolean {
  return isStandalone()
}

/**
 * Get PWA installation status and prompt
 */
export function getPWAInstallPrompt(): PWAInstallPrompt {
  return {
    isInstallable: isInstallable(),
    isInstalled: isInstalled(),
    isIOS: isIOS(),
    isStandalone: isStandalone(),
    prompt: deferredPrompt
      ? async () => {
          if (deferredPrompt) {
            await deferredPrompt.prompt()
            const choiceResult = await deferredPrompt.userChoice

            if (choiceResult.outcome === 'accepted') {
              deferredPrompt = null
            }
          }
        }
      : null,
  }
}

/**
 * Show install prompt for PWA
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) return false

  try {
    await deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice

    if (choiceResult.outcome === 'accepted') {
      deferredPrompt = null
      return true
    }

    return false
  } catch (error) {
    console.error('Error showing install prompt:', error)
    return false
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    // Update service worker when a new version is available
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available, refresh to update
            window.dispatchEvent(new CustomEvent('sw-update-available'))
          }
        })
      }
    })

    return true
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return false
  }
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied'
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission()
  }

  return Notification.permission
}

/**
 * Get network status
 */
interface NetworkConnection {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
  rtt?: number
}

export function getNetworkStatus(): {
  isOnline: boolean
  connectionType?: string
} {
  if (typeof window === 'undefined') {
    return { isOnline: true }
  }

  const connection: NetworkConnection | undefined =
    (navigator as { connection?: NetworkConnection }).connection ??
    (navigator as { mozConnection?: NetworkConnection }).mozConnection ??
    (navigator as { webkitConnection?: NetworkConnection }).webkitConnection

  return {
    isOnline: navigator.onLine,
    connectionType: connection?.effectiveType ?? 'unknown',
  }
}
/**
 * Add network status listeners
 */
export function addNetworkListeners(onOnline: () => void, onOffline: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
}

/**
 * Register background sync
 */
export async function registerBackgroundSync(tag: string): Promise<boolean> {
  if (!isBackgroundSyncSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    await (
      registration as unknown as { sync: { register: (tag: string) => Promise<void> } }
    ).sync.register(tag)
    return true
  } catch (error) {
    console.error('Background sync registration failed:', error)
    return false
  }
}
