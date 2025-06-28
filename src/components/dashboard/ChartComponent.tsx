'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Dynamically import the chart to reduce initial bundle size
const VisitorsChart = dynamic(
  () => import('./VisitorsChart').then(mod => ({ default: mod.VisitorsChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

function ChartSkeleton() {
  return (
    <div className='h-[300px] space-y-3 p-6 sm:h-[400px]'>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-[250px]' />
        <Skeleton className='h-4 w-[200px]' />
      </div>
      <Skeleton className='h-[250px] w-full' />
    </div>
  )
}

export function ChartComponent() {
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle>Total Visitors</CardTitle>
            <CardDescription>Total for the last 3 months</CardDescription>
          </div>
          <div className='flex gap-2'>
            <button className='rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'>
              3 months
            </button>
            <button className='rounded-md px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'>
              30 days
            </button>
            <button className='rounded-md px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'>
              7 days
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='h-[300px] p-0 sm:h-[400px]'>
        <Suspense fallback={<ChartSkeleton />}>
          <VisitorsChart />
        </Suspense>
      </CardContent>
    </Card>
  )
}
