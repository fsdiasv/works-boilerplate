'use client'

import { toast } from 'sonner'

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  duration?: number
  variant?: 'default' | 'destructive'
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  return {
    toast: (props: ToastProps) => {
      const { title, description, variant, action, duration = 5000 } = props

      if (variant === 'destructive') {
        return toast.error(title, {
          description,
          duration,
          action: action
            ? {
                label: action.label,
                onClick: action.onClick,
              }
            : undefined,
        })
      }

      return toast.success(title ?? '', {
        description,
        duration,
        action: action
          ? {
              label: action.label,
              onClick: action.onClick,
            }
          : undefined,
      })
    },
    dismiss: (toastId?: string) => {
      if (toastId != null) {
        toast.dismiss(toastId)
      } else {
        toast.dismiss()
      }
    },
  }
}
