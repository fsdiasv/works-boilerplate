'use client'

import { format, parseISO } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts'

import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL } from '@/lib/analytics-utils'

interface RevenueDataPoint {
  day: string // 'YYYY-MM-DD'
  receita_brl: string
  // Optional additional metrics
  orders?: number
  aov?: number
}

interface RevenueChartProps {
  data: RevenueDataPoint[]
  loading?: boolean
  error?: string
  height?: number
  showOrders?: boolean
  showAOV?: boolean
  locale?: string
  timezone?: string
  className?: string
}

/**
 * Revenue chart component displaying daily revenue trends
 * with optional orders and AOV overlay
 */
export function RevenueChart({
  data = [],
  loading = false,
  error,
  height = 400,
  showOrders = false,
  showAOV = false,
  locale = 'pt-BR',
  timezone = 'America/Sao_Paulo',
  className,
}: RevenueChartProps) {
  const t = useTranslations('RevenueChart')
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  // Transform data for chart
  const chartData = data.map(point => ({
    ...point,
    date: format(parseISO(point.day), 'dd/MM', { locale: dateLocale }),
    fullDate: format(parseISO(point.day), 'dd/MM/yyyy', { locale: dateLocale }),
    revenue: parseFloat(point.receita_brl) || 0,
    formattedRevenue: formatBRL(point.receita_brl, { locale }),
  }))

  // Calculate average revenue for reference line
  const avgRevenue = chartData.length > 0
    ? chartData.reduce((sum, point) => sum + point.revenue, 0) / chartData.length
    : 0

  if (loading) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='space-y-4 w-full p-6'>
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
          <div className='text-center space-y-2'>
            <div className='text-red-500 text-sm font-medium'>
              {t('error.loading')}
            </div>
            <div className='text-muted-foreground text-xs'>
              {error}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className={`h-[${height}px] w-full ${className}`}>
        <div className='flex h-full items-center justify-center'>
          <div className='text-center space-y-2'>
            <div className='text-muted-foreground text-sm'>
              {t('empty.noData')}
            </div>
            <div className='text-muted-foreground text-xs'>
              {t('empty.suggestion')}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-[${height}px] w-full ${className}`}>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
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
            tickFormatter={(value) => formatBRL(value, { locale, showSymbol: false })}
          />
          
          {showOrders && (
            <YAxis
              yAxisId='right'
              orientation='right'
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: isDark ? '#9ca3af' : '#6b7280',
              }}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString(locale)}
            />
          )}
          
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
                          style={{ backgroundColor: '#3b82f6' }}
                        />
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t('tooltip.revenue')}
                        </span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {data?.formattedRevenue}
                        </span>
                      </div>
                      
                      {showOrders && data?.orders && (
                        <div className='flex items-center gap-2 text-sm'>
                          <div
                            className='h-3 w-3 rounded-full'
                            style={{ backgroundColor: '#10b981' }}
                          />
                          <span className='text-gray-600 dark:text-gray-400'>
                            {t('tooltip.orders')}
                          </span>
                          <span className='font-medium text-gray-900 dark:text-gray-100'>
                            {data.orders.toLocaleString(locale)}
                          </span>
                        </div>
                      )}
                      
                      {showAOV && data?.aov && (
                        <div className='flex items-center gap-2 text-sm'>
                          <div
                            className='h-3 w-3 rounded-full'
                            style={{ backgroundColor: '#f59e0b' }}
                          />
                          <span className='text-gray-600 dark:text-gray-400'>
                            {t('tooltip.averageTicket')}
                          </span>
                          <span className='font-medium text-gray-900 dark:text-gray-100'>
                            {formatBRL(data.aov, { locale })}
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
          
          {avgRevenue > 0 && (
            <ReferenceLine
              y={avgRevenue}
              stroke={isDark ? '#6b7280' : '#9ca3af'}
              strokeDasharray='5 5'
              label={{
                value: t('reference.average', { value: formatBRL(avgRevenue, { locale, showSymbol: false }) }),
                position: 'topRight',
                style: {
                  fontSize: '12px',
                  fill: isDark ? '#9ca3af' : '#6b7280',
                },
              }}
            />
          )}
          
          <Line
            yAxisId='left'
            type='monotone'
            dataKey='revenue'
            stroke='#3b82f6'
            strokeWidth={2}
            dot={{
              fill: '#3b82f6',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              stroke: '#3b82f6',
              strokeWidth: 2,
              fill: '#fff',
            }}
          />
          
          {showOrders && (
            <Line
              type='monotone'
              dataKey='orders'
              stroke='#10b981'
              strokeWidth={2}
              yAxisId='right'
              dot={{
                fill: '#10b981',
                strokeWidth: 2,
                r: 3,
              }}
            />
          )}
          
          {(showOrders || showAOV) && (
            <Legend
              verticalAlign='top'
              height={36}
              iconType='line'
              wrapperStyle={{
                fontSize: '12px',
                color: isDark ? '#9ca3af' : '#6b7280',
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Specialized revenue chart with dual axis for revenue and orders
 */
interface DualAxisRevenueChartProps extends Omit<RevenueChartProps, 'showOrders' | 'showAOV'> {
  ordersData?: Array<{ day: string; pedidos: number }>
}

export function DualAxisRevenueChart({
  data,
  ordersData,
  loading,
  error,
  height = 400,
  locale = 'pt-BR',
  className,
}: DualAxisRevenueChartProps) {
  const t = useTranslations('RevenueChart')
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  // Merge revenue and orders data
  const chartData = data.map(revenuePoint => {
    const ordersPoint = ordersData?.find(o => o.day === revenuePoint.day)
    return {
      date: format(parseISO(revenuePoint.day), 'dd/MM', { locale: dateLocale }),
      fullDate: format(parseISO(revenuePoint.day), 'dd/MM/yyyy', { locale: dateLocale }),
      revenue: parseFloat(revenuePoint.receita_brl) || 0,
      formattedRevenue: formatBRL(revenuePoint.receita_brl, { locale }),
      orders: ordersPoint?.pedidos || 0,
    }
  })

  if (loading || error || chartData.length === 0) {
    return (
      <RevenueChart
        data={data}
        loading={loading}
        error={error}
        height={height}
        locale={locale}
        className={className}
      />
    )
  }

  return (
    <div className={`h-[${height}px] w-full ${className}`}>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart
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
            tickFormatter={(value) => formatBRL(value, { locale, showSymbol: false })}
          />
          
          <YAxis
            yAxisId='right'
            orientation='right'
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 12,
              fill: isDark ? '#9ca3af' : '#6b7280',
            }}
            tickMargin={8}
            tickFormatter={(value) => value.toLocaleString(locale)}
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
                        <div className='h-3 w-3 rounded-full bg-blue-500' />
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t('tooltip.revenue')}
                        </span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {data?.formattedRevenue}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-sm'>
                        <div className='h-3 w-3 rounded-full bg-green-500' />
                        <span className='text-gray-600 dark:text-gray-400'>
                          {t('tooltip.orders')}
                        </span>
                        <span className='font-medium text-gray-900 dark:text-gray-100'>
                          {data?.orders?.toLocaleString(locale)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          
          <Legend
            verticalAlign='top'
            height={36}
            iconType='line'
            wrapperStyle={{
              fontSize: '12px',
              color: isDark ? '#9ca3af' : '#6b7280',
            }}
          />
          
          <Line
            yAxisId='left'
            type='monotone'
            dataKey='revenue'
            stroke='#3b82f6'
            strokeWidth={2}
            name={t('legend.revenue')}
            dot={{
              fill: '#3b82f6',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              r: 6,
              stroke: '#3b82f6',
              strokeWidth: 2,
              fill: '#fff',
            }}
          />
          
          <Line
            yAxisId='right'
            type='monotone'
            dataKey='orders'
            stroke='#10b981'
            strokeWidth={2}
            name={t('legend.orders')}
            dot={{
              fill: '#10b981',
              strokeWidth: 2,
              r: 3,
            }}
            activeDot={{
              r: 5,
              stroke: '#10b981',
              strokeWidth: 2,
              fill: '#fff',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}