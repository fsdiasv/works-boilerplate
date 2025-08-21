'use client'

import dynamic from 'next/dynamic'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import React, { useState, useCallback, useEffect } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RevenueCard, 
  OrdersCard, 
  AOVCard, 
  RefundRateCard, 
  SubscriptionsCard, 
  MRRCard,
  SalesMetricCard
} from '@/components/dashboard/SalesMetricCard'
import { ProductsTable } from '@/components/dashboard/ProductsTable'
import { DisputesTable } from '@/components/dashboard/DisputesTable'
import { getDateRange } from '@/lib/analytics-utils'
import { api } from '@/trpc/react'

// Dynamically import chart components to reduce initial bundle size
const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then(mod => ({ default: mod.RevenueChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const DualAxisRevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then(mod => ({ default: mod.DualAxisRevenueChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const OrdersChart = dynamic(
  () => import('@/components/dashboard/OrdersChart').then(mod => ({ default: mod.OrdersChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const SubscriptionsChart = dynamic(
  () => import('@/components/dashboard/OrdersChart').then(mod => ({ default: mod.SubscriptionsChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

// Global filters interface
interface AnalyticsFilters {
  period: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'custom'
  from: string
  to: string
  timezone: string
  product?: string
  gateway?: string
  country?: string
}

function ChartSkeleton() {
  return (
    <div className='h-[400px] w-full'>
      <div className='flex h-full items-center justify-center'>
        <div className='space-y-4 w-full p-6'>
          <Skeleton className='h-4 w-48 mx-auto' />
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

// Global filters component
interface GlobalFiltersProps {
  filters: AnalyticsFilters
  onFiltersChange: (filters: AnalyticsFilters) => void
}

function GlobalFilters({ filters, onFiltersChange }: GlobalFiltersProps) {
  const handlePeriodChange = (period: AnalyticsFilters['period']) => {
    const dateRange = getDateRange(period, filters.timezone)
    onFiltersChange({
      ...filters,
      period,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    })
  }

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: new Date(value).toISOString(),
      period: 'custom',
    })
  }

  const handleFilterChange = (field: keyof AnalyticsFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    })
  }

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='text-lg'>Filtros</CardTitle>
        <CardDescription>
          Ajuste os filtros para personalizar a visualização dos dados
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Period Selector */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Período</label>
            <select
              value={filters.period}
              onChange={(e) => handlePeriodChange(e.target.value as AnalyticsFilters['period'])}
              className='w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
            >
              <option value='today'>Hoje</option>
              <option value='7d'>Últimos 7 dias</option>
              <option value='30d'>Últimos 30 dias</option>
              <option value='90d'>Últimos 90 dias</option>
              <option value='mtd'>Mês atual</option>
              <option value='custom'>Personalizado</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.period === 'custom' && (
            <>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Data Inicial</label>
                <input
                  type='date'
                  value={filters.from.split('T')[0]}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className='w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Data Final</label>
                <input
                  type='date'
                  value={filters.to.split('T')[0]}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className='w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
                />
              </div>
            </>
          )}

          {/* Timezone */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Fuso Horário</label>
            <select
              value={filters.timezone}
              onChange={(e) => handleFilterChange('timezone', e.target.value)}
              className='w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
            >
              <option value='America/Sao_Paulo'>São Paulo (BRT)</option>
              <option value='UTC'>UTC</option>
              <option value='America/New_York'>New York (EST)</option>
              <option value='Europe/London'>London (GMT)</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Produto</label>
            <input
              type='text'
              placeholder='Código do produto'
              value={filters.product || ''}
              onChange={(e) => handleFilterChange('product', e.target.value)}
              className='w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
            />
          </div>

          {/* Gateway Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Gateway</label>
            <select
              value={filters.gateway || ''}
              onChange={(e) => handleFilterChange('gateway', e.target.value)}
              className='w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
            >
              <option value=''>Todos</option>
              <option value='stripe'>Stripe</option>
              <option value='paypal'>PayPal</option>
              <option value='mercadopago'>Mercado Pago</option>
              <option value='pagseguro'>PagSeguro</option>
            </select>
          </div>

          {/* Country Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>País</label>
            <select
              value={filters.country || ''}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className='w-full px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
            >
              <option value=''>Todos</option>
              <option value='BR'>Brasil</option>
              <option value='US'>Estados Unidos</option>
              <option value='AR'>Argentina</option>
              <option value='MX'>México</option>
              <option value='PT'>Portugal</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Initialize filters from URL params or defaults
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    const period = (searchParams.get('period') as AnalyticsFilters['period']) || '30d'
    const timezone = searchParams.get('timezone') || 'America/Sao_Paulo'
    const dateRange = getDateRange(period, timezone)
    
    return {
      period,
      from: searchParams.get('from') || dateRange.from.toISOString(),
      to: searchParams.get('to') || dateRange.to.toISOString(),
      timezone,
      product: searchParams.get('product') || undefined,
      gateway: searchParams.get('gateway') || undefined,
      country: searchParams.get('country') || undefined,
    }
  })

  // Update URL when filters change
  const updateURL = useCallback((newFilters: AnalyticsFilters) => {
    const params = new URLSearchParams()
    
    params.set('period', newFilters.period)
    params.set('from', newFilters.from)
    params.set('to', newFilters.to)
    params.set('timezone', newFilters.timezone)
    
    if (newFilters.product) params.set('product', newFilters.product)
    if (newFilters.gateway) params.set('gateway', newFilters.gateway)
    if (newFilters.country) params.set('country', newFilters.country)
    
    router.replace(`${pathname}?${params.toString()}`)
  }, [pathname, router])

  const handleFiltersChange = useCallback((newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
    updateURL(newFilters)
  }, [updateURL])

  // API queries
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = api.analytics.kpis.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    product: filters.product,
    gateway: filters.gateway,
    country: filters.country,
  })

  const { data: revenueData, isLoading: revenueLoading } = api.analytics.revenueTimeseries.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    product: filters.product,
    gateway: filters.gateway,
    country: filters.country,
  })

  const { data: ordersData, isLoading: ordersLoading } = api.analytics.ordersTimeseries.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    product: filters.product,
    gateway: filters.gateway,
    country: filters.country,
  })

  const { data: productsData, isLoading: productsLoading } = api.analytics.productsTop.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    limit: 10,
    gateway: filters.gateway,
    country: filters.country,
  })

  const { data: subscriptionsData, isLoading: subscriptionsLoading } = api.analytics.subscriptionsSummary.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    product: filters.product,
    country: filters.country,
  })

  const { data: disputesData, isLoading: disputesLoading } = api.analytics.disputesSummary.useQuery({
    from: filters.from,
    to: filters.to,
  })

  const { data: recentPayments, isLoading: recentPaymentsLoading } = api.analytics.paymentsRecent.useQuery({
    limit: 50,
  })

  return (
    <div className='flex-1 space-y-6 p-4 pt-6 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>
            Dashboard de vendas e assinaturas
          </p>
        </div>
      </div>

      {/* Global Filters */}
      <GlobalFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      {/* KPI Cards Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <RevenueCard
          value={kpis?.receita_bruta_brl || '0'}
          loading={kpisLoading}
          error={kpisError?.message}
          type='gross'
        />
        <RevenueCard
          value={kpis?.receita_liquida_brl || '0'}
          loading={kpisLoading}
          error={kpisError?.message}
          type='net'
        />
        <OrdersCard
          value={kpis?.pedidos || 0}
          loading={kpisLoading}
          error={kpisError?.message}
        />
        <AOVCard
          value={kpis?.ticket_medio_brl || '0'}
          loading={kpisLoading}
          error={kpisError?.message}
        />
      </div>

      {/* Secondary KPIs */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <SalesMetricCard
          title='Impostos'
          value={kpis?.impostos_brl || '0'}
          type='currency'
          description='Total de impostos no período'
          loading={kpisLoading}
          error={kpisError?.message}
        />
        <RefundRateCard
          value={parseFloat(kpis?.refund_rate || '0')}
          loading={kpisLoading}
          error={kpisError?.message}
        />
        <SalesMetricCard
          title='Taxa de Chargeback'
          value={parseFloat(kpis?.cb_rate || '0')}
          type='percentage'
          description='Percentual de chargebacks sobre receita bruta'
          loading={kpisLoading}
          error={kpisError?.message}
        />
        <SalesMetricCard
          title='Pagamentos'
          value={kpis?.pagamentos || 0}
          type='count'
          description='Total de pagamentos aprovados'
          loading={kpisLoading}
          error={kpisError?.message}
        />
      </div>

      {/* Subscription KPIs */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <SubscriptionsCard
          value={subscriptionsData?.assinaturas_ativas || 0}
          loading={subscriptionsLoading}
        />
        <MRRCard
          value={subscriptionsData?.mrr_realizado_brl || '0'}
          loading={subscriptionsLoading}
        />
        <SalesMetricCard
          title='Novas Assinaturas'
          value={subscriptionsData?.novas_assinaturas || 0}
          type='count'
          description='Assinaturas criadas no período'
          loading={subscriptionsLoading}
        />
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Receita Diária</CardTitle>
            <CardDescription>
              Evolução da receita por dia no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <RevenueChart
              data={revenueData || []}
              loading={revenueLoading}
              height={400}
              locale='pt-BR'
              timezone={filters.timezone}
            />
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Diários</CardTitle>
            <CardDescription>
              Número de pedidos por dia
            </CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <OrdersChart
              data={ordersData || []}
              loading={ordersLoading}
              height={400}
              locale='pt-BR'
              timezone={filters.timezone}
              showAverage={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Combined Revenue and Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Receita e Pedidos</CardTitle>
          <CardDescription>
            Visão combinada de receita e volume de pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
          <DualAxisRevenueChart
            data={revenueData || []}
            ordersData={ordersData || []}
            loading={revenueLoading || ordersLoading}
            height={500}
            locale='pt-BR'
          />
        </CardContent>
      </Card>

      {/* Tables Section */}
      <Tabs defaultValue='products' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='products'>Top Produtos</TabsTrigger>
          <TabsTrigger value='disputes'>Disputas</TabsTrigger>
          <TabsTrigger value='payments'>Vendas Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value='products' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Top Produtos por Receita</CardTitle>
              <CardDescription>
                Produtos com maior receita no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsTable
                data={productsData || []}
                loading={productsLoading}
                locale='pt-BR'
                showSearch={true}
                maxHeight='600px'
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='disputes' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Disputas e Chargebacks</CardTitle>
              <CardDescription>
                Resumo de disputas e chargebacks no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-3 mb-6'>
                <SalesMetricCard
                  title='Total de Disputas'
                  value={disputesData?.total_disputas || 0}
                  type='count'
                  loading={disputesLoading}
                />
                <SalesMetricCard
                  title='Perdas Líquidas'
                  value={disputesData?.cb_losses_brl || '0'}
                  type='currency'
                  loading={disputesLoading}
                />
                <SalesMetricCard
                  title='Taxa de Vitória'
                  value={disputesData ? 
                    (disputesData.ganhas / (disputesData.ganhas + disputesData.perdidas) * 100) || 0 
                    : 0
                  }
                  type='percentage'
                  loading={disputesLoading}
                />
              </div>
              {/* Note: DisputesTable would need actual dispute data from a different endpoint */}
              <div className='text-center py-8 text-muted-foreground'>
                <p>Tabela de disputas detalhada estará disponível quando conectada à base de dados</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='payments' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Vendas Recentes</CardTitle>
              <CardDescription>
                Últimos pagamentos aprovados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Recent payments table would go here */}
              <div className='text-center py-8 text-muted-foreground'>
                <p>Tabela de vendas recentes estará disponível quando conectada à base de dados</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}