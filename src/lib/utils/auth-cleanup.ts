/**
 * Auth cleanup utilities for logout and session management
 */

/**
 * Clear all user-related data from browser storage
 * Preserves non-sensitive preferences like theme
 */
export async function clearAllUserData(): Promise<void> {
  try {
    // Preserve theme preference before clearing
    const theme = localStorage.getItem('theme')

    // Clear all localStorage except preserved items
    const keysToPreserve = ['theme', 'locale', 'sidebar:state']
    const allKeys = Object.keys(localStorage)

    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key)
      }
    })

    // Clear sessionStorage completely
    sessionStorage.clear()

    // Clear auth-specific storage
    localStorage.removeItem('works-auth')
    localStorage.removeItem('supabase.auth.token')

    // Clear service worker cache if available
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => {
          // Only clear user-specific caches, not app caches
          if (cacheName.includes('user') || cacheName.includes('auth')) {
            return caches.delete(cacheName)
          }
          return Promise.resolve()
        })
      )
    }

    // Clear cookies (client-side accessible ones)
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()

      // Don't clear essential cookies
      if (!['theme', 'locale'].includes(name)) {
        // Clear for current path
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        // Clear for domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
        // Clear for parent domain (if subdomain)
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
      }
    })

    // Restore preserved preferences
    if (theme !== null && theme !== '') {
      localStorage.setItem('theme', theme)
    }
  } catch (error) {
    console.error('Error clearing user data:', error)
    // Don't throw - we still want logout to proceed
  }
}

/**
 * Clear PWA-specific data and caches
 */
export async function clearPWAData(): Promise<void> {
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map(registration => registration.unregister()))
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
    }

    // Clear IndexedDB if used
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases()
      await Promise.all(
        databases.map(db => {
          if (db.name !== undefined && db.name !== '' && db.name.includes('supabase')) {
            return indexedDB.deleteDatabase(db.name)
          }
          return Promise.resolve()
        })
      )
    }
  } catch (error) {
    console.error('Error clearing PWA data:', error)
    // Don't throw - we still want logout to proceed
  }
}

/**
 * Perform a complete cleanup for logout
 * This includes all user data and optionally PWA data
 */
export async function performLogoutCleanup(options?: { clearPWA?: boolean }): Promise<void> {
  // Clear user data
  await clearAllUserData()

  // Optionally clear PWA data (more aggressive cleanup)
  if (options?.clearPWA === true) {
    await clearPWAData()
  }

  // Force reload any cached resources
  if ('caches' in window) {
    // This will cause the service worker to re-fetch resources
    window.location.reload()
  }
}
