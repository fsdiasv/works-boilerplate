'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useSafeAreaInsets } from '../../hooks/useSafeAreaInsets'
import { useScrollVisibility } from '../../hooks/useScrollVisibility'
import type { NavigationBehavior } from '../../types'
import { triggerHapticFeedback } from '../../utils/haptics'

interface SmartHeaderProps extends Partial<NavigationBehavior> {
  title?: string
  subtitle?: string
  showBackButton?: boolean
  onBackClick?: () => void
  leftAction?: React.ReactNode
  rightAction?: React.ReactNode
  variant?: 'default' | 'transparent' | 'blurred' | 'minimal'
  behavior?: 'sticky' | 'hide-on-scroll' | 'static'
  className?: string
  children?: React.ReactNode
}

export function SmartHeader({
  title,
  subtitle,
  showBackButton = false,
  onBackClick,
  leftAction,
  rightAction,
  variant = 'default',
  behavior = 'sticky',
  className,
  children,
  hideOnScroll,
  scrollThreshold,
  animationDuration,
  enableHapticFeedback = true,
}: SmartHeaderProps) {
  const router = useRouter()
  const { scrollY } = useScroll()
  const { paddingClasses } = useSafeAreaInsets({ includePadding: true })

  // Use the shared scroll visibility hook
  const { isVisible } = useScrollVisibility({
    hideOnScroll: hideOnScroll ?? behavior === 'hide-on-scroll',
    scrollThreshold: scrollThreshold ?? 10,
    animationDuration: animationDuration ?? 300,
    initialVisible: true,
  })

  // Transform values for blur effect - create complete CSS values
  const backgroundOpacity = useTransform(scrollY, [0, 100], [0, 1])
  const backdropBlurValue = useTransform(scrollY, [0, 50], [`blur(0px)`, `blur(50px)`])
  const backgroundColorValue = useTransform(
    backgroundOpacity,
    [0, 1],
    [`rgba(var(--background), 0)`, `rgba(var(--background), 1)`]
  )

  // Remove the manual scroll behavior as it's handled by useScrollVisibility hook

  const handleBackClick = () => {
    if (enableHapticFeedback) {
      triggerHapticFeedback('selection')
    }
    if (onBackClick) {
      onBackClick()
    } else {
      router.back()
    }
  }

  const variantStyles = {
    default: 'bg-background/95 border-b backdrop-blur-sm',
    transparent: 'bg-transparent',
    blurred: 'bg-background/80 backdrop-blur-lg border-b border-border/50',
    minimal: 'bg-background',
  }

  const behaviorStyles = {
    sticky: 'sticky top-0 z-40',
    'hide-on-scroll': 'fixed top-0 left-0 right-0 z-40',
    static: 'relative',
  }

  return (
    <motion.header
      initial={behavior === 'hide-on-scroll' ? { y: 0 } : false}
      animate={behavior === 'hide-on-scroll' ? { y: isVisible ? 0 : -100 } : false}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'flex h-16 items-center justify-between px-4',
        // PWA safe area support using the hook
        paddingClasses.top,
        'pl-4', // Base padding, safe area is added by the hook
        'pr-4', // Base padding, safe area is added by the hook
        paddingClasses.left,
        paddingClasses.right,
        behaviorStyles[behavior],
        variantStyles[variant],
        className
      )}
      style={{
        ...(variant === 'blurred' && {
          backgroundColor: backgroundColorValue,
          backdropFilter: backdropBlurValue,
        }),
      }}
    >
      {/* Left side */}
      <div className='flex items-center gap-2'>
        {showBackButton && (
          <Button
            variant='ghost'
            size='icon'
            onClick={handleBackClick}
            className='h-10 w-10 rounded-full'
          >
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>Go back</span>
          </Button>
        )}
        {leftAction != null && !showBackButton && leftAction}
      </div>

      {/* Center content */}
      <div className='flex-1 px-4'>
        {children ?? (
          <div className='flex flex-col items-center text-center'>
            {title != null && title.length > 0 && (
              <h1 className='truncate text-base leading-none font-semibold'>{title}</h1>
            )}
            {subtitle != null && subtitle.length > 0 && (
              <p className='text-muted-foreground truncate text-sm'>{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className='flex items-center gap-2'>
        {rightAction ?? (
          <Button variant='ghost' size='icon' className='h-10 w-10 rounded-full'>
            <MoreVertical className='h-5 w-5' />
            <span className='sr-only'>More options</span>
          </Button>
        )}
      </div>
    </motion.header>
  )
}

// Search header variant
interface SearchHeaderProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
  className?: string
}

export function SearchHeader({
  placeholder = 'Search...',
  value,
  onChange,
  onSubmit,
  className = '',
}: SearchHeaderProps) {
  const [searchValue, setSearchValue] = useState(value ?? '')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit?.(searchValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchValue(newValue)
    onChange?.(newValue)
  }

  return (
    <SmartHeader
      variant='blurred'
      behavior='sticky'
      className={className}
      leftAction={
        <Button
          variant='ghost'
          size='icon'
          onClick={() => router.back()}
          className='h-10 w-10 rounded-full'
        >
          <ArrowLeft className='h-5 w-5' />
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className='w-full'>
        <input
          type='text'
          value={searchValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'bg-muted w-full rounded-full border-0 px-4 py-2',
            'placeholder:text-muted-foreground text-sm',
            'focus:ring-primary focus:ring-2 focus:ring-offset-2 focus:outline-none',
            'min-h-[44px] touch-manipulation'
          )}
        />
      </form>
    </SmartHeader>
  )
}
