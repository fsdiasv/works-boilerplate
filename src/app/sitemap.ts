import { MetadataRoute } from 'next'

import { locales } from '@/i18n/config'
import { env } from '@/lib/env'
import { getRouteModificationTimes, getChangeFrequency } from 'src/lib/sitemap-utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_BASE_URL ?? 'https://localhost:3000'

  // Define your app routes here - only include routes that actually exist
  const routes = ['/']

  // Get actual modification times for all routes
  const routeModTimes = await getRouteModificationTimes(routes)
  const modTimeMap = new Map(routeModTimes.map(item => [item.route, item.lastModified]))

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Generate sitemap entries for each locale and route
  routes.forEach(route => {
    const lastModified = modTimeMap.get(route) ?? new Date('2024-01-01')
    const changeFrequency = getChangeFrequency(lastModified)

    locales.forEach(locale => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route === '/' ? '' : route}`,
        lastModified,
        changeFrequency,
        priority: route === '/' ? 1 : 0.8,
        alternates: {
          languages: Object.fromEntries(
            locales.map(lang => [lang, `${baseUrl}/${lang}${route === '/' ? '' : route}`])
          ),
        },
      })
    })
  })

  return sitemapEntries
}
