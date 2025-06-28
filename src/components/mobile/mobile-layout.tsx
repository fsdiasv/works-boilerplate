'use client'

import { Home, Search, Plus, Bell, User, Menu, Settings, HelpCircle, LogOut } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React, { useState, useEffect } from 'react'

import { PullToRefresh } from '@/components/mobile/pull-to-refresh'
import { BottomTabNavigation } from '@/components/navigation/components/BottomTabNavigation'
import { DrawerNavigation } from '@/components/navigation/components/DrawerNavigation'
import { SmartHeader } from '@/components/navigation/components/SmartHeader'
import { NavigationProvider } from '@/components/navigation/context/NavigationContext'
import { Button } from '@/components/ui/button'
import { useNavigationPersistence } from '@/hooks/use-navigation-persistence'
import { usePWAFeatures } from '@/hooks/use-pwa-features'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: React.ReactNode
  onRefresh?: () => Promise<void>
  showBottomNav?: boolean
  showHeader?: boolean
  headerVariant?: 'default' | 'transparent' | 'blurred' | 'minimal'
  hideHeaderOnScroll?: boolean
}

export function MobileLayout({
  children,
  onRefresh,
  showBottomNav = true,
  showHeader = true,
  headerVariant = 'default',
  hideHeaderOnScroll = true,
}: MobileLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [notificationCount] = useState(3)
  const { saveScrollPosition } = useNavigationPersistence()
  const { safeAreaInsets, isPWA, vibrate } = usePWAFeatures()
  const t = useTranslations()

  // Navigation items for bottom tabs
  const bottomNavItems = [
    {
      id: 'dashboard',
      href: '/dashboard',
      icon: Home,
      label: t('common.navigation.home'),
    },
    {
      id: 'search',
      href: '/search',
      icon: Search,
      label: t('common.navigation.search'),
    },
    {
      id: 'create',
      href: '/create',
      icon: Plus,
      label: t('common.navigation.create'),
      isSpecial: true,
    },
    {
      id: 'notifications',
      href: '/notifications',
      icon: Bell,
      label: t('common.navigation.notifications'),
      badge: notificationCount > 0 ? notificationCount : 0,
    },
    {
      id: 'profile',
      href: '/profile',
      icon: User,
      label: t('common.navigation.profile'),
    },
  ]

  // Navigation items for drawer
  const drawerNavItems = [
    {
      title: t('common.navigation.main'),
      items: [
        { icon: Home, label: t('common.navigation.dashboard'), href: '/dashboard' },
        { icon: Search, label: t('common.navigation.search'), href: '/search' },
        {
          icon: Bell,
          label: t('common.navigation.notifications'),
          href: '/notifications',
          badge: notificationCount,
        },
      ],
    },
    {
      title: t('common.navigation.account'),
      items: [
        { icon: User, label: t('common.navigation.profile'), href: '/profile' },
        { icon: Settings, label: t('common.navigation.settings'), href: '/settings' },
      ],
    },
    {
      title: t('common.navigation.support'),
      items: [
        { icon: HelpCircle, label: t('common.navigation.help'), href: '/help' },
        { icon: LogOut, label: t('common.navigation.logout'), href: '/logout' },
      ],
    },
  ]

  // Handle refresh with haptic feedback
  const handleRefresh = async () => {
    vibrate([10, 50, 10])
    if (onRefresh) {
      await onRefresh()
    } else {
      // Default refresh behavior
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }

  // Save scroll position before navigation
  useEffect(() => {
    const handleBeforeUnload = () => saveScrollPosition()
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [saveScrollPosition])

  return (
    <NavigationProvider>
      <div
        className={cn('bg-background flex h-full flex-col', isPWA && 'pwa-standalone')}
        style={{
          paddingTop: safeAreaInsets.top,
          paddingBottom: showBottomNav ? 0 : safeAreaInsets.bottom,
        }}
      >
        {/* Header */}
        {showHeader && (
          <SmartHeader
            variant={headerVariant}
            hideOnScroll={hideHeaderOnScroll}
            leftAction={
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setIsDrawerOpen(true)}
                className='h-10 w-10 p-0'
              >
                <Menu className='h-5 w-5' />
                <span className='sr-only'>{t('common.navigation.menu')}</span>
              </Button>
            }
            title={t('app.name')}
          />
        )}

        {/* Main content with pull-to-refresh */}
        <div className='flex-1 overflow-hidden'>
          <PullToRefresh onRefresh={handleRefresh} threshold={80} className='h-full'>
            <main className='h-full'>{children}</main>
          </PullToRefresh>
        </div>

        {/* Bottom navigation */}
        {showBottomNav && (
          <div
            style={{
              paddingBottom: safeAreaInsets.bottom,
            }}
          >
            <BottomTabNavigation
              tabs={bottomNavItems}
              onTabChange={() => {
                vibrate(5)
                // Navigation would be handled by the component
              }}
              hideOnScroll={false}
            />
          </div>
        )}

        {/* Drawer navigation */}
        <DrawerNavigation isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)}>
          <div className='p-4'>
            <h2 className='mb-4 text-lg font-semibold'>{t('common.navigation.menu')}</h2>
            {drawerNavItems.map(section => (
              <div key={section.title} className='mb-6'>
                <h3 className='text-muted-foreground mb-2 text-sm font-medium'>{section.title}</h3>
                <div className='space-y-1'>
                  {section.items.map(item => (
                    <a
                      key={item.href}
                      href={item.href}
                      className='hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors'
                    >
                      <item.icon className='h-5 w-5' />
                      <span className='flex-1'>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className='bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs'>
                          {item.badge}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DrawerNavigation>
      </div>
    </NavigationProvider>
  )
}
