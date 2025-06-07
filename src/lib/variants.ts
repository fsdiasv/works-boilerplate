import { cva, type VariantProps } from 'class-variance-authority'

/**
 * Button component variants with mobile-first design
 *
 * Provides consistent button styling with touch-optimized targets
 * and accessibility features.
 */
export const buttonVariants = cva(
  // Base styles with mobile-first approach
  [
    'inline-flex items-center justify-center',
    'min-h-touch min-w-touch', // 44px minimum touch target
    'rounded-md text-sm font-medium',
    'transition-colors duration-200',
    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
    // Touch feedback
    'transition-transform duration-75 active:scale-95',
    // Prevent text selection on touch
    'select-none',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border-input bg-background hover:bg-accent hover:text-accent-foreground border',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary min-h-auto min-w-auto underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        // Mobile-specific sizes
        'touch-sm': 'min-h-touch px-3 py-2 text-xs',
        'touch-lg': 'min-h-touch-lg px-6 py-3 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
)

/**
 * Input component variants with mobile optimizations
 */
export const inputVariants = cva(
  [
    'border-input flex w-full rounded-md border',
    'bg-background px-3 py-2',
    'min-h-touch', // Ensure touch target
    'ring-offset-background text-sm',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
    'placeholder:text-muted-foreground',
    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'disabled:cursor-not-allowed disabled:opacity-50',
    // Prevent zoom on iOS
    'text-no-zoom',
  ],
  {
    variants: {
      variant: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        default: 'h-10',
        sm: 'h-9 px-2 text-xs',
        lg: 'h-11 px-4',
        // Mobile-optimized sizes
        touch: 'min-h-touch px-4 py-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Card component variants for content containers
 */
export const cardVariants = cva(
  ['bg-card text-card-foreground rounded-lg border shadow-sm', 'transition-shadow duration-200'],
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-md hover:shadow-lg',
        glass: 'glass',
        outline: 'border-2',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        // Mobile-optimized padding
        touch: 'p-4 sm:p-6',
      },
      interactive: {
        true: 'cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      interactive: false,
    },
  }
)

/**
 * Badge component variants
 */
export const badgeVariants = cva(
  [
    'inline-flex items-center rounded-full border px-2.5 py-0.5',
    'text-xs font-semibold transition-colors',
    'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
  ],
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80 border-transparent',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
        warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
      },
      size: {
        default: 'text-xs',
        sm: 'px-2 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

/**
 * Avatar component variants
 */
export const avatarVariants = cva(
  [
    'relative flex shrink-0 overflow-hidden rounded-full',
    'bg-muted',
    // Touch target for interactive avatars
    'min-h-touch min-w-touch',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 min-h-8 w-8 min-w-8',
        default: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        // Mobile-optimized sizes
        touch: 'h-11 w-11', // 44px minimum
        'touch-lg': 'h-14 w-14', // 56px comfortable
      },
      interactive: {
        true: 'cursor-pointer transition-opacity duration-200 hover:opacity-80 active:scale-95',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      interactive: false,
    },
  }
)

/**
 * Alert component variants
 */
export const alertVariants = cva(
  [
    'relative w-full rounded-lg border p-4',
    '[&>svg]:text-foreground [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7',
  ],
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success: 'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-600',
        warning:
          'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-600',
        info: 'border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Export types for component props
export type ButtonVariants = VariantProps<typeof buttonVariants>
export type InputVariants = VariantProps<typeof inputVariants>
export type CardVariants = VariantProps<typeof cardVariants>
export type BadgeVariants = VariantProps<typeof badgeVariants>
export type AvatarVariants = VariantProps<typeof avatarVariants>
export type AlertVariants = VariantProps<typeof alertVariants>
