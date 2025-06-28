'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position='top-center'
      expand
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast: 'bg-background text-foreground border-border',
          title: 'text-foreground',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-muted-foreground',
          closeButton: 'bg-background text-muted-foreground',
        },
      }}
    />
  )
}
