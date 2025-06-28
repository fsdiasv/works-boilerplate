'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

// Mapping of routes to breadcrumb information (without locale prefix)
const routeMap: Record<string, { title: string; href?: string }[]> = {
  '/': [{ title: 'Dashboard' }],
  '/dashboard': [{ title: 'Dashboard' }],
  '/faturamento': [{ title: 'Dashboard', href: '/' }, { title: 'Faturamento' }],
  '/radar': [{ title: 'Dashboard', href: '/' }, { title: 'Radar de Conteúdo' }],
  '/criar-post': [{ title: 'Dashboard', href: '/' }, { title: 'Criar Post' }],
  '/calendario': [{ title: 'Dashboard', href: '/' }, { title: 'Calendário' }],
  '/perfil': [{ title: 'Dashboard', href: '/' }, { title: 'Perfil' }],
  '/contas-sociais': [{ title: 'Dashboard', href: '/' }, { title: 'Contas Sociais' }],
  '/chaves-api': [{ title: 'Dashboard', href: '/' }, { title: 'Chaves de API' }],
  '/settings': [{ title: 'Dashboard', href: '/' }, { title: 'Configurações' }],
  '/pricing': [{ title: 'Dashboard', href: '/' }, { title: 'Preços' }],
  '/documentation': [{ title: 'Dashboard', href: '/' }, { title: 'Documentação' }],
  '/community': [{ title: 'Dashboard', href: '/' }, { title: 'Comunidade' }],
  '/feedback': [{ title: 'Dashboard', href: '/' }, { title: 'Feedback' }],
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const locale = useLocale()

  // Remove locale prefix from pathname for route lookup
  const pathSegments = pathname.split('/')
  const pathnameWithoutLocale = `/${pathSegments.slice(2).join('/')}` || '/'

  // Get breadcrumb items for current path, fallback to Dashboard if not found
  const breadcrumbItems = routeMap[pathnameWithoutLocale] ?? [{ title: 'Dashboard' }]

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
                      {item.title}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={href ?? `/${locale}/dashboard`}
                        className='text-sw-text-tertiary hover:text-sw-text-primary transition-colors'
                      >
                        {item.title}
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
