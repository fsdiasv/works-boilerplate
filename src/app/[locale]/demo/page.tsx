'use client'

import { Bell, Heart, Home, Menu, Plus, Search, Settings, User } from 'lucide-react'
import { useState } from 'react'

// TODO: Create these demo components
// import { CoreFeaturesSection } from '@/components/demo/CoreFeaturesSection'
// import { FluidTypographySection } from '@/components/demo/FluidTypographySection'
// import { UiComponentsSection } from '@/components/demo/UiComponentsSection'
import { Typography } from '@/components/layout'
import { PerformanceMonitor } from '@/components/monitoring/PerformanceMonitor'
import { BottomTabNavigation } from '@/components/navigation/BottomTabNavigation'
import {
  DrawerNavItems,
  DrawerNavigation,
  type NavItem,
} from '@/components/navigation/DrawerNavigation'
import { SmartHeader } from '@/components/navigation/SmartHeader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function DemoPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'demo', label: 'Demo', href: '/demo', icon: Settings },
    { id: 'about', label: 'About', href: '/about', icon: User },
  ]

  const bottomTabs = [
    { id: 'home', label: 'Home', href: '/', icon: Home },
    { id: 'search', label: 'Search', href: '/search', icon: Search },
    { id: 'add', label: 'Add', href: '/add', icon: Plus, isSpecial: true },
    { id: 'notifications', label: 'Alerts', href: '/notifications', icon: Bell, badge: 3 },
    { id: 'profile', label: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <div className='bg-background flex min-h-screen flex-col'>
      <PerformanceMonitor>
        <SmartHeader
          title='Layout Demo'
          leftAction={
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsDrawerOpen(true)}
              className='h-10 w-10 rounded-full'
            >
              <Menu className='h-5 w-5' />
              <span className='sr-only'>Open menu</span>
            </Button>
          }
          rightAction={
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='icon' className='h-10 w-10 rounded-full'>
                <Heart className='h-5 w-5' />
                <span className='sr-only'>Favorites</span>
              </Button>
              <Avatar className='h-8 w-8'>
                <AvatarImage src='/placeholder-avatar.jpg' alt='User' />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          }
        />

        <main className='flex-1'>
          <div className='container mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
            <section className='mb-12 text-center'>
              <Typography variant='h1' responsive className='mb-2 font-bold'>
                Works Boilerplate
              </Typography>
              <Typography color='muted' size='lg' responsive>
                Modern mobile-first PWA with shadcn/ui components
              </Typography>
            </section>

            {/* TODO: Uncomment when demo components are created */}
            {/* <CoreFeaturesSection /> */}
            <Separator className='my-8' />
            {/* <UiComponentsSection onOpenDrawer={() => setIsDrawerOpen(true)} /> */}
            <Separator className='my-8' />
            {/* <FluidTypographySection /> */}
          </div>
        </main>

        <BottomTabNavigation
          tabs={bottomTabs}
          onTabChange={() => {
            // Handle tab change
          }}
          className='bg-background/95 border-t backdrop-blur-sm'
        />

        <DrawerNavigation isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} side='left'>
          <div className='p-6'>
            <div className='mb-6 flex items-center gap-3'>
              <Avatar className='h-12 w-12'>
                <AvatarImage src='/placeholder-avatar.jpg' alt='User' />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p className='font-semibold'>John Doe</p>
                <p className='text-muted-foreground text-sm'>john@example.com</p>
              </div>
            </div>
            <Separator className='mb-6' />
            <DrawerNavItems items={navItems} onItemClick={() => setIsDrawerOpen(false)} />
          </div>
        </DrawerNavigation>
      </PerformanceMonitor>
    </div>
  )
}
