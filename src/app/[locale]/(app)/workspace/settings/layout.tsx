'use client'

import { Settings, Users, Mail, CreditCard, AlertTriangle, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type React from 'react'

import { Button } from '@/components/ui/button'
import { useWorkspace } from '@/contexts/workspace-context'
import { cn } from '@/lib/utils'

const settingsNav = [
  {
    href: '/workspace/settings',
    icon: Settings,
    labelKey: 'general',
    exact: true,
  },
  {
    href: '/workspace/settings/members',
    icon: Users,
    labelKey: 'members',
  },
  {
    href: '/workspace/settings/invitations',
    icon: Mail,
    labelKey: 'invitations',
  },
  {
    href: '/workspace/settings/billing',
    icon: CreditCard,
    labelKey: 'billing',
    disabled: true, // Placeholder for now
  },
  {
    href: '/workspace/settings/danger',
    icon: AlertTriangle,
    labelKey: 'dangerZone',
    className: 'text-destructive',
  },
]

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('workspace.settings')
  const { activeWorkspace } = useWorkspace()

  // Remove locale prefix from pathname for comparison
  const pathSegments = pathname.split('/')
  const pathnameWithoutLocale = `/${pathSegments.slice(2).join('/')}`

  if (!activeWorkspace) {
    return null
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='border-b px-6 py-4'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild className='h-8 w-8'>
            <Link href={`/${locale}/dashboard`}>
              <ChevronLeft className='h-4 w-4' />
              <span className='sr-only'>{t('back')}</span>
            </Link>
          </Button>
          <div>
            <h1 className='text-2xl font-semibold'>
              {t('title', { workspace: activeWorkspace.name })}
            </h1>
            <p className='text-muted-foreground text-sm'>{t('description')}</p>
          </div>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar Navigation */}
        <nav className='bg-muted/30 w-64 border-r p-4'>
          <ul className='space-y-1'>
            {settingsNav.map(item => {
              const isActive =
                item.exact === true
                  ? pathnameWithoutLocale === item.href
                  : pathnameWithoutLocale.startsWith(item.href)

              return (
                <li key={item.labelKey}>
                  <Link
                    href={`/${locale}${item.href}`}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      isActive && 'bg-accent text-accent-foreground',
                      item.disabled === true && 'pointer-events-none opacity-50',
                      item.className
                    )}
                  >
                    <item.icon className='h-4 w-4' />
                    {t(`nav.${item.labelKey}`)}
                    {item.disabled === true && (
                      <span className='text-muted-foreground ml-auto text-xs'>
                        {t('nav.comingSoon')}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto'>
          <div className='p-6'>{children}</div>
        </div>
      </div>
    </div>
  )
}
