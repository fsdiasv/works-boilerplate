'use client'

import { PanelLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

/**
 * A button to toggle the sidebar's collapsed state on desktop.
 * It is hidden on mobile.
 */
export function DesktopSidebarToggle({ className }: { className?: string }) {
  const { toggleSidebar, state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Button
      variant='ghost'
      size='icon'
      className={cn('bg-background/80 hidden h-8 w-8 backdrop-blur-sm md:flex', className)}
      onClick={toggleSidebar}
      aria-label='Toggle Sidebar'
    >
      <PanelLeft
        className={cn(
          'h-5 w-5 transition-transform duration-300 ease-in-out',
          !isCollapsed && 'rotate-180'
        )}
      />
    </Button>
  )
}
