'use client'

import { useTheme } from 'next-themes'
import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'

interface SalesByHourDataPoint {
  hour: number
  sales: number
  percentage: number
}

interface SalesByHourChartProps {
  data: SalesByHourDataPoint[]
  loading?: boolean
  error?: string
  height?: number
  locale?: string
  className?: string
  showPercentages?: boolean
}

/**
 * Sales by hour chart component displaying hourly sales distribution
 * with percentages on top of bars
 */
export function SalesByHourChart({
  data = [],
  loading = false,
  error,
  height = 400,
  locale = 'pt-BR',
  className,
  showPercentages = true,
}: SalesByHourChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Ensure we have all 24 hours (0-23)
  const chartData = Array.from({ length: 24 }, (_, hour) => {
    const found = data.find(d => d.hour === hour)
    return found || { hour, sales: 0, percentage: 0 }
  }).map(item => ({
    ...item,
    hourLabel: `${item.hour.toString().padStart(2, '0')}:00`,
  }))

  // Custom label component for percentages (only show if > 1%)
  const renderCustomLabel = (props: any) => {
    const { x, y, width, payload } = props
    const percentage = payload?.percentage
    if (!percentage || percentage < 1) return null

    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill={isDark ? '#F3F4F6' : '#374151'}
        textAnchor='middle'
        fontSize='10'
        fontWeight='500'
      >
        {percentage !== undefined && percentage !== null ? `${percentage.toFixed(1)}%` : '0%'}
      </text>
    )
  }

  // Custom tooltip
  function CustomTooltip({ active, payload, label }: any) {
    if (active && payload?.length) {
      const data = payload[0].payload
      return (
        <div className='bg-background rounded-lg border p-3 shadow-lg'>
          <p className='font-medium'>{data.hourLabel}</p>
          <p className='text-sm'>
            <span className='text-muted-foreground'>Vendas: </span>
            <span className='font-medium'>{data.sales.toLocaleString(locale)}</span>
          </p>
          <p className='text-sm'>
            <span className='text-muted-foreground'>Percentual: </span>
            <span className='font-medium'>{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='w-full space-y-4 p-6'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-64 w-full' />
            <div className='flex justify-center space-x-4'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='space-y-2 text-center'>
            <p className='text-muted-foreground text-sm'>Erro ao carregar dados</p>
            <p className='text-muted-foreground text-xs'>{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-[${height}px] w-full ${className}`}>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={chartData}
          margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
          barCategoryGap='5%'
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke={isDark ? '#374151' : '#e5e7eb'}
            opacity={0.5}
          />
          <XAxis
            dataKey='hourLabel'
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 10,
              fill: isDark ? '#9CA3AF' : '#6B7280',
            }}
            angle={-45}
            textAnchor='end'
            height={60}
            interval={1}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: isDark ? '#9CA3AF' : '#6B7280',
            }}
            tickFormatter={value => value.toLocaleString(locale)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey='sales' radius={[2, 2, 0, 0]} fill='#3b82f6'>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill='#3b82f6' />
            ))}
            {showPercentages && <LabelList dataKey='percentage' content={renderCustomLabel} />}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
