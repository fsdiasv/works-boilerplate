import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useCallback } from 'react'

const NAVIGATION_STATE_KEY = 'works-nav-state'
const NAVIGATION_HISTORY_KEY = 'works-nav-history'
const MAX_HISTORY_LENGTH = 10

interface NavigationState {
  lastPath: string
  scrollPositions: Record<string, number>
  timestamp: number
}

interface NavigationHistory {
  paths: string[]
  currentIndex: number
}

export function useNavigationPersistence() {
  const router = useRouter()
  const pathname = usePathname()

  // Save current scroll position
  const saveScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return

    const state = getNavigationState()
    state.scrollPositions[pathname] = window.scrollY
    state.timestamp = Date.now()

    localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state))
  }, [pathname])

  // Restore scroll position
  const restoreScrollPosition = useCallback(() => {
    if (typeof window === 'undefined') return

    const state = getNavigationState()
    const savedPosition = state.scrollPositions[pathname]

    if (savedPosition !== undefined) {
      // Use requestAnimationFrame for smooth restoration
      requestAnimationFrame(() => {
        window.scrollTo(0, savedPosition)
      })
    }
  }, [pathname])

  // Get navigation state from localStorage
  const getNavigationState = (): NavigationState => {
    if (typeof window === 'undefined') {
      return { lastPath: '/', scrollPositions: {}, timestamp: 0 }
    }

    try {
      const saved = localStorage.getItem(NAVIGATION_STATE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to parse navigation state:', error)
    }

    return { lastPath: '/', scrollPositions: {}, timestamp: 0 }
  }

  // Get navigation history
  const getNavigationHistory = (): NavigationHistory => {
    if (typeof window === 'undefined') {
      return { paths: [], currentIndex: -1 }
    }

    try {
      const saved = localStorage.getItem(NAVIGATION_HISTORY_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to parse navigation history:', error)
    }

    return { paths: [], currentIndex: -1 }
  }

  // Update navigation history
  const updateNavigationHistory = useCallback(() => {
    if (typeof window === 'undefined') return

    const history = getNavigationHistory()

    // If we're navigating back, just update the index
    if (history.currentIndex > 0 && history.paths[history.currentIndex - 1] === pathname) {
      history.currentIndex--
    } else if (
      history.currentIndex < history.paths.length - 1 &&
      history.paths[history.currentIndex + 1] === pathname
    ) {
      history.currentIndex++
    } else {
      // New navigation - truncate forward history and add new path
      history.paths = history.paths.slice(0, history.currentIndex + 1)
      history.paths.push(pathname)
      history.currentIndex++

      // Limit history length
      if (history.paths.length > MAX_HISTORY_LENGTH) {
        history.paths = history.paths.slice(-MAX_HISTORY_LENGTH)
        history.currentIndex = history.paths.length - 1
      }
    }

    localStorage.setItem(NAVIGATION_HISTORY_KEY, JSON.stringify(history))
  }, [pathname])

  // Navigate back with history
  const navigateBack = useCallback(() => {
    const history = getNavigationHistory()

    if (history.currentIndex > 0) {
      const previousPath = history.paths[history.currentIndex - 1]
      if (previousPath) {
        router.push(previousPath)
      }
    } else {
      // Fallback to browser back
      window.history.back()
    }
  }, [router])

  // Navigate forward with history
  const navigateForward = useCallback(() => {
    const history = getNavigationHistory()

    if (history.currentIndex < history.paths.length - 1) {
      const nextPath = history.paths[history.currentIndex + 1]
      if (nextPath) {
        router.push(nextPath)
      }
    }
  }, [router])

  // Can navigate back/forward
  const canNavigateBack = useCallback(() => {
    const history = getNavigationHistory()
    return history.currentIndex > 0
  }, [])

  const canNavigateForward = useCallback(() => {
    const history = getNavigationHistory()
    return history.currentIndex < history.paths.length - 1
  }, [])

  // Handle Android back button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      navigateBack()
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigateBack])

  // Save scroll position before navigation
  useEffect(() => {
    const handleBeforeUnload = () => saveScrollPosition()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [saveScrollPosition])

  // Update state and restore position on navigation
  useEffect(() => {
    updateNavigationHistory()
    restoreScrollPosition()

    // Update last path
    const state = getNavigationState()
    state.lastPath = pathname
    localStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state))
  }, [pathname, updateNavigationHistory, restoreScrollPosition])

  return {
    navigateBack,
    navigateForward,
    canNavigateBack,
    canNavigateForward,
    saveScrollPosition,
    restoreScrollPosition,
    getLastPath: () => getNavigationState().lastPath,
  }
}
