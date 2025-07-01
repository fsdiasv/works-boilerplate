'use client'

import { motion } from 'framer-motion'

import { isStandalone as checkIsStandalone } from '@/lib/pwa'
import { cn } from '@/lib/utils'

interface PWALayoutProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'standalone' | 'fullscreen'
}

/**
 * PWALayout - A responsive layout component optimized for Progressive Web Apps
 *
 * This component provides:
 * - Automatic PWA standalone mode detection
 * - Safe area padding for devices with notches/rounded corners
 * - Smooth fade-in animations
 * - Container query support
 * - Variant-based styling for different layout modes
 */
export function PWALayout({ children, className, variant = 'default' }: PWALayoutProps) {
  const isStandaloneMode = checkIsStandalone()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        // Base layout styles
        'flex min-h-screen w-full flex-col',

        /**
         * PWA Safe Area Support
         * These styles ensure proper padding for devices with notches or rounded corners.
         * Uses CSS environment variables to respect device-specific safe areas:
         * - safe-area-inset-left/right: Handles side notches (landscape orientation)
         * - safe-area-inset-top: Handles top notch/status bar area
         * - safe-area-inset-bottom: Handles bottom home indicator area
         * The max() function ensures minimum 16px padding even without safe areas.
         * The supports query ensures these styles only apply on compatible browsers.
         */
        'supports-[padding:max(0px)]:px-[max(16px,env(safe-area-inset-left))]',
        'supports-[padding:max(0px)]:pr-[max(16px,env(safe-area-inset-right))]',
        'supports-[padding:max(0px)]:pt-[max(0px,env(safe-area-inset-top))]',
        'supports-[padding:max(0px)]:pb-[max(0px,env(safe-area-inset-bottom))]',

        /**
         * Container Queries Support
         * Enables this element to be a container for container queries,
         * allowing child components to style themselves based on this
         * container's dimensions rather than the viewport.
         */
        '@container/app',

        /**
         * Variant-Specific Styles
         * Different visual treatments based on the layout variant:
         * - default: Standard background and text colors
         * - standalone: Special PWA-specific styling with light/dark mode support
         * - fullscreen: Full viewport height with hidden overflow for immersive views
         */
        {
          'bg-background text-foreground': variant === 'default',
          'bg-background text-foreground standalone:bg-gray-50 dark:standalone:bg-gray-900':
            variant === 'standalone',
          'h-screen overflow-hidden': variant === 'fullscreen',
        },

        /**
         * PWA Standalone Mode Adjustments
         * Removes top padding when running as an installed PWA to maximize
         * screen real estate since the browser chrome is not present.
         */
        {
          'standalone:pt-0': isStandaloneMode,
        },

        className
      )}
      data-standalone={isStandaloneMode}
    >
      {children}
    </motion.div>
  )
}
