'use client'

import { AlertTriangle, ArrowLeft, CheckCircle, Shield, XCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { DisputesTable } from '@/components/dashboard/DisputesTable'
import { SalesMetricCard } from '@/components/dashboard/SalesMetricCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getDateRange, formatBRL } from '@/lib/analytics-utils'
import { api } from '@/trpc/react'

// Type definitions for disputes data
interface DisputesSummary {
  total_disputas: number
  cb_losses_brl: string
  abertas: number
  resolvidas: number
  ganhas: number
  perdidas: number
}

// Dynamically import chart components
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

// Disputes filters interface
interface DisputesFilters {
  period: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'custom'
  from: string
  to: string
  timezone: string
  gateway?: string | undefined
  status?: string | undefined
  outcome?: string | undefined
}

function DisputesFilters({
  filters,
  onFiltersChange,
}: {
  filters: DisputesFilters
  onFiltersChange: (filters: DisputesFilters) => void
}) {
  const handlePeriodChange = (period: DisputesFilters['period']) => {
    const dateRange = getDateRange(period, filters.timezone)
    onFiltersChange({
      ...filters,
      period,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    })
  }

  const handleFilterChange = (field: keyof DisputesFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    })
  }

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='text-lg'>Filtros de Disputas e Reembolsos</CardTitle>
        <CardDescription>Ajuste os filtros para personalizar a análise de disputas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          {/* Period Selector */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Período</label>
            <select
              value={filters.period}
              onChange={e => handlePeriodChange(e.target.value as DisputesFilters['period'])}
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

          {/* Gateway Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Gateway</label>
            <select
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

          {/* Status Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Status</label>
            <select
              value={filters.status || ''}
              onChange={e => handleFilterChange('status', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value=''>Todos</option>
              <option value='open'>Em Aberto</option>
              <option value='pending'>Pendente</option>
              <option value='won'>Ganha</option>
              <option value='lost'>Perdida</option>
              <option value='closed'>Fechada</option>
            </select>
          </div>

          {/* Outcome Filter */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Resultado</label>
            <select
              value={filters.outcome || ''}
              onChange={e => handleFilterChange('outcome', e.target.value)}
              className='border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none'
            >
              <option value=''>Todos</option>
              <option value='won'>Vitória</option>
              <option value='lost'>Derrota</option>
              <option value='pending'>Pendente</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Disputes insights component
function DisputesInsights({ data, loading }: { data?: DisputesSummary; loading: boolean }) {
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

  const winRate = data.resolvidas > 0 ? (data.ganhas / data.resolvidas) * 100 : 0
  const resolutionRate = data.total_disputas > 0 ? (data.resolvidas / data.total_disputas) * 100 : 0
  const avgLossPerDispute =
    data.total_disputas > 0 ? parseFloat(data.cb_losses_brl) / data.total_disputas : 0

  return (
    <div className='space-y-4'>
      {/* Win Rate */}
      <div
        className={`rounded-lg border p-4 ${
          winRate >= 70
            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
            : winRate >= 50
              ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        }`}
      >
        <div className='mb-2 flex items-center gap-2'>
          <Shield className='h-5 w-5 text-green-600' />
          <h4 className='font-semibold'>Taxa de Vitória</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>{winRate.toFixed(1)}%</div>
        <div className='text-muted-foreground text-sm'>
          {data.ganhas} de {data.resolvidas} disputas resolvidas
        </div>
      </div>

      {/* Resolution Rate */}
      <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950'>
        <div className='mb-2 flex items-center gap-2'>
          <CheckCircle className='h-5 w-5 text-blue-600' />
          <h4 className='font-semibold'>Taxa de Resolução</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>{resolutionRate.toFixed(1)}%</div>
        <div className='text-muted-foreground text-sm'>
          {data.resolvidas} de {data.total_disputas} disputas resolvidas
        </div>
      </div>

      {/* Average Loss */}
      <div className='rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950'>
        <div className='mb-2 flex items-center gap-2'>
          <XCircle className='h-5 w-5 text-red-600' />
          <h4 className='font-semibold'>Perda Média por Disputa</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>
          {formatBRL(avgLossPerDispute, { locale: 'pt-BR' })}
        </div>
        <div className='text-muted-foreground text-sm'>Impacto financeiro médio por disputa</div>
      </div>

      {/* Risk Assessment */}
      <div className='rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950'>
        <div className='mb-2 flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 text-purple-600' />
          <h4 className='font-semibold'>Nível de Risco</h4>
        </div>
        <div className='mb-1 text-2xl font-bold'>
          {winRate >= 70 ? 'Baixo' : winRate >= 50 ? 'Médio' : 'Alto'}
        </div>
        <div className='text-muted-foreground text-sm'>Baseado na taxa de vitória e volume</div>
      </div>
    </div>
  )
}

export default function DisputesAnalyticsPage() {
  const searchParams = useSearchParams()

  // Initialize filters
  const [filters, setFilters] = useState<DisputesFilters>(() => {
    const period = (searchParams.get('period') as DisputesFilters['period']) || '30d'
    const timezone = searchParams.get('timezone') || 'America/Sao_Paulo'
    const dateRange = getDateRange(period, timezone)

    return {
      period,
      from: searchParams.get('from') || dateRange.from.toISOString(),
      to: searchParams.get('to') || dateRange.to.toISOString(),
      timezone,
      gateway: searchParams.get('gateway') || undefined,
      status: searchParams.get('status') || undefined,
      outcome: searchParams.get('outcome') || undefined,
    }
  })

  // API queries
  const {
    data: disputesData,
    isLoading: disputesLoading,
    error: disputesError,
  } = api.analytics.disputesSummary.useQuery({
    from: filters.from,
    to: filters.to,
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
            <h2 className='text-3xl font-bold tracking-tight'>Disputas e Reembolsos</h2>
            <p className='text-muted-foreground'>
              Análise detalhada de chargebacks, disputas e reembolsos
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <DisputesFilters filters={filters} onFiltersChange={setFilters} />

      {/* Main Metrics */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <SalesMetricCard
          title='Total de Disputas'
          value={disputesData?.total_disputas || 0}
          type='count'
          description='Disputas abertas no período'
          loading={disputesLoading}
          error={disputesError?.message}
        />

        <SalesMetricCard
          title='Perdas Líquidas'
          value={disputesData?.cb_losses_brl || '0'}
          type='currency'
          description='Valor total perdido em disputas'
          loading={disputesLoading}
          error={disputesError?.message}
        />

        <SalesMetricCard
          title='Disputas Abertas'
          value={disputesData?.abertas || 0}
          type='count'
          description='Disputas ainda não resolvidas'
          loading={disputesLoading}
          error={disputesError?.message}
        />

        <SalesMetricCard
          title='Taxa de Vitória'
          value={
            disputesData && disputesData.resolvidas > 0
              ? (disputesData.ganhas / disputesData.resolvidas) * 100
              : 0
          }
          type='percentage'
          description='Percentual de disputas ganhas'
          loading={disputesLoading}
          error={disputesError?.message}
        />
      </div>

      {/* Secondary Metrics */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
        <SalesMetricCard
          title='Disputas Resolvidas'
          value={disputesData?.resolvidas || 0}
          type='count'
          description='Total de disputas finalizadas'
          loading={disputesLoading}
        />

        <SalesMetricCard
          title='Disputas Ganhas'
          value={disputesData?.ganhas || 0}
          type='count'
          description='Disputas resolvidas a favor'
          loading={disputesLoading}
        />

        <SalesMetricCard
          title='Disputas Perdidas'
          value={disputesData?.perdidas || 0}
          type='count'
          description='Disputas resolvidas contra'
          loading={disputesLoading}
        />
      </div>

      {/* Charts and Analysis */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* Disputes Trend Chart */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Disputas</CardTitle>
              <CardDescription>Volume de disputas e perdas ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='text-muted-foreground flex h-[400px] items-center justify-center'>
                <div className='text-center'>
                  <AlertTriangle className='mx-auto mb-4 h-12 w-12 opacity-50' />
                  <p>Gráfico de tendência estará disponível quando conectado à base de dados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Insights de Disputas</CardTitle>
            <CardDescription>Análise de performance e riscos</CardDescription>
          </CardHeader>
          <CardContent>
            <DisputesInsights data={disputesData} loading={disputesLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Visão Geral</TabsTrigger>
          <TabsTrigger value='by-gateway'>Por Gateway</TabsTrigger>
          <TabsTrigger value='by-reason'>Por Motivo</TabsTrigger>
          <TabsTrigger value='timeline'>Timeline</TabsTrigger>
          <TabsTrigger value='export'>Exportar</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Lista Detalhada de Disputas</CardTitle>
              <CardDescription>Todas as disputas no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Note: This would show actual disputes data when connected to database */}
              <div className='text-muted-foreground py-12 text-center'>
                <Shield className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <h3 className='mb-2 text-lg font-semibold'>Lista de Disputas</h3>
                <p className='mx-auto max-w-md'>
                  A tabela detalhada de disputas estará disponível quando conectada à base de dados.
                  Mostrará ID da disputa, gateway, status, valor, resultado e timeline.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='by-gateway' className='space-y-4'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Gateway Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Disputas por Gateway</CardTitle>
                <CardDescription>Performance de disputas por gateway de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {disputesLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className='h-16 w-full' />
                      ))
                    : ['Stripe', 'PayPal', 'Mercado Pago', 'PagSeguro'].map((gateway, index) => (
                        <div
                          key={gateway}
                          className='flex items-center justify-between rounded-lg border p-4'
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className={`h-3 w-3 rounded-full ${
                                index === 0
                                  ? 'bg-blue-500'
                                  : index === 1
                                    ? 'bg-yellow-500'
                                    : index === 2
                                      ? 'bg-cyan-500'
                                      : 'bg-orange-500'
                              }`}
                            />
                            <div>
                              <div className='font-medium'>{gateway}</div>
                              <div className='text-muted-foreground text-sm'>
                                {Math.floor(Math.random() * 20)} disputas
                              </div>
                            </div>
                          </div>
                          <div className='text-right'>
                            <div className='font-bold'>{(Math.random() * 100).toFixed(1)}%</div>
                            <div className='text-muted-foreground text-sm'>taxa de vitória</div>
                          </div>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>

            {/* Gateway Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Recomendações</CardTitle>
                <CardDescription>Sugestões para otimizar gestão de disputas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950'>
                    <div className='flex items-start gap-2'>
                      <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                      <div className='text-sm'>
                        <strong>Mantenha documentação:</strong> Tenha sempre comprovantes de entrega
                        e comunicação com clientes.
                      </div>
                    </div>
                  </div>

                  <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950'>
                    <div className='flex items-start gap-2'>
                      <Shield className='mt-0.5 h-4 w-4 text-blue-600' />
                      <div className='text-sm'>
                        <strong>Responda rapidamente:</strong> Disputas respondidas em até 7 dias
                        têm maior chance de vitória.
                      </div>
                    </div>
                  </div>

                  <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950'>
                    <div className='flex items-start gap-2'>
                      <AlertTriangle className='mt-0.5 h-4 w-4 text-yellow-600' />
                      <div className='text-sm'>
                        <strong>Monitore padrões:</strong> Identifique produtos ou clientes com
                        maior índice de disputas.
                      </div>
                    </div>
                  </div>

                  <div className='rounded-lg border border-purple-200 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950'>
                    <div className='flex items-start gap-2'>
                      <XCircle className='mt-0.5 h-4 w-4 text-purple-600' />
                      <div className='text-sm'>
                        <strong>Prevenção:</strong> Melhore descrições de produtos e políticas de
                        reembolso claras.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='by-reason' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Disputas por Motivo</CardTitle>
              <CardDescription>Principais razões de disputas e chargebacks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-12 text-center'>
                <AlertTriangle className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <h3 className='mb-2 text-lg font-semibold'>Análise por Motivo</h3>
                <p className='mx-auto max-w-md'>
                  Breakdown detalhado por códigos de razão estará disponível quando conectado à base
                  de dados. Incluirá fraude, produto não recebido, qualidade, cancelamento não
                  processado, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='timeline' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Disputas</CardTitle>
              <CardDescription>Histórico e prazos de resolução</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-muted-foreground py-12 text-center'>
                <Shield className='mx-auto mb-4 h-12 w-12 opacity-50' />
                <h3 className='mb-2 text-lg font-semibold'>Timeline Detalhada</h3>
                <p className='mx-auto max-w-md'>
                  Timeline com marcos importantes (abertura, resposta, escalação, resolução) estará
                  disponível quando conectada à base de dados.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='export' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados de Disputas</CardTitle>
              <CardDescription>
                Download dos dados de disputas em diferentes formatos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <Button
                    disabled={!disputesData}
                    onClick={() => {
                      // Export functionality would be implemented here
                      console.log('Export disputes data', disputesData)
                    }}
                  >
                    Exportar Resumo CSV
                  </Button>

                  <Button variant='outline' disabled>
                    Exportar Relatório Detalhado
                    <span className='text-muted-foreground ml-2 text-xs'>(Em breve)</span>
                  </Button>
                </div>

                <div className='text-muted-foreground text-sm'>
                  <p>O arquivo de resumo incluirá:</p>
                  <ul className='mt-2 ml-4 list-disc space-y-1'>
                    <li>Total de disputas por status</li>
                    <li>Perdas líquidas totais</li>
                    <li>Taxa de vitória calculada</li>
                    <li>Breakdown por gateway</li>
                    <li>Tempo médio de resolução</li>
                  </ul>
                </div>

                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950'>
                  <div className='flex items-start gap-2'>
                    <AlertTriangle className='mt-0.5 h-4 w-4 text-yellow-600' />
                    <div className='text-sm'>
                      <strong>Dados Sensíveis:</strong> Os relatórios de disputas podem conter
                      informações sensíveis. Certifique-se de que apenas pessoas autorizadas tenham
                      acesso.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
