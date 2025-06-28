import type { NavigationItem } from '../types'

/**
 * Find a navigation item by ID in a nested structure
 */
export function findNavigationItemById(items: NavigationItem[], id: string): NavigationItem | null {
  for (const item of items) {
    if (item.id === id) return item

    if (item.children) {
      const found = findNavigationItemById(item.children, id)
      if (found) return found
    }
  }

  return null
}

/**
 * Get the active navigation item based on the current path
 */
export function getActiveNavigationItem(
  items: NavigationItem[],
  currentPath: string
): NavigationItem | null {
  let bestMatch: NavigationItem | null = null
  let bestMatchLength = 0

  function searchItems(itemList: NavigationItem[]) {
    for (const item of itemList) {
      if (currentPath.startsWith(item.href) && item.href.length > bestMatchLength) {
        bestMatch = item
        bestMatchLength = item.href.length
      }

      if (item.children) {
        searchItems(item.children)
      }
    }
  }

  searchItems(items)
  return bestMatch
}

/**
 * Flatten nested navigation items into a single array
 */
export function flattenNavigationItems(items: NavigationItem[]): NavigationItem[] {
  const flattened: NavigationItem[] = []

  function flatten(itemList: NavigationItem[]) {
    for (const item of itemList) {
      flattened.push(item)
      if (item.children) {
        flatten(item.children)
      }
    }
  }

  flatten(items)
  return flattened
}

/**
 * Check if user has required permissions for a navigation item
 */
export function hasNavigationPermission(
  item: NavigationItem,
  userPermissions: string[] = []
): boolean {
  if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
    return true
  }

  return item.requiredPermissions.some(permission => userPermissions.includes(permission))
}

/**
 * Filter navigation items based on user permissions
 */
export function filterNavigationByPermissions(
  items: NavigationItem[],
  userPermissions: string[] = []
): NavigationItem[] {
  return items
    .filter(item => hasNavigationPermission(item, userPermissions))
    .map(item => {
      const filteredItem: NavigationItem = { ...item }
      if (item.children) {
        filteredItem.children = filterNavigationByPermissions(item.children, userPermissions)
      }
      return filteredItem
    })
}

/**
 * Get breadcrumb items from current path
 */
export function getBreadcrumbItems(items: NavigationItem[], currentPath: string): NavigationItem[] {
  const breadcrumbs: NavigationItem[] = []
  const pathSegments = currentPath.split('/').filter(Boolean)
  let currentHref = ''

  for (const segment of pathSegments) {
    currentHref += `/${segment}`
    const item = findNavigationItemByHref(items, currentHref)
    if (item) {
      breadcrumbs.push(item)
    }
  }

  return breadcrumbs
}

/**
 * Find navigation item by href
 */
function findNavigationItemByHref(items: NavigationItem[], href: string): NavigationItem | null {
  for (const item of items) {
    if (item.href === href) return item

    if (item.children) {
      const found = findNavigationItemByHref(item.children, href)
      if (found) return found
    }
  }

  return null
}

/**
 * Create a navigation tree from flat items
 */
export function createNavigationTree(items: NavigationItem[], parentId?: string): NavigationItem[] {
  return items
    .filter(item => {
      if (parentId === undefined || parentId === '') return !item.href.includes('/', 1)
      return (
        item.href.startsWith(parentId) && item.href.slice(parentId.length).split('/').length === 2
      )
    })
    .map(item => ({
      ...item,
      children: createNavigationTree(items, item.href),
    }))
}

/**
 * Touch target wrapper props for accessibility
 */
export const TOUCH_TARGET_SIZE = 44 // 44x44px minimum

export function getTouchTargetProps(size: number = TOUCH_TARGET_SIZE) {
  return {
    style: {
      minWidth: `${size}px`,
      minHeight: `${size}px`,
      WebkitTapHighlightColor: 'transparent',
    },
    className: 'relative flex items-center justify-center',
  }
}
