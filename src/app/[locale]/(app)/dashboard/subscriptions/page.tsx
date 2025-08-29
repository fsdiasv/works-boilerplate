'use client'

import { ArrowLeft, TrendingDown, TrendingUp, Users } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { SalesMetricCard, SubscriptionsCard, MRRCard } from '@/components/dashboard/SalesMetricCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDateRange, formatBRL } from '@/lib/analytics-utils'
import { api } from '@/trpc/react'

// Dynamically import chart components
const SubscriptionsChart = dynamic(
  () =>
    import('@/components/dashboard/OrdersChart').then(mod => ({ default: mod.SubscriptionsChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
)

const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then(mod => ({ default: mod.RevenueChart })),
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

// Subscription filters interface
interface SubscriptionFilters {
  period: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'custom'
  from: string
  to: string
  timezone: string
  product?: string
  country?: string
}

function SubscriptionFilters({
  filters,
  onFiltersChange,
}: {
  filters: SubscriptionFilters
  onFiltersChange: (filters: SubscriptionFilters) => void
}) {
  const handlePeriodChange = (period: SubscriptionFilters['period']) => {
    const dateRange = getDateRange(period, filters.timezone)
    onFiltersChange({
      ...filters,
      period,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    })
  }

  const handleFilterChange = (field: keyof SubscriptionFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    })
  }

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='text-lg'>Filtros de Assinaturas</CardTitle>
        <CardDescription>
          Ajuste os filtros para personalizar a análise de assinaturas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {/* Period Selector */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Período</label>
            <select
              value={filters.period}
              onChange={e => handlePeriodChange(e.target.value as SubscriptionFilters['period'])}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value='today'>Hoje</option>
              <option value='7d'>Últimos 7 dias</option>
              <option value='30d'>Últimos 30 dias</option>
              <option value='90d'>Últimos 90 dias</option>
              <option value='mtd'>Mês atual</option>
              <option value='custom'>Personalizado</option>
            </select>
          </div>

          {/* Timezone */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Fuso Horário</label>
            <select
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
            <label className='text-sm font-medium'>Produto</label>
            <input
              type='text'
              placeholder='Código do produto'
              value={filters.product || ''}
              onChange={e => handleFilterChange('product', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            />
          </div>

          {/* Country Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>País</label>
            <select
              value={filters.country || ''}
              onChange={e => handleFilterChange('country', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
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

// Subscription data interface
interface SubscriptionSummary {
  assinaturas_ativas: number
  mrr_realizado_brl: string
  novas_assinaturas: number
  churn_assinaturas: number
}

// Subscription metrics component
function SubscriptionMetrics({
  data,
  loading,
  error,
}: {
  data: SubscriptionSummary | undefined
  loading: boolean
  error?: string | undefined
}) {
  const churnRate = data
    ? (data.churn_assinaturas / (data.assinaturas_ativas + data.churn_assinaturas)) * 100
    : 0

  const growthRate = data
    ? ((data.novas_assinaturas - data.churn_assinaturas) / data.assinaturas_ativas) * 100
    : 0

  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <SubscriptionsCard value={data?.assinaturas_ativas || 0} loading={loading} error={error ?? undefined} />

      <MRRCard value={data?.mrr_realizado_brl || '0'} loading={loading} error={error ?? undefined} />

      <SalesMetricCard
        title='Novas Assinaturas'
        value={data?.novas_assinaturas || 0}
        type='count'
        description='Assinaturas criadas no período'
        loading={loading}
        error={error}
      />

      <SalesMetricCard
        title='Churn'
        value={data?.churn_assinaturas || 0}
        type='count'
        description='Assinaturas canceladas no período'
        loading={loading}
        error={error}
      />
    </div>
  )
}

// Subscription insights component
function SubscriptionInsights({ data, loading }: { data: SubscriptionSummary | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-16 w-full' />
        ))}
      </div>
    )
  }

  if (!data) {
    return <p className='text-muted-foreground'>Nenhum dado disponível para análise</p>
  }

  const churnRate =
    data.assinaturas_ativas > 0
      ? (data.churn_assinaturas / (data.assinaturas_ativas + data.churn_assinaturas)) * 100
      : 0

  const growthRate =
    data.assinaturas_ativas > 0
      ? ((data.novas_assinaturas - data.churn_assinaturas) / data.assinaturas_ativas) * 100
      : 0

  const netGrowth = data.novas_assinaturas - data.churn_assinaturas
  const avgMrrPerSubscription =
    data.assinaturas_ativas > 0 ? parseFloat(data.mrr_realizado_brl) / data.assinaturas_ativas : 0

  return (
    <div className='space-y-4'>
      {/* Growth Rate */}
      <div
        className={`rounded-lg border p-4 ${
          growthRate > 0
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
            : growthRate < 0
              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
              : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
        }`}
      >
        <div className='mb-2 flex items-center gap-2'>
          {growthRate > 0 ? (
            <TrendingUp className='h-5 w-5 text-green-600' />
          ) : growthRate < 0 ? (
            <TrendingDown className='h-5 w-5 text-red-600' />
          ) : (
            <Users className='h-5 w-5 text-gray-600' />
          )}
          <h4 className='font-semibold'>Taxa de Crescimento</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>
          {growthRate > 0 ? '+' : ''}
          {growthRate.toFixed(2)}%
        </div>
        <div className='text-muted-foreground text-sm'>
          {netGrowth > 0 ? `+${netGrowth}` : netGrowth} assinaturas líquidas no período
        </div>
      </div>

      {/* Churn Rate */}
      <div
        className={`rounded-lg border p-4 ${
          churnRate < 5
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
            : churnRate < 10
              ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        }`}
      >
        <div className='mb-2 flex items-center gap-2'>
          <TrendingDown className='h-5 w-5 text-red-600' />
          <h4 className='font-semibold'>Taxa de Churn</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>{churnRate.toFixed(2)}%</div>
        <div className='text-muted-foreground text-sm'>
          {data.churn_assinaturas} cancelamentos no período
        </div>
      </div>

      {/* ARPU */}
      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950'>
        <div className='mb-2 flex items-center gap-2'>
          <Users className='h-5 w-5 text-blue-600' />
          <h4 className='font-semibold'>Receita Média por Usuário</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>
          {formatBRL(avgMrrPerSubscription, { locale: 'pt-BR' })}
        </div>
        <div className='text-muted-foreground text-sm'>MRR / Assinaturas Ativas</div>
      </div>

      {/* Health Score */}
      <div className='rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950'>
        <div className='mb-2 flex items-center gap-2'>
          <TrendingUp className='h-5 w-5 text-purple-600' />
          <h4 className='font-semibold'>Score de Saúde</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>
          {Math.max(0, Math.min(100, 100 - churnRate * 2 + growthRate)).toFixed(0)}/100
        </div>
        <div className='text-muted-foreground text-sm'>Baseado em crescimento e churn</div>
      </div>
    </div>
  )
}

export default function SubscriptionsAnalyticsPage() {
  const searchParams = useSearchParams()

  // Initialize filters
  const [filters, setFilters] = useState<SubscriptionFilters>(() => {
    const period = (searchParams.get('period') as SubscriptionFilters['period']) || '30d'
    const timezone = searchParams.get('timezone') || 'America/Sao_Paulo'
    const dateRange = getDateRange(period, timezone)

    const productParam = searchParams.get('product')
    const countryParam = searchParams.get('country')

    return {
      period,
      from: searchParams.get('from') || dateRange.from.toISOString(),
      to: searchParams.get('to') || dateRange.to.toISOString(),
      timezone,
      ...(productParam && { product: productParam }),
      ...(countryParam && { country: countryParam }),
    }
  })

  // API queries
  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
  } = api.analytics.subscriptionsSummary.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    product: filters.product,
    country: filters.country,
  })

  // Get MRR timeseries data (using revenue timeseries filtered by subscriptions)
  const { data: mrrData, isLoading: mrrLoading } = api.analytics.revenueTimeseries.useQuery({
    from: filters.from,
    to: filters.to,
    tz: filters.timezone,
    product: filters.product,
    country: filters.country,
  })

  return (
    <div className='flex-1 space-y-6 p-4 pt-6 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between space-y-2'>
        <div className='flex items-center gap-4'>
          <Link href='/analytics'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Voltar ao Dashboard
            </Button>
          </Link>
          <div>
            <h2 className='text-3xl font-bold tracking-tight'>Análise de Assinaturas</h2>
            <p className='text-muted-foreground'>Métricas detalhadas de crescimento, churn e MRR</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <SubscriptionFilters filters={filters} onFiltersChange={setFilters} />

      {/* Main Metrics */}
      <SubscriptionMetrics
        data={subscriptionsData}
        loading={subscriptionsLoading}
        error={subscriptionsError?.message}
      />

      {/* Secondary Metrics */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <SalesMetricCard
          title='Crescimento Líquido'
          value={
            subscriptionsData
              ? subscriptionsData.novas_assinaturas - subscriptionsData.churn_assinaturas
              : 0
          }
          type='count'
          description='Novas assinaturas - Churn no período'
          loading={subscriptionsLoading}
          changeDirection={
            subscriptionsData &&
            subscriptionsData.novas_assinaturas - subscriptionsData.churn_assinaturas > 0
              ? 'up'
              : 'down'
          }
        />

        <SalesMetricCard
          title='Taxa de Churn'
          value={
            subscriptionsData && subscriptionsData.assinaturas_ativas > 0
              ? (subscriptionsData.churn_assinaturas /
                  (subscriptionsData.assinaturas_ativas + subscriptionsData.churn_assinaturas)) *
                100
              : 0
          }
          type='percentage'
          description='Percentual de cancelamentos'
          loading={subscriptionsLoading}
        />

        <SalesMetricCard
          title='ARPU'
          value={
            subscriptionsData && subscriptionsData.assinaturas_ativas > 0
              ? parseFloat(subscriptionsData.mrr_realizado_brl) /
                subscriptionsData.assinaturas_ativas
              : 0
          }
          type='currency'
          description='Receita média por usuário'
          loading={subscriptionsLoading}
        />
      </div>

      {/* Charts and Analysis */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* MRR Chart */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Evolução do MRR</CardTitle>
              <CardDescription>Receita mensal recorrente ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <RevenueChart
                data={mrrData || []}
                loading={mrrLoading}
                height={400}
                locale='pt-BR'
                timezone={filters.timezone}
              />
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Insights de Assinaturas</CardTitle>
            <CardDescription>Análise automática da saúde das assinaturas</CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionInsights data={subscriptionsData} loading={subscriptionsLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue='trends' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='trends'>Tendências</TabsTrigger>
          <TabsTrigger value='cohorts'>Coortes</TabsTrigger>
          <TabsTrigger value='retention'>Retenção</TabsTrigger>
          <TabsTrigger value='export'>Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value='trends' className='space-y-4'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Subscription Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Tendências de Crescimento</CardTitle>
                <CardDescription>Novas assinaturas vs. cancelamentos</CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                {/* This would use the SubscriptionsChart component */}
                <div className='text-muted-foreground flex h-[400px] items-center justify-center'>
                  <p>Gráfico de tendências estará disponível quando conectado à base de dados</p>
                </div>
              </CardContent>
            </Card>

            {/* Growth Predictions */}
            <Card>
              <CardHeader>
                <CardTitle>Projeções de Crescimento</CardTitle>
                <CardDescription>Estimativas baseadas em tendências atuais</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className='space-y-3'>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className='h-16 w-full' />
                    ))}
                  </div>
                ) : subscriptionsData ? (
                  <div className='space-y-4'>
                    <div className='rounded-lg border p-4'>
                      <h4 className='mb-2 font-semibold'>Próximo Mês (Projeção)</h4>
                      <div className='grid grid-cols-2 gap-4 text-sm'>
                        <div>
                          <div className='text-muted-foreground'>Assinaturas Ativas</div>
                          <div className='text-lg font-bold'>
                            {Math.round(
                              subscriptionsData.assinaturas_ativas +
                                (subscriptionsData.novas_assinaturas -
                                  subscriptionsData.churn_assinaturas)
                            ).toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div>
                          <div className='text-muted-foreground'>MRR Estimado</div>
                          <div className='text-lg font-bold'>
                            {formatBRL(
                              parseFloat(subscriptionsData.mrr_realizado_brl) * 1.05, // 5% growth assumption
                              { locale: 'pt-BR' }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className='rounded-lg border p-4'>
                      <h4 className='mb-2 font-semibold'>Meta Recomendada</h4>
                      <div className='text-muted-foreground mb-2 text-sm'>
                        Para manter crescimento saudável
                      </div>
                      <div className='text-lg font-bold text-green-600'>Taxa de Churn {'<'} 5%</div>
                      <div className='text-lg font-bold text-blue-600'>
                        Crescimento Mensal {'>'} 10%
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className='text-muted-foreground'>Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='cohorts' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Análise de Coortes</CardTitle>
              <CardDescription>Análise de retenção por período de entrada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-12 text-center'>
                <Users className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <h3 className='mb-2 text-lg font-semibold'>Análise de Coortes</h3>
                <p className='mx-auto max-w-md'>
                  A análise de coortes detalhada estará disponível quando conectada à base de dados.
                  Mostrará retenção de usuários agrupados por período de entrada.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='retention' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Análise de Retenção</CardTitle>
              <CardDescription>Métricas de retenção e engajamento de assinantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-12 text-center'>
                <TrendingUp className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <h3 className='mb-2 text-lg font-semibold'>Análise de Retenção</h3>
                <p className='mx-auto max-w-md'>
                  Métricas detalhadas de retenção, incluindo curvas de sobrevivência e análise de
                  lifetime value, estarão disponíveis quando conectadas à base de dados.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='export' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados de Assinaturas</CardTitle>
              <CardDescription>
                Download dos dados de assinaturas em diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <Button
                    disabled={!subscriptionsData}
                    onClick={() => {
                      // Export functionality would be implemented here
                      console.log('Export subscriptions data', subscriptionsData)
                    }}
                  >
                    Exportar Resumo CSV
                  </Button>

                  <Button variant='outline' disabled>
                    Exportar Relatório Completo
                    <span className='text-muted-foreground ml-2 text-xs'>(Em breve)</span>
                  </Button>
                </div>

                <div className='text-muted-foreground text-sm'>
                  <p>O arquivo de resumo incluirá:</p>
                  <ul className='mt-2 ml-4 list-disc space-y-1'>
                    <li>Assinaturas ativas no período</li>
                    <li>Novas assinaturas criadas</li>
                    <li>Assinaturas canceladas (churn)</li>
                    <li>MRR realizado</li>
                    <li>Métricas calculadas (ARPU, taxa de churn, etc.)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
