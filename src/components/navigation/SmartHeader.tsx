'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SmartHeaderProps {
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
}: SmartHeaderProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { scrollY } = useScroll()

  // Transform values for blur effect
  const opacity = useTransform(scrollY, [0, 100], [0, 1])
  const backdropBlur = useTransform(scrollY, [0, 50], [0, 20])

  // Handle scroll behavior
  useEffect(() => {
    if (behavior !== 'hide-on-scroll') return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDelta = currentScrollY - lastScrollY

      // Hide header when scrolling down, show when scrolling up
      if (scrollDelta > 10 && currentScrollY > 100) {
        setIsVisible(false)
      } else if (scrollDelta < -10 || currentScrollY < 50) {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, behavior])

  const handleBackClick = () => {
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
        // PWA safe area support
        'pt-[max(0px,env(safe-area-inset-top))]',
        'pl-[max(16px,env(safe-area-inset-left))]',
        'pr-[max(16px,env(safe-area-inset-right))]',
        behaviorStyles[behavior],
        variantStyles[variant],
        className
      )}
      style={{
        ...(variant === 'blurred' && {
          backgroundColor: `rgba(var(--background), ${opacity.get()})`,
          backdropFilter: `blur(${backdropBlur.get()}px)`,
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
