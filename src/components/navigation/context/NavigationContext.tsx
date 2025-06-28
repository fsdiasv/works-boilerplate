'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createContext, useContext, useState, useMemo } from 'react'

import type { NavigationState, NavigationActions, NavigationContextValue } from '../types'

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined)

interface NavigationProviderProps {
  children: React.ReactNode
  initialState?: Partial<NavigationState>
}

/**
 * Navigation Provider for centralized navigation state management
 */
export function NavigationProvider({ children, initialState }: NavigationProviderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const [state, setState] = useState<NavigationState>({
    activeItemId: null,
    isDrawerOpen: false,
    isBottomTabVisible: true,
    scrollDirection: null,
    currentRoute: pathname,
    ...initialState,
  })

  const actions = useMemo<NavigationActions>(
    () => ({
      setActiveItem: (itemId: string) => {
        setState(prev => ({ ...prev, activeItemId: itemId }))
      },

      toggleDrawer: (open?: boolean) => {
        setState(prev => ({
          ...prev,
          isDrawerOpen: open ?? !prev.isDrawerOpen,
        }))
      },

      setBottomTabVisibility: (visible: boolean) => {
        setState(prev => ({ ...prev, isBottomTabVisible: visible }))
      },

      updateScrollDirection: (direction: 'up' | 'down' | null) => {
        setState(prev => ({ ...prev, scrollDirection: direction }))
      },

      navigateTo: (route: string) => {
        setState(prev => ({ ...prev, currentRoute: route }))
        router.push(route)
      },
    }),
    [router]
  )

  const value = useMemo<NavigationContextValue>(() => ({ state, actions }), [state, actions])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

/**
 * Hook to use navigation context
 */
export function useNavigation() {
  const context = useContext(NavigationContext)

  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }

  return context
}

/**
 * Hook to get only navigation state
 */
export function useNavigationState() {
  const { state } = useNavigation()
  return state
}

/**
 * Hook to get only navigation actions
 */
export function useNavigationActions() {
  const { actions } = useNavigation()
  return actions
}
