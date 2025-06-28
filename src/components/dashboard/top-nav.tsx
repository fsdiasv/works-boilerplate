'use client'
import { Bell, PanelLeft } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

import { DashboardBreadcrumb } from './dashboard-breadcrumb'
import { UserSettingsMenu } from './user-settings-menu'

export function TopNav() {
  const { isMobile } = useSidebar()

  return (
    <header className='border-border bg-sw-content-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6'>
      {isMobile && (
        <SidebarTrigger asChild>
          <Button
            size='icon'
            variant='ghost'
            className='text-sw-text-secondary hover:text-sw-text-primary sm:hidden'
          >
            <PanelLeft className='h-5 w-5' />
            <span className='sr-only'>Toggle Menu</span>
          </Button>
        </SidebarTrigger>
      )}
      {/* Breadcrumb on the left side */}
      <DashboardBreadcrumb />
      <div className='flex-1'></div> {/* Pushes subsequent items to the right */}
      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          asChild
          className='text-sw-text-secondary hover:text-sw-text-primary'
        >
          <Link href='#'>
            <Bell className='h-[1.2rem] w-[1.2rem]' />
            <span className='sr-only'>Notifications</span>
          </Link>
        </Button>
        <UserSettingsMenu />
      </div>
    </header>
  )
}
