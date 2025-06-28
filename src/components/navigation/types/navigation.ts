import type { LucideIcon } from 'lucide-react'

/**
 * Base navigation item interface used across all navigation components
 */
export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
  badge?: number | string
  isActive?: boolean
  isDisabled?: boolean
  isSpecial?: boolean
  requiredPermissions?: string[]
  children?: NavigationItem[]
}

/**
 * Navigation component visibility state
 */
export interface NavigationVisibility {
  isVisible: boolean
  isAnimating: boolean
  lastScrollY: number
}

/**
 * Navigation component behavior configuration
 */
export interface NavigationBehavior {
  hideOnScroll?: boolean
  scrollThreshold?: number
  animationDuration?: number
  enableHapticFeedback?: boolean
}

/**
 * Safe area insets for PWA compatibility
 */
export interface SafeAreaInsets {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * Navigation component position
 */
export type NavigationPosition = 'top' | 'bottom' | 'left' | 'right'

/**
 * Navigation component variants
 */
export type NavigationVariant = 'default' | 'minimal' | 'extended'

/**
 * Navigation state for context management
 */
export interface NavigationState {
  activeItemId: string | null
  isDrawerOpen: boolean
  isBottomTabVisible: boolean
  scrollDirection: 'up' | 'down' | null
  currentRoute: string
}

/**
 * Navigation actions for state updates
 */
export interface NavigationActions {
  setActiveItem: (itemId: string) => void
  toggleDrawer: (open?: boolean) => void
  setBottomTabVisibility: (visible: boolean) => void
  updateScrollDirection: (direction: 'up' | 'down' | null) => void
  navigateTo: (route: string) => void
}

/**
 * Navigation context value combining state and actions
 */
export interface NavigationContextValue {
  state: NavigationState
  actions: NavigationActions
}

/**
 * Badge configuration for navigation items
 */
export interface NavigationBadge {
  value: number | string
  variant?: 'default' | 'destructive' | 'secondary'
  showZero?: boolean
  maxCount?: number
}

/**
 * Animation configuration for navigation components
 */
export interface NavigationAnimation {
  type: 'slide' | 'fade' | 'scale' | 'none'
  duration?: number
  easing?: string
  stiffness?: number
  damping?: number
}

/**
 * Gesture configuration for navigation components
 */
export interface NavigationGestures {
  swipeEnabled?: boolean
  swipeThreshold?: number
  swipeVelocityThreshold?: number
  dragEnabled?: boolean
  dragElastic?: boolean | number
}
