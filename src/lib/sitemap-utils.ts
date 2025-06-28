import fs from 'fs/promises'
import path from 'path'

interface RouteModificationTime {
  route: string
  lastModified: Date
}

/**
 * Get the last modification time for a route based on its page.tsx file
 */
async function getRouteModificationTime(route: string): Promise<Date | null> {
  // Map routes to their corresponding file paths
  const routeToPath: Record<string, string> = {
    '/': 'src/app/[locale]/page.tsx',
    '/dashboard': 'src/app/[locale]/dashboard/page.tsx',
    '/profile': 'src/app/[locale]/profile/page.tsx',
    '/settings': 'src/app/[locale]/settings/page.tsx',
  }

  const filePath = routeToPath[route]
  if (!filePath) {
    return null
  }

  try {
    const absolutePath = path.join(process.cwd(), filePath)
    const stats = await fs.stat(absolutePath)
    return stats.mtime
  } catch (error) {
    // If file doesn't exist or can't be accessed, return null
    console.warn(`Could not get modification time for ${filePath}:`, error)
    return null
  }
}

/**
 * Get modification times for all routes
 * Falls back to a default date if file doesn't exist
 */
export async function getRouteModificationTimes(
  routes: string[]
): Promise<RouteModificationTime[]> {
  const defaultDate = new Date('2024-01-01') // Default date for routes without files

  const modificationTimes = await Promise.all(
    routes.map(async route => {
      const lastModified = await getRouteModificationTime(route)
      return {
        route,
        lastModified: lastModified || defaultDate,
      }
    })
  )

  return modificationTimes
}

/**
 * Determine change frequency based on how recently the file was modified
 */
export function getChangeFrequency(lastModified: Date): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
  const now = new Date()
  const daysSinceModified = Math.floor((now.getTime() - lastModified.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceModified < 1) return 'hourly'
  if (daysSinceModified < 7) return 'daily'
  if (daysSinceModified < 30) return 'weekly'
  if (daysSinceModified < 365) return 'monthly'
  return 'yearly'
}