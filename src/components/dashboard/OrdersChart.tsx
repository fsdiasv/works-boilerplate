'use client'

import { format, parseISO } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
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
  ReferenceLine,
  Cell,
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'

interface OrdersDataPoint {
  day: string // 'YYYY-MM-DD'
  pedidos: number
  // Optional additional metrics
  revenue?: number
  aov?: number
}

interface OrdersChartProps {
  data: OrdersDataPoint[]
  loading?: boolean
  error?: string
  height?: number
  locale?: string
  timezone?: string
  className?: string
  showAverage?: boolean
  colorThreshold?: number // Color bars differently below this threshold
}

/**
 * Orders chart component displaying daily order counts as bars
 * with optional color coding based on performance thresholds
 */
export function OrdersChart({
  data = [],
  loading = false,
  error,
  height = 400,
  locale = 'pt-BR',
  timezone = 'America/Sao_Paulo',
  className,
  showAverage = true,
  colorThreshold,
}: OrdersChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  // Transform data for chart
  const chartData = data.map(point => ({
    ...point,
    date: formatInTimeZone(parseISO(point.day), timezone, 'dd/MM', { locale: dateLocale }),
    fullDate: formatInTimeZone(parseISO(point.day), timezone, 'dd/MM/yyyy', { locale: dateLocale }),
    orders: point.pedidos,
  }))

  // Calculate average orders for reference line
  const avgOrders =
    chartData.length > 0
      ? chartData.reduce((sum, point) => sum + point.orders, 0) / chartData.length
      : 0

  // Determine bar colors based on threshold
  const getBarColor = (value: number) => {
    if (!colorThreshold) return '#3b82f6' // Default blue

    if (value >= colorThreshold) {
      return '#10b981' // Green for good performance
    } else if (value >= colorThreshold * 0.7) {
      return '#f59e0b' // Yellow for moderate performance
    } else {
      return '#ef4444' // Red for poor performance
    }
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
            <div className='text-sm font-medium text-red-500'>Erro ao carregar dados</div>
            <div className='text-muted-foreground text-xs'>{error}</div>
          </div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='space-y-2 text-center'>
            <div className='text-muted-foreground text-sm'>Nenhum dado disponível</div>
            <div className='text-muted-foreground text-xs'>
              Selecione um período diferente ou verifique os filtros
            </div>
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
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke={isDark ? '#374151' : '#e5e7eb'}
            vertical={false}
          />

          <XAxis
            dataKey='date'
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: isDark ? '#9ca3af' : '#6b7280',
            }}
            tickMargin={8}
            interval='preserveStartEnd'
          />

          <YAxis
            yAxisId='left'
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: isDark ? '#9ca3af' : '#6b7280',
            }}
            tickMargin={8}
            tickFormatter={value => value.toLocaleString(locale)}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0]?.payload
                return (
                  <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800'>
                    <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {data?.fullDate}
                    </p>
                    <div className='mt-2 space-y-1'>
                      <div className='flex items-center gap-2 text-sm'>
                        <div
                          className='h-3 w-3 rounded-full'
                          style={{ backgroundColor: getBarColor(data?.orders || 0) }}
                        />
                        <span className='text-gray-600 dark:text-gray-400'>Pedidos:</span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {data?.orders?.toLocaleString(locale)}
                        </span>
                      </div>

                      {data?.revenue && (
                        <div className='flex items-center gap-2 text-sm'>
                          <div className='h-3 w-3 rounded-full bg-blue-500' />
                          <span className='text-gray-600 dark:text-gray-400'>Receita:</span>
                          <span className='font-medium text-gray-900 dark:text-gray-100'>
                            R$ {data.revenue.toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {data?.aov && (
                        <div className='flex items-center gap-2 text-sm'>
                          <div className='h-3 w-3 rounded-full bg-orange-500' />
                          <span className='text-gray-600 dark:text-gray-400'>Ticket Médio:</span>
                          <span className='font-medium text-gray-900 dark:text-gray-100'>
                            R$ {data.aov.toLocaleString(locale, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />

          {showAverage && avgOrders > 0 && (
            <ReferenceLine
              y={avgOrders}
              yAxisId='left'
              stroke={isDark ? '#6b7280' : '#9ca3af'}
              strokeDasharray='5 5'
              label={{
                value: `Média: ${Math.round(avgOrders).toLocaleString(locale)}`,
                position: 'topRight',
                style: {
                  fontSize: '12px',
                  fill: isDark ? '#9ca3af' : '#6b7280',
                },
              }}
            />
          )}

          <Bar dataKey='orders' yAxisId='left' radius={[2, 2, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.orders)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Subscription orders chart showing new vs churned subscriptions
 */
interface SubscriptionsDataPoint {
  day: string
  novas: number
  churn: number
}

interface SubscriptionsChartProps {
  data: SubscriptionsDataPoint[]
  loading?: boolean
  error?: string
  height?: number
  locale?: string
  timezone?: string
  className?: string
}

export function SubscriptionsChart({
  data = [],
  loading = false,
  error,
  height = 400,
  locale = 'pt-BR',
  timezone = 'UTC',
  className,
}: SubscriptionsChartProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  // Transform data for chart
  const chartData = data.map(point => ({
    ...point,
    date: formatInTimeZone(parseISO(point.day), timezone || 'UTC', 'dd/MM', { locale: dateLocale }),
    fullDate: formatInTimeZone(parseISO(point.day), timezone || 'UTC', 'dd/MM/yyyy', {
      locale: dateLocale,
    }),
    new: point.novas,
    churned: -point.churn, // Negative for visual representation
    net: point.novas - point.churn,
  }))

  if (loading) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='w-full space-y-4 p-6'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-64 w-full' />
          </div>
        </div>
      </div>
    )
  }

  if (error || chartData.length === 0) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='space-y-2 text-center'>
            <div className='text-muted-foreground text-sm'>{error || 'Nenhum dado disponível'}</div>
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
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid
            strokeDasharray='3 3'
            stroke={isDark ? '#374151' : '#e5e7eb'}
            vertical={false}
          />

          <XAxis
            dataKey='date'
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: isDark ? '#9ca3af' : '#6b7280',
            }}
            tickMargin={8}
          />

          <YAxis
            yAxisId='left'
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: isDark ? '#9ca3af' : '#6b7280',
            }}
            tickMargin={8}
            tickFormatter={value => Math.abs(value).toLocaleString(locale)}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0]?.payload
                return (
                  <div className='rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800'>
                    <p className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                      {data?.fullDate}
                    </p>
                    <div className='mt-2 space-y-1'>
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='h-3 w-3 rounded-full bg-green-500' />
                        <span className='text-gray-600 dark:text-gray-400'>Novas:</span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {data?.new?.toLocaleString(locale)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='h-3 w-3 rounded-full bg-red-500' />
                        <span className='text-gray-600 dark:text-gray-400'>Churn:</span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {data?.churn?.toLocaleString(locale)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 border-t pt-1 text-sm'>
                        <span className='text-gray-600 dark:text-gray-400'>Líquido:</span>
                        <span
                          className={`font-medium ${
                            data?.net > 0
                              ? 'text-green-600 dark:text-green-400'
                              : data?.net < 0
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          {data?.net > 0 ? '+' : ''}
                          {data?.net?.toLocaleString(locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />

          {/* Zero reference line */}
          <ReferenceLine y={0} yAxisId='left' stroke={isDark ? '#4b5563' : '#6b7280'} />

          {/* New subscriptions (positive) */}
          <Bar
            dataKey='new'
            yAxisId='left'
            fill='#10b981'
            radius={[2, 2, 0, 0]}
            name='Novas Assinaturas'
          />

          {/* Churned subscriptions (negative) */}
          <Bar dataKey='churned' yAxisId='left' fill='#ef4444' radius={[0, 0, 2, 2]} name='Churn' />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
