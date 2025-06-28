'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'standalone' | 'fullscreen'
}

export function AppLayout({ children, className, variant = 'default' }: AppLayoutProps) {
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detect PWA standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(isStandaloneMode)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        // Base layout styles
        'flex min-h-screen w-full flex-col',
        // PWA safe area support
        'supports-[padding:max(0px)]:px-[max(16px,env(safe-area-inset-left))]',
        'supports-[padding:max(0px)]:pr-[max(16px,env(safe-area-inset-right))]',
        'supports-[padding:max(0px)]:pt-[max(0px,env(safe-area-inset-top))]',
        'supports-[padding:max(0px)]:pb-[max(0px,env(safe-area-inset-bottom))]',
        // Container queries support
        '@container/app',
        // Variant-specific styles
        {
          'bg-background text-foreground': variant === 'default',
          'bg-background text-foreground standalone:bg-gray-50 dark:standalone:bg-gray-900':
            variant === 'standalone',
          'h-screen overflow-hidden': variant === 'fullscreen',
        },
        // Standalone mode adjustments
        {
          'standalone:pt-0': isStandalone,
        },
        className
      )}
      data-standalone={isStandalone}
    >
      {children}
    </motion.div>
  )
}
