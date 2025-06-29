import type React from 'react'
import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface SectionProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'article' | 'div' | 'main' | 'aside'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive'
  paddingX?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive'
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'auto'
  fullHeight?: boolean
  safeArea?: boolean | 'top' | 'bottom' | 'horizontal' | 'all'
  enableQueries?: boolean
}

const paddingClasses = {
  none: 'p-0',
  sm: 'p-4 @sm:p-6',
  md: 'p-6 @sm:p-8 @lg:p-10',
  lg: 'p-8 @sm:p-12 @lg:p-16',
  xl: 'p-12 @sm:p-16 @lg:p-20',
  responsive: 'p-4 @sm:p-6 @md:p-8 @lg:p-12 @xl:p-16',
}

const paddingXClasses = {
  none: 'px-0',
  sm: 'px-4 @sm:px-6',
  md: 'px-6 @sm:px-8 @lg:px-10',
  lg: 'px-8 @sm:px-12 @lg:px-16',
  xl: 'px-12 @sm:px-16 @lg:px-20',
  responsive: 'px-4 @sm:px-6 @md:px-8 @lg:px-12 @xl:px-16',
}

const paddingYClasses = {
  none: 'py-0',
  sm: 'py-4 @sm:py-6',
  md: 'py-6 @sm:py-8 @lg:py-10',
  lg: 'py-8 @sm:py-12 @lg:py-16',
  xl: 'py-12 @sm:py-16 @lg:py-20',
  responsive: 'py-4 @sm:py-6 @md:py-8 @lg:py-12 @xl:py-16',
}

const marginClasses = {
  none: 'm-0',
  sm: 'm-4',
  md: 'm-8',
  lg: 'm-12',
  xl: 'm-16',
  auto: 'mx-auto',
}

const safeAreaClasses = {
  top: 'pt-safe-top',
  bottom: 'pb-safe-bottom',
  horizontal: 'px-safe-left px-safe-right',
  all: 'p-safe-top p-safe-bottom p-safe-left p-safe-right',
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  (
    {
      as: Component = 'section',
      className,
      padding,
      paddingX,
      paddingY,
      margin = 'none',
      fullHeight = false,
      safeArea = false,
      enableQueries = true,
      ...props
    },
    ref
  ) => {
    const getSafeAreaClass = () => {
      if (safeArea === false) return ''
      if (typeof safeArea === 'boolean') return safeAreaClasses.all
      return safeAreaClasses[safeArea]
    }

    const elementProps = {
      ...props,
      className: cn(
        // Base styles
        'relative',
        // Container queries
        {
          '@container': enableQueries,
        },
        // Padding
        padding && paddingClasses[padding],
        paddingX && paddingXClasses[paddingX],
        paddingY && paddingYClasses[paddingY],
        // Margin
        marginClasses[margin],
        // Full height
        {
          'min-h-screen-safe': fullHeight,
        },
        // Safe area
        getSafeAreaClass(),
        className
      ),
    }

    // Type-safe component rendering
    switch (Component) {
      case 'div':
        return <div ref={ref as React.Ref<HTMLDivElement>} {...elementProps} />
      case 'section':
        return <section ref={ref as React.Ref<HTMLElement>} {...elementProps} />
      case 'article':
        return <article ref={ref as React.Ref<HTMLElement>} {...elementProps} />
      case 'main':
        return <main ref={ref as React.Ref<HTMLElement>} {...elementProps} />
      case 'aside':
        return <aside ref={ref as React.Ref<HTMLElement>} {...elementProps} />
      default:
        return <section ref={ref as React.Ref<HTMLElement>} {...elementProps} />
    }
  }
)

Section.displayName = 'Section'
