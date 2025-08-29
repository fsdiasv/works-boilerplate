'use client'

import dynamic from 'next/dynamic'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState, useCallback } from 'react'

import { ProductsTable } from '@/components/dashboard/ProductsTable'
import {
  RevenueCard,
  OrdersCard,
  AOVCard,
  RefundRateCard,
  SubscriptionsCard,
  MRRCard,
  SalesMetricCard,
} from '@/components/dashboard/SalesMetricCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  () =>
    import('@/components/dashboard/RevenueChart').then(mod => ({
      default: mod.DualAxisRevenueChart,
    })),
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

const ProductSalesChart = dynamic(
  () =>
    import('@/components/dashboard/ProductSalesChart').then(mod => ({
      default: mod.ProductSalesChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const ProductRevenueChart = dynamic(
  () =>
    import('@/components/dashboard/ProductRevenueChart').then(mod => ({
      default: mod.ProductRevenueChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const SalesByDayOfWeekChart = dynamic(
  () =>
    import('@/components/dashboard/SalesByDayOfWeekChart').then(mod => ({
      default: mod.SalesByDayOfWeekChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const SalesByHourChart = dynamic(
  () =>
    import('@/components/dashboard/SalesByHourChart').then(mod => ({
      default: mod.SalesByHourChart,
    })),
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
        <div className='w-full space-y-4 p-6'>
          <Skeleton className='mx-auto h-4 w-48' />
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
  const t = useTranslations('Analytics')
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
        <CardTitle className='text-lg'>{t('filters.title')}</CardTitle>
        <CardDescription>{t('filters.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {/* Period Selector */}
          <div className='space-y-2'>
            <label htmlFor='period-select' className='text-sm font-medium'>
              {t('filters.period')}
            </label>
            <select
              id='period-select'
              value={filters.period}
              onChange={e => handlePeriodChange(e.target.value as AnalyticsFilters['period'])}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value='today'>{t('filters.periods.today')}</option>
              <option value='7d'>{t('filters.periods.7d')}</option>
              <option value='30d'>{t('filters.periods.30d')}</option>
              <option value='90d'>{t('filters.periods.90d')}</option>
              <option value='mtd'>{t('filters.periods.mtd')}</option>
              <option value='custom'>{t('filters.periods.custom')}</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {filters.period === 'custom' && (
            <>
              <div className='space-y-2'>
                <label htmlFor='date-from' className='text-sm font-medium'>
                  {t('filters.from')}
                </label>
                <input
                  id='date-from'
                  type='date'
                  value={filters.from.split('T')[0]}
                  onChange={e => handleDateChange('from', e.target.value)}
                  className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
                />
              </div>
              <div className='space-y-2'>
                <label htmlFor='date-to' className='text-sm font-medium'>
                  {t('filters.to')}
                </label>
                <input
                  id='date-to'
                  type='date'
                  value={filters.to.split('T')[0]}
                  onChange={e => handleDateChange('to', e.target.value)}
                  className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
                />
              </div>
            </>
          )}

          {/* Timezone */}
          <div className='space-y-2'>
            <label htmlFor='timezone-select' className='text-sm font-medium'>
              {t('filters.timezone')}
            </label>
            <select
              id='timezone-select'
              value={filters.timezone}
              onChange={e => handleFilterChange('timezone', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value='America/Sao_Paulo'>São Paulo (BRT)</option>
              <option value='UTC'>UTC</option>
              <option value='America/New_York'>New York (EST)</option>
              <option value='Europe/London'>London (GMT)</option>
            </select>
          </div>

          {/* Product Filter */}
          <div className='space-y-2'>
            <label htmlFor='product-filter' className='text-sm font-medium'>
              {t('filters.product')}
            </label>
            <input
              id='product-filter'
              type='text'
              placeholder={t('filters.productPlaceholder')}
              value={filters.product || ''}
              onChange={e => handleFilterChange('product', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            />
          </div>

          {/* Gateway Filter */}
          <div className='space-y-2'>
            <label htmlFor='gateway-filter' className='text-sm font-medium'>
              {t('filters.gateway')}
            </label>
            <select
              id='gateway-filter'
              value={filters.gateway || ''}
              onChange={e => handleFilterChange('gateway', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value=''>{t('filters.gateways.all')}</option>
              <option value='stripe'>Stripe</option>
              <option value='paypal'>PayPal</option>
              <option value='mercadopago'>Mercado Pago</option>
              <option value='pagseguro'>PagSeguro</option>
            </select>
          </div>

          {/* Country Filter */}
          <div className='space-y-2'>
            <label htmlFor='country-filter' className='text-sm font-medium'>
              {t('filters.country')}
            </label>
            <select
              id='country-filter'
              value={filters.country || ''}
              onChange={e => handleFilterChange('country', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value=''>{t('filters.gateways.all')}</option>
              <option value='BR'>{t('filters.countries.BR')}</option>
              <option value='US'>{t('filters.countries.US')}</option>
              <option value='AR'>{t('filters.countries.AR')}</option>
              <option value='MX'>{t('filters.countries.MX')}</option>
              <option value='PT'>{t('filters.countries.PT')}</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const t = useTranslations('Analytics')
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // Initialize filters from URL params or defaults
  const [filters, setFilters] = useState<AnalyticsFilters>(() => {
    const period = (searchParams.get('period') as AnalyticsFilters['period']) || '30d'
    const timezone = searchParams.get('timezone') || 'America/Sao_Paulo'
    const dateRange = getDateRange(period, timezone)

    const productParam = searchParams.get('product')
    const gatewayParam = searchParams.get('gateway')
    const countryParam = searchParams.get('country')

    return {
      period,
      from: searchParams.get('from') || dateRange.from.toISOString(),
      to: searchParams.get('to') || dateRange.to.toISOString(),
      timezone,
      ...(productParam && { product: productParam }),
      ...(gatewayParam && { gateway: gatewayParam }),
      ...(countryParam && { country: countryParam }),
    }
  })

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: AnalyticsFilters) => {
      const params = new URLSearchParams()

      params.set('period', newFilters.period)
      params.set('from', newFilters.from)
      params.set('to', newFilters.to)
      params.set('timezone', newFilters.timezone)

      if (newFilters.product) params.set('product', newFilters.product)
      if (newFilters.gateway) params.set('gateway', newFilters.gateway)
      if (newFilters.country) params.set('country', newFilters.country)

      router.replace(`${pathname}?${params.toString()}`)
    },
    [pathname, router]
  )

  const handleFiltersChange = useCallback(
    (newFilters: AnalyticsFilters) => {
      setFilters(newFilters)
      updateURL(newFilters)
    },
    [updateURL]
  )

  // API queries
  const {
    data: kpis,
    isLoading: kpisLoading,
    error: kpisError,
  } = api.analytics.kpis.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    product: filters.product,
    gateway: filters.gateway,
    country: filters.country,
  })

  const { data: revenueData, isLoading: revenueLoading } = api.analytics.revenueTimeseries.useQuery(
    {
      from: filters.from,
      to: filters.to,
      tz: filters.timezone,
      product: filters.product,
      gateway: filters.gateway,
      country: filters.country,
    }
  )

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

  const { data: subscriptionsData, isLoading: subscriptionsLoading } =
    api.analytics.subscriptionsSummary.useQuery({
      from: filters.from,
      to: filters.to,
      tz: filters.timezone,
      product: filters.product,
      country: filters.country,
    })

  const { data: disputesData, isLoading: disputesLoading } = api.analytics.disputesSummary.useQuery(
    {
      from: filters.from,
      to: filters.to,
    }
  )

  const { data: recentPayments, isLoading: recentPaymentsLoading } =
    api.analytics.paymentsRecent.useQuery({
      limit: 50,
    })

  const { data: salesByProductData, isLoading: salesByProductLoading } =
    api.analytics.salesByProduct.useQuery({
      from: filters.from,
      to: filters.to,
      tz: filters.timezone,
      product: filters.product,
      gateway: filters.gateway,
      country: filters.country,
    })

  const { data: revenueByProductData, isLoading: revenueByProductLoading } =
    api.analytics.revenueByProduct.useQuery({
      from: filters.from,
      to: filters.to,
      tz: filters.timezone,
      product: filters.product,
      gateway: filters.gateway,
      country: filters.country,
    })

  const { data: salesByDayOfWeekData, isLoading: salesByDayOfWeekLoading } =
    api.analytics.salesByDayOfWeek.useQuery({
      from: filters.from,
      to: filters.to,
      tz: filters.timezone,
      product: filters.product,
      gateway: filters.gateway,
      country: filters.country,
    })

  const { data: salesByHourData, isLoading: salesByHourLoading } =
    api.analytics.salesByHour.useQuery({
      from: filters.from,
      to: filters.to,
      tz: filters.timezone,
      product: filters.product,
      gateway: filters.gateway,
      country: filters.country,
    })

  return (
    <div className='flex-1 space-y-6 p-4 pt-6 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Analytics</h2>
          <p className='text-muted-foreground'>Dashboard de vendas e assinaturas</p>
        </div>
      </div>

      {/* Global Filters */}
      <GlobalFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* KPI Cards Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <SalesMetricCard
          title='Receita Bruta'
          value={kpis?.receita_bruta_brl || '0'}
          type='currency'
          description='Total de vendas antes de impostos e reembolsos'
          loading={kpisLoading}
          currencyBreakdown={kpis?.receita_por_moeda || undefined}
          {...(kpisError?.message && { error: kpisError.message })}
        />
        <RevenueCard
          value={kpis?.receita_liquida_brl || '0'}
          loading={kpisLoading}
          {...(kpisError?.message && { error: kpisError.message })}
          type='net'
        />
        <OrdersCard
          value={kpis?.pedidos || 0}
          loading={kpisLoading}
          {...(kpisError?.message && { error: kpisError.message })}
        />
        <AOVCard
          value={kpis?.ticket_medio_brl || '0'}
          loading={kpisLoading}
          {...(kpisError?.message && { error: kpisError.message })}
        />
      </div>

      {/* Secondary KPIs */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <SalesMetricCard
          title='Impostos'
          value={kpis?.impostos_brl || '0'}
          type='currency'
          description='Total de impostos no período (2.5%)'
          loading={kpisLoading}
          currencyBreakdown={kpis?.impostos_por_moeda || undefined}
          {...(kpisError?.message && { error: kpisError.message })}
        />
        <RefundRateCard
          value={parseFloat(kpis?.refund_rate || '0')}
          loading={kpisLoading}
          {...(kpisError?.message && { error: kpisError.message })}
        />
        <SalesMetricCard
          title='Taxa de Chargeback'
          value={parseFloat(kpis?.cb_rate || '0')}
          type='percentage'
          description='Percentual de chargebacks sobre receita bruta'
          loading={kpisLoading}
          {...(kpisError?.message && { error: kpisError.message })}
        />
        <SalesMetricCard
          title='Pagamentos'
          value={kpis?.pagamentos || 0}
          type='count'
          description='Total de pagamentos aprovados'
          loading={kpisLoading}
          {...(kpisError?.message && { error: kpisError.message })}
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
            <CardDescription>Evolução da receita por dia no período selecionado</CardDescription>
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
            <CardDescription>Número de pedidos por dia</CardDescription>
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
          <CardTitle>{t('charts.revenueAndOrders')}</CardTitle>
          <CardDescription>{t('charts.revenueAndOrdersDescription')}</CardDescription>
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

      {/* Product Analysis Charts */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Sales by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Produto</CardTitle>
            <CardDescription>Distribuição de vendas por produto no período</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <ProductSalesChart
              data={salesByProductData || []}
              loading={salesByProductLoading}
              height={400}
              locale='pt-BR'
            />
          </CardContent>
        </Card>

        {/* Revenue by Product */}
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por Produto</CardTitle>
            <CardDescription>Distribuição de receita por produto no período</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <ProductRevenueChart
              data={revenueByProductData || []}
              loading={revenueByProductLoading}
              height={400}
              locale='pt-BR'
            />
          </CardContent>
        </Card>
      </div>

      {/* Time-Based Sales Charts */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Sales by Day of Week */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia da Semana</CardTitle>
            <CardDescription>Distribuição de vendas por dia da semana</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <SalesByDayOfWeekChart
              data={salesByDayOfWeekData || []}
              loading={salesByDayOfWeekLoading}
              height={400}
              locale='pt-BR'
            />
          </CardContent>
        </Card>

        {/* Sales by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Horário</CardTitle>
            <CardDescription>Distribuição de vendas por hora do dia</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <SalesByHourChart
              data={salesByHourData || []}
              loading={salesByHourLoading}
              height={400}
              locale='pt-BR'
            />
          </CardContent>
        </Card>
      </div>

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
              <CardDescription>Produtos com maior receita no período selecionado</CardDescription>
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
              <CardDescription>Resumo de disputas e chargebacks no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
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
                  value={
                    disputesData
                      ? (disputesData.ganhas / (disputesData.ganhas + disputesData.perdidas)) *
                          100 || 0
                      : 0
                  }
                  type='percentage'
                  loading={disputesLoading}
                />
              </div>
              {/* Note: DisputesTable would need actual dispute data from a different endpoint */}
              <div className='text-muted-foreground py-8 text-center'>
                <p>
                  Tabela de disputas detalhada estará disponível quando conectada à base de dados
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='payments' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Vendas Recentes</CardTitle>
              <CardDescription>Últimos pagamentos aprovados</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Recent payments table would go here */}
              <div className='text-muted-foreground py-8 text-center'>
                <p>Tabela de vendas recentes estará disponível quando conectada à base de dados</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
