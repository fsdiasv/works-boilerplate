import type React from 'react'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { PageTransitionWrapper } from '@/components/dashboard/page-transition-wrapper'
import { TopNav } from '@/components/dashboard/top-nav'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className='bg-sw-content-background flex h-screen w-full overflow-hidden'>
        <AppSidebar />
        <div className='bg-sw-content-background flex flex-1 flex-col overflow-hidden'>
          <TopNav />
          <main className='bg-sw-content-background flex-1 overflow-y-auto p-4 sm:p-6'>
            <PageTransitionWrapper>{children}</PageTransitionWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
