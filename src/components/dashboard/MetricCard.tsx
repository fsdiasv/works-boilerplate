'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  description: string
  subtext: string
}

export function MetricCard({ title, value, change, trend, description, subtext }: MetricCardProps) {
  const isPositive = trend === 'up'

  return (
    <Card>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardDescription className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            {title}
          </CardDescription>
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {isPositive ? <TrendingUp className='h-4 w-4' /> : <TrendingDown className='h-4 w-4' />}
            <span>{change}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-1'>
          <h2 className='text-3xl font-bold tracking-tight'>{value}</h2>
          <div className='space-y-1'>
            <p className='flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-gray-100'>
              {description}
              {isPositive ? (
                <TrendingUp className='h-4 w-4 text-gray-600 dark:text-gray-400' />
              ) : (
                <TrendingDown className='h-4 w-4 text-gray-600 dark:text-gray-400' />
              )}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
