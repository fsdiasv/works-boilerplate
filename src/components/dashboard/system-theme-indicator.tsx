'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function SystemThemeIndicator() {
  const { theme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Only show when system theme is active
  if (theme !== 'system') {
    return null
  }

  const getSystemIcon = () => {
    if (systemTheme === 'dark') {
      return <Moon className='h-3 w-3' />
    }
    return <Sun className='h-3 w-3' />
  }

  const getSystemLabel = () => {
    return systemTheme === 'dark' ? 'System (Dark)' : 'System (Light)'
  }

  return (
    <div className='text-sw-text-tertiary flex items-center gap-1 text-xs'>
      <Monitor className='h-3 w-3' />
      {getSystemIcon()}
      <span className='hidden sm:inline'>{getSystemLabel()}</span>
    </div>
  )
}
