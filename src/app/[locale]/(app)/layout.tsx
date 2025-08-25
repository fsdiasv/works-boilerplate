import dynamic from 'next/dynamic'
import type React from 'react'

import { SidebarProvider } from '@/components/ui/sidebar'
import { WorkspaceProvider } from '@/contexts/workspace-context'

// Lazy load heavy components to reduce initial layout bundle
const AppSidebar = dynamic(
  () => import('@/components/dashboard/app-sidebar').then(mod => ({ default: mod.AppSidebar })),
  {
    ssr: true, // Keep SSR for sidebar to maintain layout
    loading: () => (
      <div className='bg-sw-sidebar-background border-border w-64 animate-pulse border-r'>
        <div className='p-4'>
          <div className='mb-4 h-8 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='space-y-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='h-10 rounded bg-gray-200 dark:bg-gray-700'></div>
            ))}
          </div>
        </div>
      </div>
    ),
  }
)

const TopNav = dynamic(
  () => import('@/components/dashboard/top-nav').then(mod => ({ default: mod.TopNav })),
  {
    ssr: true,
    loading: () => (
      <div className='bg-sw-content-background border-border h-16 animate-pulse border-b'>
        <div className='flex items-center justify-between p-4'>
          <div className='h-6 w-32 rounded bg-gray-200 dark:bg-gray-700'></div>
          <div className='h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700'></div>
        </div>
      </div>
    ),
  }
)

const PageTransitionWrapper = dynamic(
  () =>
    import('@/components/dashboard/page-transition-wrapper').then(mod => ({
      default: mod.PageTransitionWrapper,
    })),
  {
    loading: () => (
      <div className='animate-pulse'>
        <div className='h-96 rounded bg-gray-200 dark:bg-gray-700'></div>
      </div>
    ),
  }
)

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <WorkspaceProvider>
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
    </WorkspaceProvider>
  )
}
