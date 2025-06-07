import { MetadataRoute } from 'next'

import { locales } from '@/i18n/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://localhost:3000'

  // Define your app routes here
  const routes = ['/', '/dashboard', '/profile', '/settings']

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Generate sitemap entries for each locale and route
  routes.forEach(route => {
    locales.forEach(locale => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route === '/' ? '' : route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
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
