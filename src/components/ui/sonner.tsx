'use client'

import { useTheme } from 'next-themes'
import type React from 'react'
import { Toaster as Sonner, ToasterProps } from 'sonner'

function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()
  const validTheme = theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system'

  return (
    <Sonner
      theme={validTheme}
      className='toaster group'
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
