'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useGesture } from 'react-use-gesture'

import { Button } from '@/components/ui/button'
import { cn } from 'src/lib/utils'

interface DrawerNavigationProps {
  isOpen: boolean
  onClose: () => void
  side?: 'left' | 'right'
  children: React.ReactNode
  className?: string
  overlayClassName?: string
  width?: number
  enableSwipeToClose?: boolean
  closeOnOverlayClick?: boolean
}

export function DrawerNavigation({
  isOpen,
  onClose,
  side = 'left',
  children,
  className,
  overlayClassName,
  width = 280,
  enableSwipeToClose = true,
  closeOnOverlayClick = true,
}: DrawerNavigationProps) {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  const handleDrag = useCallback(
    (movement: [number, number]) => {
      if (!enableSwipeToClose) return

      const [mx] = movement
      const threshold = width * 0.3

      if (side === 'left') {
        // Swiping left to close
        if (mx < 0) {
          setDragOffset(Math.max(mx, -threshold))
        } else {
          setDragOffset(0)
        }
      } else {
        // Swiping right to close
        if (mx > 0) {
          setDragOffset(Math.min(mx, threshold))
        } else {
          setDragOffset(0)
        }
      }
    },
    [enableSwipeToClose, side, width]
  )

  const handleDragEnd = useCallback(
    (movement: [number, number], velocity: [number, number]) => {
      if (!enableSwipeToClose) return

      const [mx] = movement
      const [vx] = velocity
      const threshold = width * 0.3
      const velocityThreshold = 500

      const shouldClose =
        (side === 'left' && (mx < -threshold || vx < -velocityThreshold)) ||
        (side === 'right' && (mx > threshold || vx > velocityThreshold))

      if (shouldClose) {
        onClose()
      }

      setDragOffset(0)
      setIsDragging(false)
    },
    [enableSwipeToClose, onClose, side, width]
  )

  const bind = useGesture(
    {
      onDrag: ({ movement, dragging }) => {
        setIsDragging(dragging)
        handleDrag(movement as unknown as [number, number])
      },
      onDragEnd: ({ movement, velocity }) => {
        handleDragEnd(
          movement as unknown as [number, number],
          velocity as unknown as [number, number]
        )
      },
    },
    {
      drag: {
        axis: 'x',
        bounds: {
          left: side === 'left' ? -width * 0.3 : 0,
          right: side === 'right' ? width * 0.3 : 0,
        },
        rubberband: true,
      },
    }
  )

  const drawerVariants = {
    closed: {
      x: side === 'left' ? -width : width,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
  }

  const overlayVariants = {
    closed: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
    open: {
      opacity: 1,
      transition: {
        duration: 0.2,
      },
    },
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial='closed'
            animate='open'
            exit='closed'
            variants={overlayVariants}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm', overlayClassName)}
          />

          {/* Drawer */}
          <motion.div
            initial='closed'
            animate='open'
            exit='closed'
            variants={drawerVariants}
            {...(enableSwipeToClose ? bind() : {})}
            style={{
              x: dragOffset,
              width,
            }}
            className={cn(
              'bg-background fixed top-0 z-50 h-full shadow-xl',
              side === 'left' ? 'left-0' : 'right-0',
              // PWA safe area support
              'pt-[max(0px,env(safe-area-inset-top))]',
              'pb-[max(0px,env(safe-area-inset-bottom))]',
              side === 'left'
                ? 'pl-[max(0px,env(safe-area-inset-left))]'
                : 'pr-[max(0px,env(safe-area-inset-right))]',
              className
            )}
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b p-4'>
              <h2 className='text-lg font-semibold'>Menu</h2>
              <Button
                variant='ghost'
                size='icon'
                onClick={onClose}
                className='h-8 w-8 rounded-full'
              >
                <X className='h-4 w-4' />
                <span className='sr-only'>Close menu</span>
              </Button>
            </div>

            {/* Content */}
            <div className='flex-1 overflow-auto'>{children}</div>

            {/* Drag indicator */}
            {enableSwipeToClose && (
              <div
                className={cn(
                  'bg-muted-foreground/20 absolute top-1/2 h-12 w-1 rounded-full',
                  '-translate-y-1/2 transform',
                  side === 'left' ? 'right-0' : 'left-0',
                  isDragging && 'bg-primary/40'
                )}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Navigation items component for the drawer
export interface NavItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  badge?: number
  disabled?: boolean
}

interface DrawerNavItemsProps {
  items: NavItem[]
  onItemClick?: (item: NavItem) => void
  className?: string
}

export function DrawerNavItems({ items, onItemClick, className }: DrawerNavItemsProps) {
  return (
    <nav className={cn('p-4', className)}>
      <ul className='space-y-2'>
        {items.map(item => {
          const Icon = item.icon

          return (
            <li key={item.id}>
              <button
                onClick={() => {
                  if (item.onClick) {
                    item.onClick()
                  } else if (onItemClick) {
                    onItemClick(item)
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-3',
                  'text-left transition-colors',
                  'min-h-[44px] touch-manipulation',
                  item.disabled === true
                    ? 'cursor-not-allowed opacity-50'
                    : 'hover:bg-muted focus:bg-muted focus:outline-none'
                )}
              >
                {Icon && <Icon className='h-5 w-5 shrink-0' />}
                <span className='flex-1 font-medium'>{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className='bg-destructive text-destructive-foreground flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium'>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
