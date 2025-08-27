'use client'

import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductsTable } from '@/components/dashboard/ProductsTable'
import {
  SalesMetricCard,
  RevenueCard,
  OrdersCard,
  AOVCard,
  RefundRateCard,
} from '@/components/dashboard/SalesMetricCard'
import { getDateRange } from '@/lib/analytics-utils'
import { api } from '@/trpc/react'

// Dynamically import chart components
const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then(mod => ({ default: mod.RevenueChart })),
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

function ChartSkeleton() {
  return (
    <div className='h-[400px] w-full'>
      <div className='flex h-full items-center justify-center'>
        <Skeleton className='h-64 w-full' />
      </div>
    </div>
  )
}

// Extended filters for products page
interface ProductFilters {
  period: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'custom'
  from: string
  to: string
  timezone: string
  gateway?: string
  country?: string
  productCode?: string // Specific product filter
  limit: number
}

function ProductFilters({
  filters,
  onFiltersChange,
}: {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
}) {
  const t = useTranslations('Analytics')
  const handlePeriodChange = (period: ProductFilters['period']) => {
    const dateRange = getDateRange(period, filters.timezone)
    onFiltersChange({
      ...filters,
      period,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    })
  }

  const handleFilterChange = (field: keyof ProductFilters, value: string | number) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    })
  }

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='text-lg'>{t('products.filters.title')}</CardTitle>
        <CardDescription>{t('products.filters.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'>
          {/* Period Selector */}
          <div className='space-y-2'>
            <label htmlFor='product-period-select' className='text-sm font-medium'>
              {t('filters.period')}
            </label>
            <select
              id='product-period-select'
              value={filters.period}
              onChange={e => handlePeriodChange(e.target.value as ProductFilters['period'])}
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

          {/* Timezone */}
          <div className='space-y-2'>
            <label htmlFor='product-timezone-select' className='text-sm font-medium'>
              {t('filters.timezone')}
            </label>
            <select
              id='product-timezone-select'
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

          {/* Product Code Filter */}
          <div className='space-y-2'>
            <label htmlFor='product-code-filter' className='text-sm font-medium'>
              {t('products.filters.specificProduct')}
            </label>
            <input
              id='product-code-filter'
              type='text'
              placeholder={t('filters.productPlaceholder')}
              value={filters.productCode || ''}
              onChange={e => handleFilterChange('productCode', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            />
          </div>

          {/* Gateway Filter */}
          <div className='space-y-2'>
            <label htmlFor='product-gateway-filter' className='text-sm font-medium'>
              {t('filters.gateway')}
            </label>
            <select
              id='product-gateway-filter'
              value={filters.gateway || ''}
              onChange={e => handleFilterChange('gateway', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value=''>Todos</option>
              <option value='stripe'>Stripe</option>
              <option value='paypal'>PayPal</option>
              <option value='mercadopago'>Mercado Pago</option>
              <option value='pagseguro'>PagSeguro</option>
            </select>
          </div>

          {/* Results Limit */}
          <div className='space-y-2'>
            <label htmlFor='results-limit-select' className='text-sm font-medium'>
              {t('products.filters.results')}
            </label>
            <select
              id='results-limit-select'
              value={filters.limit}
              onChange={e => handleFilterChange('limit', parseInt(e.target.value))}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value={10}>{t('products.filters.top10')}</option>
              <option value={25}>{t('products.filters.top25')}</option>
              <option value={50}>{t('products.filters.top50')}</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProductsAnalyticsPage() {
  const t = useTranslations('Analytics')
  const searchParams = useSearchParams()

  // Initialize filters
  const [filters, setFilters] = useState<ProductFilters>(() => {
    const period = (searchParams.get('period') as ProductFilters['period']) || '30d'
    const timezone = searchParams.get('timezone') || 'America/Sao_Paulo'
    const dateRange = getDateRange(period, timezone)

    const gatewayParam = searchParams.get('gateway')
    const countryParam = searchParams.get('country')
    const productCodeParam = searchParams.get('productCode')

    return {
      period,
      from: searchParams.get('from') || dateRange.from.toISOString(),
      to: searchParams.get('to') || dateRange.to.toISOString(),
      timezone,
      ...(gatewayParam && { gateway: gatewayParam }),
      ...(countryParam && { country: countryParam }),
      ...(productCodeParam && { productCode: productCodeParam }),
      limit: parseInt(searchParams.get('limit') || '25'),
    }
  })

  // API queries
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
  } = api.analytics.productsTop.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    limit: filters.limit,
    product: filters.productCode,
    gateway: filters.gateway,
    country: filters.country,
  })

  // If a specific product is selected, get its detailed metrics
  const { data: productKpis, isLoading: productKpisLoading } = api.analytics.kpis.useQuery(
    {
      from: filters.from,
      to: filters.to,
      tz: filters.timezone,
      product: filters.productCode,
      gateway: filters.gateway,
      country: filters.country,
    },
    {
      enabled: !!filters.productCode, // Only run when a specific product is selected
    }
  )

  const { data: productRevenueData, isLoading: productRevenueLoading } =
    api.analytics.revenueTimeseries.useQuery(
      {
        from: filters.from,
        to: filters.to,
        tz: filters.timezone,
        product: filters.productCode,
        gateway: filters.gateway,
        country: filters.country,
      },
      {
        enabled: !!filters.productCode,
      }
    )

  const { data: productOrdersData, isLoading: productOrdersLoading } =
    api.analytics.ordersTimeseries.useQuery(
      {
        from: filters.from,
        to: filters.to,
        tz: filters.timezone,
        product: filters.productCode,
        gateway: filters.gateway,
        country: filters.country,
      },
      {
        enabled: !!filters.productCode,
      }
    )

  const selectedProduct = filters.productCode
    ? productsData?.find(p => p.product_code === filters.productCode)
    : null

  return (
    <div className='flex-1 space-y-6 p-4 pt-6 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div className='flex items-center gap-4'>
          <Link href='/analytics'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              {t('products.backToDashboard')}
            </Button>
          </Link>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>{t('products.title')}</h2>
            <p className='text-muted-foreground'>
              {filters.productCode
                ? `${t('products.detailedAnalysis')} ${filters.productCode}`
                : t('products.generalAnalysis')}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ProductFilters filters={filters} onFiltersChange={setFilters} />

      {/* Conditional rendering based on whether a specific product is selected */}
      {filters.productCode && selectedProduct ? (
        /* Single Product Analysis */
        <div className='space-y-6'>
          {/* Product Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                {t('filters.product')}: {filters.productCode}
                <span className='text-muted-foreground text-sm font-normal'>
                  ({t('products.singleProduct.overview')})
                </span>
              </CardTitle>
              <CardDescription>{t('products.singleProduct.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <RevenueCard
                  value={productKpis?.receita_bruta_brl || selectedProduct.receita_brl}
                  loading={productKpisLoading}
                  type='gross'
                />
                <OrdersCard
                  value={productKpis?.pedidos || selectedProduct.pedidos}
                  loading={productKpisLoading}
                />
                <AOVCard
                  value={productKpis?.ticket_medio_brl || selectedProduct.ticket_medio_brl}
                  loading={productKpisLoading}
                />
                <RefundRateCard
                  value={parseFloat(productKpis?.refund_rate || selectedProduct.refund_rate)}
                  loading={productKpisLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Charts for Single Product */}
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>
                  {t('products.singleProduct.dailyRevenue')} - {filters.productCode}
                </CardTitle>
                <CardDescription>
                  {t('products.singleProduct.dailyRevenueDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                <RevenueChart
                  data={productRevenueData || []}
                  loading={productRevenueLoading}
                  height={400}
                  locale='pt-BR'
                  timezone={filters.timezone}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {t('products.singleProduct.dailyOrders')} - {filters.productCode}
                </CardTitle>
                <CardDescription>
                  {t('products.singleProduct.dailyOrdersDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                <OrdersChart
                  data={productOrdersData || []}
                  loading={productOrdersLoading}
                  height={400}
                  locale='pt-BR'
                  timezone={filters.timezone}
                />
              </CardContent>
            </Card>
          </div>

          {/* Product Comparison with Others */}
          <Card>
            <CardHeader>
              <CardTitle>{t('products.singleProduct.comparison')}</CardTitle>
              <CardDescription>{t('products.singleProduct.comparisonDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsTable
                data={productsData || []}
                loading={productsLoading}
                {...(productsError?.message && { error: productsError.message })}
                locale='pt-BR'
                showSearch={true}
                maxHeight='400px'
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Multi-Product Analysis */
        <div className='space-y-6'>
          {/* Summary Statistics */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <SalesMetricCard
              title={t('products.multiProduct.totalProducts')}
              value={productsData?.length || 0}
              type='count'
              description={t('products.multiProduct.totalProductsDescription')}
              loading={productsLoading}
            />
            <SalesMetricCard
              title={t('products.multiProduct.totalRevenue')}
              value={productsData?.reduce((sum, p) => sum + parseFloat(p.receita_brl), 0) || 0}
              type='currency'
              description={t('products.multiProduct.totalRevenueDescription')}
              loading={productsLoading}
            />
            <SalesMetricCard
              title={t('products.multiProduct.totalOrders')}
              value={productsData?.reduce((sum, p) => sum + p.pedidos, 0) || 0}
              type='count'
              description={t('products.multiProduct.totalOrdersDescription')}
              loading={productsLoading}
            />
            <SalesMetricCard
              title={t('products.multiProduct.generalAov')}
              value={
                productsData && productsData.length > 0
                  ? productsData.reduce((sum, p) => sum + parseFloat(p.receita_brl), 0) /
                    productsData.reduce((sum, p) => sum + p.pedidos, 0)
                  : 0
              }
              type='aov'
              description={t('products.multiProduct.generalAovDescription')}
              loading={productsLoading}
            />
          </div>

          {/* Products Analysis Tabs */}
          <Tabs defaultValue='table' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='table'>Tabela de Produtos</TabsTrigger>
              <TabsTrigger value='insights'>Insights e Análises</TabsTrigger>
              <TabsTrigger value='export'>Exportar Dados</TabsTrigger>
            </TabsList>

            <TabsContent value='table' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>{t('products.multiProduct.ranking')}</CardTitle>
                  <CardDescription>{t('products.multiProduct.rankingDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProductsTable
                    data={productsData || []}
                    loading={productsLoading}
                    {...(productsError?.message && { error: productsError.message })}
                    locale='pt-BR'
                    showSearch={true}
                    maxHeight='600px'
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value='insights' className='space-y-4'>
              <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 3 Produtos</CardTitle>
                    <CardDescription>Melhores produtos por receita</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {productsLoading ? (
                      <div className='space-y-3'>
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className='h-16 w-full' />
                        ))}
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {(productsData || []).slice(0, 3).map((product, index) => (
                          <div
                            key={product.product_code}
                            className='flex items-center justify-between rounded-lg border p-3'
                          >
                            <div className='flex items-center gap-3'>
                              <div className='bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold'>
                                {index + 1}
                              </div>
                              <div>
                                <div className='font-medium'>{product.product_code}</div>
                                <div className='text-muted-foreground text-sm'>
                                  {product.pedidos} pedidos
                                </div>
                              </div>
                            </div>
                            <div className='text-right'>
                              <div className='text-lg font-bold'>
                                R${' '}
                                {parseFloat(product.receita_brl).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </div>
                              <div className='text-muted-foreground text-sm'>
                                {product.refund_rate}% reembolso
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Performance Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle>Insights de Performance</CardTitle>
                    <CardDescription>Análise automática dos dados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {productsLoading ? (
                      <div className='space-y-3'>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className='h-4 w-full' />
                        ))}
                      </div>
                    ) : productsData && productsData.length > 0 ? (
                      <div className='space-y-3 text-sm'>
                        <div className='rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950'>
                          <strong>Produto com melhor AOV:</strong>{' '}
                          {
                            productsData.reduce((best, current) =>
                              parseFloat(current.ticket_medio_brl) >
                              parseFloat(best.ticket_medio_brl)
                                ? current
                                : best
                            ).product_code
                          }{' '}
                          - R${' '}
                          {Math.max(
                            ...productsData.map(p => parseFloat(p.ticket_medio_brl))
                          ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>

                        <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950'>
                          <strong>Produto com mais pedidos:</strong>{' '}
                          {
                            productsData.reduce((best, current) =>
                              current.pedidos > best.pedidos ? current : best
                            ).product_code
                          }{' '}
                          - {Math.max(...productsData.map(p => p.pedidos)).toLocaleString('pt-BR')}{' '}
                          pedidos
                        </div>

                        <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950'>
                          <strong>Produto com menor taxa de reembolso:</strong>{' '}
                          {
                            productsData.reduce((best, current) =>
                              parseFloat(current.refund_rate) < parseFloat(best.refund_rate)
                                ? current
                                : best
                            ).product_code
                          }{' '}
                          -{' '}
                          {Math.min(...productsData.map(p => parseFloat(p.refund_rate))).toFixed(2)}
                          %
                        </div>

                        <div className='rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900'>
                          <strong>Concentração:</strong> Os top 3 produtos representam{' '}
                          {(
                            (productsData
                              .slice(0, 3)
                              .reduce((sum, p) => sum + parseFloat(p.receita_brl), 0) /
                              productsData.reduce((sum, p) => sum + parseFloat(p.receita_brl), 0)) *
                            100
                          ).toFixed(1)}
                          % da receita total
                        </div>
                      </div>
                    ) : (
                      <p className='text-muted-foreground'>Nenhum dado disponível para análise</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value='export' className='space-y-4'>
              <Card>
                <CardHeader>
                  <CardTitle>Exportar Dados de Produtos</CardTitle>
                  <CardDescription>Download dos dados em diferentes formatos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <Button
                        onClick={() => {
                          // ProductsTable has built-in export functionality
                          // This would trigger the export from the table component
                        }}
                        disabled={!productsData || productsData.length === 0}
                      >
                        Exportar como CSV
                      </Button>

                      <Button variant='outline' disabled>
                        Exportar como Excel
                        <span className='text-muted-foreground ml-2 text-xs'>(Em breve)</span>
                      </Button>
                    </div>

                    <div className='text-muted-foreground text-sm'>
                      <p>
                        O arquivo CSV incluirá todos os produtos mostrados na tabela com as
                        seguintes colunas:
                      </p>
                      <ul className='mt-2 ml-4 list-disc space-y-1'>
                        <li>Código do Produto</li>
                        <li>Número de Pedidos</li>
                        <li>Receita Total (BRL)</li>
                        <li>Ticket Médio (BRL)</li>
                        <li>Taxa de Reembolso (%)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
