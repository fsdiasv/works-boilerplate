'use client'

import { motion } from 'framer-motion'
import { Heart, Home, Plus, Search, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState, useMemo } from 'react'
import type React from 'react'

import { cn } from '@/lib/utils'

import { useScrollVisibility, useSafeAreaInsets } from '../../hooks'
import type { NavigationItem } from '../../types'
import { triggerHapticFeedback, renderNavigationBadge } from '../../utils'

interface BottomTabNavigationProps {
  tabs?: NavigationItem[]
  className?: string
  onTabChange?: (tabId: string) => void
  hideOnScroll?: boolean
}

export function BottomTabNavigation({
  tabs,
  className,
  onTabChange,
  hideOnScroll = true,
}: BottomTabNavigationProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('common.navigation')
  const [activeTab, setActiveTab] = useState<string>('')
  const { isVisible } = useScrollVisibility({ hideOnScroll })
  const { paddingClasses } = useSafeAreaInsets()

  // Default tabs with translations
  const defaultTabs = useMemo<NavigationItem[]>(
    () => [
      {
        id: 'home',
        label: t('home'),
        icon: Home,
        href: '/',
      },
      {
        id: 'search',
        label: t('search'),
        icon: Search,
        href: '/search',
      },
      {
        id: 'create',
        label: t('create'),
        icon: Plus,
        href: '/create',
        isSpecial: true,
      },
      {
        id: 'favorites',
        label: t('favorites'),
        icon: Heart,
        href: '/favorites',
        badge: 3,
      },
      {
        id: 'profile',
        label: t('profile'),
        icon: User,
        href: '/profile',
      },
    ],
    [t]
  )

  const navigationTabs = tabs ?? defaultTabs

  // Set active tab based on pathname
  useEffect(() => {
    // Remove locale prefix from pathname for comparison
    const pathSegments = pathname.split('/')
    const pathnameWithoutLocale = `/${pathSegments.slice(2).join('/')}` || '/'

    const activeTabItem = navigationTabs.find(tab => {
      if (tab.href === '/') {
        return pathnameWithoutLocale === '/'
      }
      return pathnameWithoutLocale.startsWith(tab.href)
    })
    if (activeTabItem) {
      setActiveTab(activeTabItem.id)
    }
  }, [pathname, navigationTabs])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)
    triggerHapticFeedback('selection')
  }

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed right-0 bottom-0 left-0 z-50',
        paddingClasses.bottom,
        paddingClasses.left,
        paddingClasses.right,
        className
      )}
    >
      <div className='mx-auto max-w-lg'>
        <div
          className={cn(
            'flex items-center justify-around',
            'bg-background/80 mx-4 mb-2 rounded-2xl border backdrop-blur-lg',
            'shadow-lg shadow-black/5',
            'py-2'
          )}
        >
          {navigationTabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <Link
                key={tab.id}
                href={`/${locale}${tab.href === '/' ? '' : tab.href}`}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'relative flex flex-col items-center justify-center',
                  'min-h-[44px] min-w-[44px] px-3 py-2',
                  'rounded-xl transition-all duration-200',
                  'touch-manipulation select-none',
                  // Special tab styling (center action button)
                  tab.isSpecial === true && [
                    'h-12 w-12 rounded-full',
                    'bg-primary text-primary-foreground shadow-lg',
                    'hover:scale-105 active:scale-95',
                  ],
                  // Regular tab styling
                  tab.isSpecial !== true && [
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ]
                )}
              >
                {/* Active indicator */}
                {isActive && tab.isSpecial !== true && (
                  <motion.div
                    layoutId='activeTab'
                    className='bg-primary/10 absolute inset-0 rounded-xl'
                    transition={{ duration: 0.2 }}
                  />
                )}

                {/* Icon */}
                <div className='relative z-10'>
                  <Icon
                    className={cn(
                      'transition-all duration-200',
                      tab.isSpecial === true ? 'h-6 w-6' : 'h-5 w-5',
                      isActive && tab.isSpecial !== true && 'scale-110'
                    )}
                  />

                  {/* Badge */}
                  {renderNavigationBadge(tab.badge, 'absolute -top-2 -right-2')}
                </div>

                {/* Label */}
                {tab.isSpecial !== true && (
                  <span
                    className={cn(
                      'relative z-10 mt-1 text-xs font-medium transition-all duration-200',
                      isActive ? 'opacity-100' : 'opacity-70'
                    )}
                  >
                    {tab.label}
                  </span>
                )}

                {/* Touch feedback */}
                <motion.div
                  className='absolute inset-0 rounded-xl bg-current opacity-0'
                  whileTap={{ opacity: 0.1 }}
                  transition={{ duration: 0.1 }}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
