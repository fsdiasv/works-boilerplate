'use client'

import { ArrowDown, ArrowUp, DollarSign, Percent, TrendingUp } from 'lucide-react'
import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatBRL, formatPercentage } from '@/lib/analytics-utils'
import { cn } from '@/lib/utils'

export interface SalesMetricCardProps {
  title: string
  value: string | number
  type: 'currency' | 'count' | 'percentage' | 'aov'
  change?: number // Percentage change from previous period
  changeDirection?: 'up' | 'down' | 'neutral'
  description?: string
  loading?: boolean
  error?: string
  className?: string
  // Additional props for specific metric types
  showTrend?: boolean
  locale?: string
}

/**
 * Enhanced metric card specifically designed for sales and revenue metrics
 * Supports currency formatting, percentage rates, and trend indicators
 */
export function SalesMetricCard({
  title,
  value,
  type,
  change,
  changeDirection,
  description,
  loading = false,
  error,
  className,
  showTrend = true,
  locale = 'pt-BR',
}: SalesMetricCardProps) {
  if (loading) {
    return (
      <Card className={cn('relative', className)}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>
            <Skeleton className='h-4 w-24' />
          </CardTitle>
          <Skeleton className='h-4 w-4' />
        </CardHeader>
        <CardContent>
          <Skeleton className='h-8 w-32 mb-2' />
          <Skeleton className='h-4 w-20' />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn('relative border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950', className)}>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium text-red-700 dark:text-red-300'>
            {title}
          </CardTitle>
          <div className='h-4 w-4 rounded-full bg-red-500' />
        </CardHeader>
        <CardContent>
          <div className='text-sm text-red-600 dark:text-red-400'>
            Erro ao carregar dados
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatValue = (val: string | number): string => {
    const numValue = typeof val === 'string' ? parseFloat(val) : val

    switch (type) {
      case 'currency':
        return formatBRL(numValue, { locale, showSymbol: true })
      
      case 'aov':
        return formatBRL(numValue, { locale, showSymbol: true })
      
      case 'percentage':
        return `${numValue.toFixed(2)}%`
      
      case 'count':
        return numValue.toLocaleString(locale)
      
      default:
        return val.toString()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'currency':
      case 'aov':
        return <DollarSign className='h-4 w-4 text-muted-foreground' />
      case 'percentage':
        return <Percent className='h-4 w-4 text-muted-foreground' />
      case 'count':
        return <TrendingUp className='h-4 w-4 text-muted-foreground' />
      default:
        return <TrendingUp className='h-4 w-4 text-muted-foreground' />
    }
  }

  const getTrendIcon = () => {
    if (!showTrend || change === undefined) return null
    
    switch (changeDirection) {
      case 'up':
        return <ArrowUp className='h-3 w-3 text-green-500' />
      case 'down':
        return <ArrowDown className='h-3 w-3 text-red-500' />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    if (!showTrend || change === undefined) return ''
    
    switch (changeDirection) {
      case 'up':
        return 'text-green-600 dark:text-green-400'
      case 'down':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const formattedValue = formatValue(value)
  const hasChange = change !== undefined && showTrend

  return (
    <Card className={cn('relative', className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className='flex items-baseline space-x-2'>
          <div className='text-2xl font-bold leading-none tracking-tight'>
            {formattedValue}
          </div>
          {hasChange && (
            <div className={cn('flex items-center text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span className='ml-1'>
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        
        {description && (
          <p className='text-xs text-muted-foreground mt-1'>
            {description}
          </p>
        )}
        
        {hasChange && (
          <p className='text-xs text-muted-foreground mt-1'>
            vs. período anterior
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Specialized metric cards for common sales KPIs
 */

interface RevenueCardProps {
  value: string | number
  change?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  loading?: boolean
  error?: string
  className?: string
  type?: 'gross' | 'net'
}

export function RevenueCard({ 
  value, 
  change, 
  changeDirection, 
  loading, 
  error, 
  className,
  type = 'gross'
}: RevenueCardProps) {
  const title = type === 'gross' ? 'Receita Bruta' : 'Receita Líquida'
  const description = type === 'gross' 
    ? 'Total de vendas antes de impostos e reembolsos'
    : 'Receita após impostos, reembolsos e chargebacks'
  
  return (
    <SalesMetricCard
      title={title}
      value={value}
      type='currency'
      change={change}
      changeDirection={changeDirection}
      description={description}
      loading={loading}
      error={error}
      className={className}
    />
  )
}

interface OrdersCardProps {
  value: number
  change?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  loading?: boolean
  error?: string
  className?: string
}

export function OrdersCard({ 
  value, 
  change, 
  changeDirection, 
  loading, 
  error, 
  className 
}: OrdersCardProps) {
  return (
    <SalesMetricCard
      title='Pedidos'
      value={value}
      type='count'
      change={change}
      changeDirection={changeDirection}
      description='Total de pedidos com pagamento aprovado'
      loading={loading}
      error={error}
      className={className}
    />
  )
}

interface AOVCardProps {
  value: string | number
  change?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  loading?: boolean
  error?: string
  className?: string
}

export function AOVCard({ 
  value, 
  change, 
  changeDirection, 
  loading, 
  error, 
  className 
}: AOVCardProps) {
  return (
    <SalesMetricCard
      title='Ticket Médio'
      value={value}
      type='aov'
      change={change}
      changeDirection={changeDirection}
      description='Valor médio por pedido'
      loading={loading}
      error={error}
      className={className}
    />
  )
}

interface RefundRateCardProps {
  value: number
  change?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  loading?: boolean
  error?: string
  className?: string
}

export function RefundRateCard({ 
  value, 
  change, 
  changeDirection, 
  loading, 
  error, 
  className 
}: RefundRateCardProps) {
  // For refund rate, down is good (green), up is bad (red)
  const adjustedDirection = changeDirection === 'up' ? 'down' : changeDirection === 'down' ? 'up' : 'neutral'
  
  return (
    <SalesMetricCard
      title='Taxa de Reembolso'
      value={value}
      type='percentage'
      change={change}
      changeDirection={adjustedDirection}
      description='Percentual de reembolsos sobre receita bruta'
      loading={loading}
      error={error}
      className={className}
    />
  )
}

interface SubscriptionsCardProps {
  value: number
  change?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  loading?: boolean
  error?: string
  className?: string
}

export function SubscriptionsCard({ 
  value, 
  change, 
  changeDirection, 
  loading, 
  error, 
  className 
}: SubscriptionsCardProps) {
  return (
    <SalesMetricCard
      title='Assinaturas Ativas'
      value={value}
      type='count'
      change={change}
      changeDirection={changeDirection}
      description='Total de assinaturas ativas ou em trial'
      loading={loading}
      error={error}
      className={className}
    />
  )
}

interface MRRCardProps {
  value: string | number
  change?: number
  changeDirection?: 'up' | 'down' | 'neutral'
  loading?: boolean
  error?: string
  className?: string
}

export function MRRCard({ 
  value, 
  change, 
  changeDirection, 
  loading, 
  error, 
  className 
}: MRRCardProps) {
  return (
    <SalesMetricCard
      title='MRR Realizado'
      value={value}
      type='currency'
      change={change}
      changeDirection={changeDirection}
      description='Receita mensal recorrente no período'
      loading={loading}
      error={error}
      className={className}
    />
  )
}