'use client'

import { motion } from 'framer-motion'
import { Home, Search, Heart, User, Plus } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

import { cn } from '@/lib/utils'

interface TabItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  badge?: number
  isSpecial?: boolean
}

interface BottomTabNavigationProps {
  tabs?: TabItem[]
  className?: string
  onTabChange?: (tabId: string) => void
}

const defaultTabs: TabItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
  },
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    href: '/search',
  },
  {
    id: 'create',
    label: 'Create',
    icon: Plus,
    href: '/create',
    isSpecial: true,
  },
  {
    id: 'favorites',
    label: 'Favorites',
    icon: Heart,
    href: '/favorites',
    badge: 3,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    href: '/profile',
  },
]

export function BottomTabNavigation({
  tabs = defaultTabs,
  className,
  onTabChange,
}: BottomTabNavigationProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<string>('')
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Handle scroll to hide/show navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - lastScrollY

      // Only hide if scrolling down and past threshold
      if (scrollDelta > 10 && currentScrollY > 100) {
        setIsVisible(false)
      } else if (scrollDelta < -10) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Set active tab based on pathname
  useEffect(() => {
    const activeTabItem = tabs.find(tab => {
      if (tab.href === '/') {
        return pathname === tab.href
      }
      return pathname.startsWith(tab.href)
    })
    if (activeTabItem) {
      setActiveTab(activeTabItem.id)
    }
  }, [pathname, tabs])

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    onTabChange?.(tabId)

    // Haptic feedback if available
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'fixed right-0 bottom-0 left-0 z-50',
        // PWA safe area support
        'pb-[max(8px,env(safe-area-inset-bottom))]',
        'pl-[max(0px,env(safe-area-inset-left))]',
        'pr-[max(0px,env(safe-area-inset-right))]',
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
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <Link
                key={tab.id}
                href={tab.href}
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
                  {tab.badge != null && tab.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'absolute -top-2 -right-2',
                        'flex h-5 min-w-[20px] items-center justify-center',
                        'bg-destructive text-destructive-foreground rounded-full px-1.5 text-xs font-medium'
                      )}
                    >
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </motion.div>
                  )}
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
