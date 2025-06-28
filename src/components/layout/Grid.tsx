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

// Non-responsive grid columns for when responsive is false
const staticGridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
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
          responsive ? gridCols[cols] : staticGridCols[cols],
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
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full'
  start?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
  end?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13
}

// Predefined class mappings for GridItem
const colSpanClasses = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
  5: 'col-span-5',
  6: 'col-span-6',
  7: 'col-span-7',
  8: 'col-span-8',
  9: 'col-span-9',
  10: 'col-span-10',
  11: 'col-span-11',
  12: 'col-span-12',
  full: 'col-span-full',
}

const colStartClasses = {
  1: 'col-start-1',
  2: 'col-start-2',
  3: 'col-start-3',
  4: 'col-start-4',
  5: 'col-start-5',
  6: 'col-start-6',
  7: 'col-start-7',
  8: 'col-start-8',
  9: 'col-start-9',
  10: 'col-start-10',
  11: 'col-start-11',
  12: 'col-start-12',
  13: 'col-start-13',
}

const colEndClasses = {
  1: 'col-end-1',
  2: 'col-end-2',
  3: 'col-end-3',
  4: 'col-end-4',
  5: 'col-end-5',
  6: 'col-end-6',
  7: 'col-end-7',
  8: 'col-end-8',
  9: 'col-end-9',
  10: 'col-end-10',
  11: 'col-end-11',
  12: 'col-end-12',
  13: 'col-end-13',
}

export const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, start, end, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          span && colSpanClasses[span],
          start && colStartClasses[start],
          end && colEndClasses[end],
          className
        )}
        {...props}
      />
    )
  }
)

GridItem.displayName = 'GridItem'
