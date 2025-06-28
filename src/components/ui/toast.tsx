'use client'

import { toast as sonnerToast } from 'sonner'

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  duration?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export interface ToastActionElement {
  action: {
    label: string
    onClick: () => void
  }
}

export type ToasterToast = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
}

// Re-export sonner's toast methods for compatibility
export const toast = sonnerToast

export default toast
