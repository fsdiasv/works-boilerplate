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
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'

interface ProductSalesDataPoint {
  product_code: string
  quantity: number
  percentage: number
}

interface ProductSalesChartProps {
  data: ProductSalesDataPoint[]
  loading?: boolean
  error?: string
  height?: number
  locale?: string
  className?: string
  showPercentages?: boolean
}

/**
 * Product sales chart component displaying sales quantities by product
 * with percentages displayed on bars
 */
export function ProductSalesChart({
  data = [],
  loading = false,
  error,
  height = 400,
  locale = 'pt-BR',
  className,
  showPercentages = true,
}: ProductSalesChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // Transform data for chart
  const chartData = data.map(point => ({
    ...point,
    label: point.product_code,
    value: point.quantity,
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className='bg-background rounded-lg border p-3 shadow-lg'>
          <p className='font-medium'>{label}</p>
          <p className='text-sm'>
            <span className='text-muted-foreground'>Vendas: </span>
            <span className='font-medium'>{data.quantity.toLocaleString(locale)}</span>
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

  if (!chartData.length) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <p className='text-muted-foreground text-sm'>Nenhum dado disponível</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-[${height}px] w-full ${className}`}>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          barCategoryGap='20%'
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke={isDark ? '#374151' : '#e5e7eb'}
            opacity={0.5}
          />
          <XAxis
            dataKey='label'
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: isDark ? '#9CA3AF' : '#6B7280',
            }}
            angle={-45}
            textAnchor='end'
            height={80}
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
          <Bar dataKey='value' radius={[4, 4, 0, 0]} fill='#3b82f6'>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill='#3b82f6' />
            ))}
          </Bar>
          {showPercentages && (
            <Bar dataKey='percentage' fill='transparent' isAnimationActive={false}>
              {chartData.map((entry, index) => (
                <Cell key={`percent-${index}`} fill='transparent' />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
