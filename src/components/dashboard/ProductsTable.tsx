'use client'

import { ArrowUpDown, Download, Search } from 'lucide-react'
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
import { formatBRL, exportToCSV, downloadCSV } from '@/lib/analytics-utils'
import { cn } from '@/lib/utils'

interface ProductData {
  product_code: string
  pedidos: number
  receita_brl: string
  ticket_medio_brl: string
  refund_rate: string
  // Optional additional fields
  nome_produto?: string
  categoria?: string
  status?: 'active' | 'inactive' | 'discontinued'
}

interface ProductsTableProps {
  data: ProductData[]
  loading?: boolean
  error?: string
  locale?: string
  onExport?: () => void
  showSearch?: boolean
  maxHeight?: string
  className?: string
}

type SortField = keyof ProductData
type SortDirection = 'asc' | 'desc'

/**
 * Products table displaying top products by revenue with sorting and export capabilities
 */
export function ProductsTable({
  data = [],
  loading = false,
  error,
  locale = 'pt-BR',
  onExport,
  showSearch = true,
  maxHeight = '500px',
  className,
}: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('receita_brl')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(item =>
        item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nome_produto?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number | string = a[sortField] ?? ''
      let bValue: number | string = b[sortField] ?? ''

      // Convert string numbers to numbers for proper sorting
      if (sortField === 'receita_brl' || sortField === 'ticket_medio_brl' || sortField === 'refund_rate') {
        aValue = parseFloat(aValue as string) || 0
        bValue = parseFloat(bValue as string) || 0
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      // String comparison
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })

    return filtered
  }, [data, searchTerm, sortField, sortDirection])

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
      'Código do Produto': item.product_code,
      'Nome do Produto': item.nome_produto || '',
      'Pedidos': item.pedidos,
      'Receita (R$)': item.receita_brl,
      'Ticket Médio (R$)': item.ticket_medio_brl,
      'Taxa de Reembolso (%)': item.refund_rate,
      'Categoria': item.categoria || '',
      'Status': item.status || '',
    }))

    const csvContent = exportToCSV(exportData, 'produtos_top')
    downloadCSV(csvContent, `produtos_top_${new Date().toISOString().split('T')[0]}`)
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

  const getRefundRateColor = (rate: string) => {
    const numRate = parseFloat(rate) || 0
    if (numRate >= 10) return 'text-red-600 dark:text-red-400'
    if (numRate >= 5) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getStatusBadge = (status?: string) => {
    if (!status) return null
    
    switch (status) {
      case 'active':
        return <Badge variant='default' className='bg-green-100 text-green-800'>Ativo</Badge>
      case 'inactive':
        return <Badge variant='secondary'>Inativo</Badge>
      case 'discontinued':
        return <Badge variant='destructive'>Descontinuado</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {showSearch && (
          <div className='flex items-center justify-between gap-4'>
            <Skeleton className='h-10 w-64' />
            <Skeleton className='h-10 w-32' />
          </div>
        )}
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className='h-4 w-24' /></TableHead>
                <TableHead><Skeleton className='h-4 w-16' /></TableHead>
                <TableHead><Skeleton className='h-4 w-20' /></TableHead>
                <TableHead><Skeleton className='h-4 w-24' /></TableHead>
                <TableHead><Skeleton className='h-4 w-20' /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className='h-4 w-32' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-12' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-20' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-16' /></TableCell>
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
          Erro ao carregar produtos
        </div>
        <div className='text-red-600 dark:text-red-400 text-sm'>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Export Header */}
      {showSearch && (
        <div className='flex items-center justify-between gap-4'>
          <div className='relative flex-1 max-w-sm'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='Buscar por código ou nome...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-9'
            />
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
      )}

      {/* Results Summary */}
      <div className='text-sm text-muted-foreground'>
        {searchTerm ? (
          <>
            Mostrando {processedData.length} de {data.length} produtos
            {processedData.length !== data.length && (
              <span className='ml-2 text-blue-600 dark:text-blue-400'>
                (filtrado por "{searchTerm}")
              </span>
            )}
          </>
        ) : (
          `${data.length} produtos encontrados`
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
              <TableHead className='min-w-[120px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('product_code')}
                >
                  Código
                  {getSortIcon('product_code')}
                </Button>
              </TableHead>
              <TableHead className='text-right min-w-[80px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('pedidos')}
                >
                  Pedidos
                  {getSortIcon('pedidos')}
                </Button>
              </TableHead>
              <TableHead className='text-right min-w-[120px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('receita_brl')}
                >
                  Receita
                  {getSortIcon('receita_brl')}
                </Button>
              </TableHead>
              <TableHead className='text-right min-w-[120px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('ticket_medio_brl')}
                >
                  Ticket Médio
                  {getSortIcon('ticket_medio_brl')}
                </Button>
              </TableHead>
              <TableHead className='text-right min-w-[100px]'>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-auto p-0 font-semibold'
                  onClick={() => handleSort('refund_rate')}
                >
                  Reembolsos
                  {getSortIcon('refund_rate')}
                </Button>
              </TableHead>
              {data.some(item => item.status) && (
                <TableHead className='min-w-[100px]'>Status</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={data.some(item => item.status) ? 6 : 5}
                  className='text-center py-8 text-muted-foreground'
                >
                  {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum dado disponível'}
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((product, index) => (
                <TableRow key={product.product_code} className='hover:bg-muted/50'>
                  <TableCell className='font-mono text-sm'>
                    <div>
                      <div className='font-semibold'>{product.product_code}</div>
                      {product.nome_produto && (
                        <div className='text-xs text-muted-foreground mt-1'>
                          {product.nome_produto}
                        </div>
                      )}
                      {product.categoria && (
                        <div className='text-xs text-blue-600 dark:text-blue-400 mt-1'>
                          {product.categoria}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {product.pedidos.toLocaleString(locale)}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatBRL(product.receita_brl, { locale })}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatBRL(product.ticket_medio_brl, { locale })}
                  </TableCell>
                  <TableCell className='text-right'>
                    <span className={getRefundRateColor(product.refund_rate)}>
                      {parseFloat(product.refund_rate).toFixed(2)}%
                    </span>
                  </TableCell>
                  {data.some(item => item.status) && (
                    <TableCell>
                      {getStatusBadge(product.status)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Summary */}
      {processedData.length > 0 && (
        <div className='text-xs text-muted-foreground border-t pt-2'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <span className='font-medium'>Total de Pedidos:</span>{' '}
              {processedData.reduce((sum, item) => sum + item.pedidos, 0).toLocaleString(locale)}
            </div>
            <div>
              <span className='font-medium'>Receita Total:</span>{' '}
              {formatBRL(
                processedData.reduce((sum, item) => sum + parseFloat(item.receita_brl), 0),
                { locale }
              )}
            </div>
            <div>
              <span className='font-medium'>Ticket Médio Geral:</span>{' '}
              {formatBRL(
                processedData.reduce((sum, item) => sum + parseFloat(item.receita_brl), 0) /
                processedData.reduce((sum, item) => sum + item.pedidos, 0),
                { locale }
              )}
            </div>
            <div>
              <span className='font-medium'>Taxa Média de Reembolso:</span>{' '}
              {(processedData.reduce((sum, item) => sum + parseFloat(item.refund_rate), 0) / processedData.length).toFixed(2)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}