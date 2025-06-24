'use client'

import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto'
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
}

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @sm/content:grid-cols-2',
  3: 'grid-cols-1 @sm/content:grid-cols-2 @lg/content:grid-cols-3',
  4: 'grid-cols-1 @sm/content:grid-cols-2 @lg/content:grid-cols-4',
  6: 'grid-cols-2 @sm/content:grid-cols-3 @lg/content:grid-cols-6',
  12: 'grid-cols-1 @sm/content:grid-cols-2 @md/content:grid-cols-3 @lg/content:grid-cols-4 @xl/content:grid-cols-6 @2xl/content:grid-cols-12',
  auto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
}

const gridGaps = {
  none: 'gap-0',
  xs: 'gap-2',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-12',
}

const alignItems = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyContent = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      cols = 'auto',
      gap = 'md',
      responsive = true,
      align = 'stretch',
      justify,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          // Grid columns with container query responsiveness
          responsive ? gridCols[cols] : `grid-cols-${cols}`,
          // Gap
          gridGaps[gap],
          // Alignment
          alignItems[align],
          justify && justifyContent[justify],
          className
        )}
        {...props}
      />
    )
  }
)

Grid.displayName = 'Grid'

// Grid item component for better control
interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number | 'full'
  start?: number
  end?: number
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, start, end, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          {
            [`col-span-${span}`]: span != null && span !== 'full',
            'col-span-full': span === 'full',
            [`col-start-${start}`]: start,
            [`col-end-${end}`]: end,
          },
          className
        )}
        {...props}
      />
    )
  }
)

GridItem.displayName = 'GridItem'
