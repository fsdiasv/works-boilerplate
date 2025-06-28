'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

// Mapping of routes to translation keys (without locale prefix)
const routeMap: Record<string, { titleKey: string; href?: string }[]> = {
  '/': [{ titleKey: 'dashboard' }],
  '/dashboard': [{ titleKey: 'dashboard' }],
  '/faturamento': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'billing' }],
  '/radar': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'contentRadar' }],
  '/criar-post': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'createPost' }],
  '/calendario': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'calendar' }],
  '/perfil': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'profile' }],
  '/contas-sociais': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'socialAccounts' }],
  '/chaves-api': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'apiKeys' }],
  '/settings': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'settings' }],
  '/pricing': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'pricing' }],
  '/documentation': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'documentation' }],
  '/community': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'community' }],
  '/feedback': [{ titleKey: 'dashboard', href: '/' }, { titleKey: 'feedback' }],
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('common.navigation')

  // Remove locale prefix from pathname for route lookup
  const pathSegments = pathname.split('/')
  const pathnameWithoutLocale = `/${pathSegments.slice(2).join('/')}` || '/'

  // Get breadcrumb items for current path, fallback to Dashboard if not found
  const breadcrumbItems = routeMap[pathnameWithoutLocale] ?? [{ titleKey: 'dashboard' }]

  // Don't show breadcrumb on mobile to save space
  return (
    <div className='hidden sm:flex'>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1
            // Add locale prefix to href
            const href =
              item.href != null
                ? `/${locale}${item.href === '/' ? '/dashboard' : item.href}`
                : undefined

            return (
              <div key={index} className='flex items-center'>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className='text-sw-text-primary font-medium'>
                      {t(item.titleKey)}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={href ?? `/${locale}/dashboard`}
                        className='text-sw-text-tertiary hover:text-sw-text-primary transition-colors'
                      >
                        {t(item.titleKey)}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className='text-sw-text-tertiary h-4 w-4' />
                  </BreadcrumbSeparator>
                )}
              </div>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
