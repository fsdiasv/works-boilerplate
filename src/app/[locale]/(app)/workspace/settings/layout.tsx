'use client'

import { Settings, Users, Mail, CreditCard, AlertTriangle, ChevronLeft, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Remove locale prefix from pathname for comparison
  const pathSegments = pathname.split('/')
  const pathnameWithoutLocale = `/${pathSegments.slice(2).join('/')}`

  if (!activeWorkspace) {
    return null
  }

  // Navigation component shared between mobile and desktop
  function NavigationContent() {
    return (
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
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'flex min-h-[44px] items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors',
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
    )
  }

  return (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='border-b px-4 py-4 md:px-6'>
        <div className='flex items-center gap-4'>
          {/* Mobile menu button */}
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon' className='h-10 w-10 md:hidden'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>{t('openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left' className='w-80 pt-10'>
              <div className='mb-6'>
                <h2 className='text-lg font-semibold'>{t('nav.title')}</h2>
              </div>
              <nav>
                <NavigationContent />
              </nav>
            </SheetContent>
          </Sheet>

          <Button variant='ghost' size='icon' asChild className='h-10 w-10'>
            <Link href={`/${locale}/dashboard`}>
              <ChevronLeft className='h-5 w-5' />
              <span className='sr-only'>{t('back')}</span>
            </Link>
          </Button>
          <div className='flex-1'>
            <h1 className='text-xl font-semibold md:text-2xl'>
              {t('title', { workspace: activeWorkspace.name })}
            </h1>
            <p className='text-muted-foreground hidden text-sm md:block'>{t('description')}</p>
          </div>
        </div>
      </div>

      <div className='flex flex-1 overflow-hidden'>
        {/* Desktop Sidebar Navigation */}
        <nav className='bg-muted/30 hidden w-64 border-r p-4 md:block'>
          <NavigationContent />
        </nav>

        {/* Content Area */}
        <div className='flex-1 overflow-y-auto'>
          <div className='p-4 md:p-6'>{children}</div>
        </div>
      </div>
    </div>
  )
}
