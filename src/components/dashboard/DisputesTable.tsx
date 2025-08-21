'use client'

import { AlertTriangle, ArrowUpDown, CheckCircle, Download, Search, XCircle } from 'lucide-react'
import React, { useState, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBRL, formatDateWithTimezone, exportToCSV, downloadCSV } from '@/lib/analytics-utils'
import { cn } from '@/lib/utils'

interface DisputeData {
  id: string
  gateway_dispute_id: string
  gateway: string
  type: string
  status: string
  reason_code?: string
  reason_description?: string
  amount_brl: string
  net_loss_brl?: string
  opened_at: string
  resolved_at?: string
  outcome?: string
  product_code?: string
  order_id?: string
  user_email?: string
}

interface DisputesTableProps {
  data: DisputeData[]
  loading?: boolean
  error?: string
  locale?: string
  timezone?: string
  onExport?: () => void
  showSearch?: boolean
  maxHeight?: string
  className?: string
}

type SortField = keyof DisputeData | 'amount' | 'net_loss'
type SortDirection = 'asc' | 'desc'

/**
 * Disputes table displaying chargebacks and disputes with filtering and export capabilities
 */
export function DisputesTable({
  data = [],
  loading = false,
  error,
  locale = 'pt-BR',
  timezone = 'America/Sao_Paulo',
  onExport,
  showSearch = true,
  maxHeight = '500px',
  className,
}: DisputesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('opened_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(data.map(item => item.status))]
    return statuses.sort()
  }, [data])

  // Filter and sort data
  const processedData = useMemo(() => {
    // Start with a copy to avoid mutating props
    let filtered = [...data]

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.gateway_dispute_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.gateway.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reason_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting (safe since we already have a copy)
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof DisputeData]
      let bValue: any = b[sortField as keyof DisputeData]

      // Handle special sort fields
      if (sortField === 'amount') {
        aValue = parseFloat(a.amount_brl) || 0
        bValue = parseFloat(b.amount_brl) || 0
      } else if (sortField === 'net_loss') {
        aValue = parseFloat(a.net_loss_brl || '0') || 0
        bValue = parseFloat(b.net_loss_brl || '0') || 0
      }

      // Handle dates
      if (sortField === 'opened_at' || sortField === 'resolved_at') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      }

      // Handle numeric values
      if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
        aValue = parseFloat(aValue)
        bValue = parseFloat(bValue || '0')
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      // String comparison
      const aStr = String(aValue || '').toLowerCase()
      const bStr = String(bValue || '').toLowerCase()
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })

    return filtered
  }, [data, searchTerm, sortField, sortDirection, statusFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc') // Default to descending for new fields
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport()
      return
    }

    // Default export implementation
    const exportData = processedData.map(item => ({
      'ID da Disputa': item.gateway_dispute_id,
      'Gateway': item.gateway,
      'Tipo': item.type,
      'Status': item.status,
      'Código da Razão': item.reason_code || '',
      'Descrição': item.reason_description || '',
      'Valor (R$)': item.amount_brl,
      'Perda Líquida (R$)': item.net_loss_brl || '',
      'Resultado': item.outcome || '',
      'Produto': item.product_code || '',
      'Pedido': item.order_id || '',
      'Cliente': item.user_email || '',
      'Aberta em': formatDateWithTimezone(item.opened_at, timezone, locale, 'dd/MM/yyyy HH:mm'),
      'Resolvida em': item.resolved_at 
        ? formatDateWithTimezone(item.resolved_at, timezone, locale, 'dd/MM/yyyy HH:mm')
        : '',
    }))

    const csvContent = exportToCSV(exportData, 'disputas')
    downloadCSV(csvContent, `disputas_${new Date().toISOString().split('T')[0]}`)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className='h-4 w-4 text-muted-foreground' />
    }
    
    return (
      <ArrowUpDown 
        className={cn(
          'h-4 w-4',
          sortDirection === 'asc' ? 'text-blue-500 rotate-180' : 'text-blue-500'
        )} 
      />
    )
  }

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase()
    
    switch (statusLower) {
      case 'open':
      case 'pending':
      case 'under_review':
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            <AlertTriangle className='w-3 h-3 mr-1' />
            Em Aberto
          </Badge>
        )
      case 'won':
      case 'resolved_won':
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Ganha
          </Badge>
        )
      case 'lost':
      case 'resolved_lost':
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
            <XCircle className='w-3 h-3 mr-1' />
            Perdida
          </Badge>
        )
      case 'closed':
        return (
          <Badge variant='secondary'>
            Fechada
          </Badge>
        )
      default:
        return (
          <Badge variant='outline'>
            {status}
          </Badge>
        )
    }
  }

  const getGatewayBadge = (gateway: string) => {
    const colors: Record<string, string> = {
      stripe: 'bg-blue-50 text-blue-700 border-blue-200',
      paypal: 'bg-blue-50 text-blue-700 border-blue-200',
      mercadopago: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      pagseguro: 'bg-orange-50 text-orange-700 border-orange-200',
    }
    
    const colorClass = colors[gateway.toLowerCase()] || 'bg-gray-50 text-gray-700 border-gray-200'
    
    return (
      <Badge variant='outline' className={colorClass}>
        {gateway}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className='flex items-center justify-between gap-4'>
          <Skeleton className='h-10 w-64' />
          <div className='flex gap-2'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-32' />
          </div>
        </div>
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className='h-4 w-20' />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <TableCell key={i}>
                      <Skeleton className='h-4 w-16' />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('rounded-md border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-950', className)}>
        <div className='text-red-700 dark:text-red-300 font-medium mb-2'>
          Erro ao carregar disputas
        </div>
        <div className='text-red-600 dark:text-red-400 text-sm'>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filters Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div className='flex flex-col sm:flex-row gap-4 flex-1'>
          {showSearch && (
            <div className='relative flex-1 max-w-sm'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                placeholder='Buscar por ID, gateway, produto...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9'
              />
            </div>
          )}
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring'
          >
            <option value='all'>Todos os Status</option>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        
        <Button
          variant='outline'
          size='sm'
          onClick={handleExport}
          disabled={processedData.length === 0}
        >
          <Download className='mr-2 h-4 w-4' />
          Exportar CSV
        </Button>
      </div>

      {/* Results Summary */}
      <div className='text-sm text-muted-foreground'>
        {searchTerm || statusFilter !== 'all' ? (
          <>
            Mostrando {processedData.length} de {data.length} disputas
            {processedData.length !== data.length && (
              <span className='ml-2 text-blue-600 dark:text-blue-400'>
                (filtrado)
              </span>
            )}
          </>
        ) : (
          `${data.length} disputas encontradas`
        )}
      </div>

      {/* Table */}
      <div 
        className='rounded-md border overflow-auto'
        style={{ maxHeight }}
      >
        <Table>
          <TableHeader className='sticky top-0 bg-background z-10'>
            <TableRow>
              <TableHead className='min-w-[140px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('gateway_dispute_id')}
                >
                  ID da Disputa
                  {getSortIcon('gateway_dispute_id')}
                </Button>
              </TableHead>
              <TableHead className='min-w-[100px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('gateway')}
                >
                  Gateway
                  {getSortIcon('gateway')}
                </Button>
              </TableHead>
              <TableHead className='min-w-[120px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('status')}
                >
                  Status
                  {getSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className='text-right min-w-[100px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('amount')}
                >
                  Valor
                  {getSortIcon('amount')}
                </Button>
              </TableHead>
              <TableHead className='text-right min-w-[120px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('net_loss')}
                >
                  Perda Líquida
                  {getSortIcon('net_loss')}
                </Button>
              </TableHead>
              <TableHead className='min-w-[120px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('opened_at')}
                >
                  Aberta em
                  {getSortIcon('opened_at')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-8 text-muted-foreground'>
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhuma disputa encontrada' 
                    : 'Nenhum dado disponível'
                  }
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((dispute) => (
                <TableRow key={dispute.id} className='hover:bg-muted/50'>
                  <TableCell className='font-mono text-sm'>
                    <div>
                      <div className='font-semibold'>{dispute.gateway_dispute_id}</div>
                      {dispute.type && (
                        <div className='text-xs text-muted-foreground mt-1'>
                          {dispute.type}
                        </div>
                      )}
                      {dispute.reason_code && (
                        <div className='text-xs text-muted-foreground mt-1'>
                          {dispute.reason_code}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getGatewayBadge(dispute.gateway)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(dispute.status)}
                    {dispute.outcome && (
                      <div className='text-xs text-muted-foreground mt-1'>
                        {dispute.outcome}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatBRL(dispute.amount_brl, { locale })}
                  </TableCell>
                  <TableCell className='text-right'>
                    {dispute.net_loss_brl ? (
                      <span className='font-medium text-red-600 dark:text-red-400'>
                        {formatBRL(dispute.net_loss_brl, { locale })}
                      </span>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      {formatDateWithTimezone(dispute.opened_at, timezone, locale, 'dd/MM/yyyy')}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {formatDateWithTimezone(dispute.opened_at, timezone, locale, 'HH:mm')}
                    </div>
                    {dispute.resolved_at && (
                      <div className='text-xs text-green-600 dark:text-green-400 mt-1'>
                        Resolvida: {formatDateWithTimezone(dispute.resolved_at, timezone, locale, 'dd/MM')}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Summary */}
      {processedData.length > 0 && (
        <div className='text-xs text-muted-foreground border-t pt-2'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <span className='font-medium'>Total de Disputas:</span>{' '}
              {processedData.length}
            </div>
            <div>
              <span className='font-medium'>Valor Total Disputado:</span>{' '}
              {formatBRL(
                processedData.reduce((sum, item) => sum + parseFloat(item.amount_brl), 0),
                { locale }
              )}
            </div>
            <div>
              <span className='font-medium'>Perdas Líquidas:</span>{' '}
              <span className='text-red-600 dark:text-red-400'>
                {formatBRL(
                  processedData.reduce((sum, item) => sum + parseFloat(item.net_loss_brl || '0'), 0),
                  { locale }
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}