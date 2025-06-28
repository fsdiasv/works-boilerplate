'use client'

import { forwardRef } from 'react'
import type React from 'react'

import { cn } from '@/lib/utils'

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'overline'
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'fluid'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'destructive' | 'success' | 'warning'
  align?: 'left' | 'center' | 'right' | 'justify'
  responsive?: boolean
  children: React.ReactNode
  className?: string
}

const variantStyles = {
  h1: 'scroll-m-20 font-extrabold tracking-tight',
  h2: 'scroll-m-20 border-b pb-2 font-semibold tracking-tight first:mt-0',
  h3: 'scroll-m-20 font-semibold tracking-tight',
  h4: 'scroll-m-20 font-semibold tracking-tight',
  h5: 'scroll-m-20 font-semibold tracking-tight',
  h6: 'scroll-m-20 font-semibold tracking-tight',
  body: 'leading-7',
  caption: 'text-sm text-muted-foreground',
  overline: 'text-xs font-medium uppercase tracking-wider text-muted-foreground',
}

// Fluid typography sizes based on variant
const variantFluidSizes = {
  h1: 'text-[clamp(2rem,1.5rem+2.5vw,4rem)]',
  h2: 'text-[clamp(1.5rem,1.25rem+1.25vw,2.5rem)]',
  h3: 'text-[clamp(1.25rem,1.125rem+0.625vw,1.875rem)]',
  h4: 'text-[clamp(1.125rem,1rem+0.625vw,1.5rem)]',
  h5: 'text-[clamp(1rem,0.95rem+0.25vw,1.25rem)]',
  h6: 'text-[clamp(0.875rem,0.85rem+0.125vw,1rem)]',
  body: 'text-[clamp(1rem,0.9rem+0.5vw,1.125rem)]',
  caption: 'text-[clamp(0.75rem,0.7rem+0.25vw,0.875rem)]',
  overline: 'text-[clamp(0.625rem,0.6rem+0.125vw,0.75rem)]',
}

const fluidSizes = {
  xs: 'text-[clamp(0.75rem,0.7rem+0.2vw,0.875rem)]',
  sm: 'text-[clamp(0.875rem,0.8rem+0.3vw,1rem)]',
  base: 'text-[clamp(1rem,0.9rem+0.4vw,1.125rem)]',
  lg: 'text-[clamp(1.125rem,1rem+0.5vw,1.25rem)]',
  xl: 'text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)]',
  fluid: 'text-[clamp(1rem,0.8rem+1vw,2rem)]',
}

const sizeStyles = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  fluid: fluidSizes.fluid,
}

const weightStyles = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
}

const colorStyles = {
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
}

const alignStyles = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body',
      size,
      weight,
      color,
      align = 'left',
      responsive = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const commonClasses = cn(
      // Base variant styles
      variantStyles[variant],
      // Fluid typography based on variant when responsive
      responsive && variantFluidSizes[variant],
      // Size (responsive or static) - only apply if not using variant fluid sizes
      size && !responsive && sizeStyles[size],
      size && responsive && fluidSizes[size],
      // Weight override
      weight && weightStyles[weight],
      // Color
      color && colorStyles[color],
      // Alignment
      alignStyles[align],
      // Responsive line height adjustments
      responsive && 'leading-[1.4] @md:leading-normal @lg:leading-[1.6]',
      className
    )

    switch (variant) {
      case 'h1':
        return (
          <h1 ref={ref as React.RefObject<HTMLHeadingElement>} className={commonClasses} {...props}>
            {children}
          </h1>
        )
      case 'h2':
        return (
          <h2 ref={ref as React.RefObject<HTMLHeadingElement>} className={commonClasses} {...props}>
            {children}
          </h2>
        )
      case 'h3':
        return (
          <h3 ref={ref as React.RefObject<HTMLHeadingElement>} className={commonClasses} {...props}>
            {children}
          </h3>
        )
      case 'h4':
        return (
          <h4 ref={ref as React.RefObject<HTMLHeadingElement>} className={commonClasses} {...props}>
            {children}
          </h4>
        )
      case 'h5':
        return (
          <h5 ref={ref as React.RefObject<HTMLHeadingElement>} className={commonClasses} {...props}>
            {children}
          </h5>
        )
      case 'h6':
        return (
          <h6 ref={ref as React.RefObject<HTMLHeadingElement>} className={commonClasses} {...props}>
            {children}
          </h6>
        )
      case 'body':
        return (
          <p
            ref={ref as React.RefObject<HTMLParagraphElement>}
            className={commonClasses}
            {...props}
          >
            {children}
          </p>
        )
      case 'caption':
      case 'overline':
        return (
          <span ref={ref as React.RefObject<HTMLSpanElement>} className={commonClasses} {...props}>
            {children}
          </span>
        )
      default:
        return (
          <p
            ref={ref as React.RefObject<HTMLParagraphElement>}
            className={commonClasses}
            {...props}
          >
            {children}
          </p>
        )
    }
  }
)

Typography.displayName = 'Typography'

// Specific typography components for convenience
export const Heading = forwardRef<
  HTMLHeadingElement,
  Omit<TypographyProps, 'variant'> & { level: 1 | 2 | 3 | 4 | 5 | 6 }
>(({ level, ...props }, ref) => {
  return (
    <Typography
      ref={ref}
      variant={`h${level}` as NonNullable<TypographyProps['variant']>}
      {...props}
    />
  )
})

Heading.displayName = 'Heading'

export const Text = forwardRef<HTMLParagraphElement, Omit<TypographyProps, 'variant'>>(
  (props, ref) => {
    return (
      <Typography ref={ref as React.RefObject<HTMLParagraphElement>} variant='body' {...props} />
    )
  }
)

Text.displayName = 'Text'
