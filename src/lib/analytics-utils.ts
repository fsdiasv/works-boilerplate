import { type Decimal } from '@prisma/client/runtime/library'
import { format, parseISO } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

/**
 * Convert Decimal or string to number safely
 */
function toNumber(value: Decimal | string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || 0
  // Decimal type from Prisma
  return parseFloat(value.toString()) || 0
}

/**
 * Format currency in Brazilian Real (BRL)
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatBRL(
  value: Decimal | string | number | null | undefined,
  options: {
    showSymbol?: boolean
    locale?: string
    decimals?: number
  } = {}
): string {
  const { showSymbol = true, locale = 'pt-BR', decimals = 2 } = options
  const numValue = toNumber(value)

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return formatter.format(numValue)
}

/**
 * Calculate net revenue based on gross revenue, taxes, refunds, and chargebacks
 * @param gross - Gross revenue
 * @param tax - Tax amount
 * @param refunds - Total refunds
 * @param chargebacks - Total chargeback losses
 * @returns Net revenue
 */
export function calculateNetRevenue(
  gross: Decimal | string | number,
  tax: Decimal | string | number = 0,
  refunds: Decimal | string | number = 0,
  chargebacks: Decimal | string | number = 0
): number {
  const grossNum = toNumber(gross)
  const taxNum = toNumber(tax)
  const refundsNum = toNumber(refunds)
  const chargebacksNum = toNumber(chargebacks)

  return Math.max(0, grossNum - taxNum - refundsNum - chargebacksNum)
}

/**
 * Calculate Average Order Value (AOV)
 * @param revenue - Total revenue
 * @param orders - Number of orders
 * @returns AOV value
 */
export function calculateAOV(revenue: Decimal | string | number, orders: number): number {
  const revenueNum = toNumber(revenue)
  return orders > 0 ? revenueNum / orders : 0
}

/**
 * Calculate percentage rate
 * @param numerator - The numerator value
 * @param denominator - The denominator value
 * @returns Percentage as decimal (0.05 = 5%)
 */
export function calculateRate(
  numerator: Decimal | string | number,
  denominator: Decimal | string | number
): number {
  const numNum = toNumber(numerator)
  const denNum = toNumber(denominator)
  return denNum > 0 ? numNum / denNum : 0
}

/**
 * Format percentage rate for display
 * @param rate - Rate as decimal (0.05 = 5%)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(rate: number, decimals: number = 2): string {
  return `${(rate * 100).toFixed(decimals)}%`
}

/**
 * Adjust date to specified timezone
 * @param date - Date to adjust
 * @param timezone - Target timezone (e.g., 'America/Sao_Paulo')
 * @returns Date adjusted to timezone
 */
export function adjustTimezone(date: Date | string, timezone: string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return toZonedTime(dateObj, timezone)
}

/**
 * Format date for display with timezone awareness
 * @param date - Date to format
 * @param timezone - Timezone to use
 * @param locale - Locale for formatting
 * @param formatString - Date format string
 * @returns Formatted date string
 */
export function formatDateWithTimezone(
  date: Date | string,
  timezone: string = 'America/Sao_Paulo',
  locale: string = 'pt-BR',
  formatString: string = 'dd/MM/yyyy'
): string {
  const adjustedDate = adjustTimezone(date, timezone)
  const localeObj = locale === 'pt-BR' ? ptBR : enUS

  return format(adjustedDate, formatString, { locale: localeObj })
}

/**
 * Normalize payment status across different gateways
 * Gateway-specific status mapping to standardized status
 */
const PAYMENT_STATUS_MAP: Record<string, Record<string, string>> = {
  stripe: {
    succeeded: 'succeeded',
    paid: 'succeeded',
    captured: 'succeeded',
    requires_payment_method: 'failed',
    requires_confirmation: 'pending',
    requires_action: 'pending',
    processing: 'pending',
    requires_capture: 'pending',
    canceled: 'failed',
  },
  paypal: {
    completed: 'succeeded',
    approved: 'succeeded',
    captured: 'succeeded',
    pending: 'pending',
    declined: 'failed',
    cancelled: 'failed',
    expired: 'failed',
  },
  mercadopago: {
    approved: 'succeeded',
    authorized: 'succeeded',
    in_process: 'pending',
    pending: 'pending',
    rejected: 'failed',
    cancelled: 'failed',
    refunded: 'refunded',
  },
  // Add more gateways as needed
}

/**
 * Normalize payment status to standard format
 * @param status - Original payment status
 * @param gateway - Payment gateway identifier
 * @returns Normalized status ('succeeded', 'pending', 'failed', 'refunded')
 */
export function normalizePaymentStatus(status: string, gateway: string): string {
  const gatewayMap = PAYMENT_STATUS_MAP[gateway.toLowerCase()]
  if (!gatewayMap) {
    // Fallback for unknown gateways - try to map common statuses
    const normalizedStatus = status.toLowerCase()
    if (
      ['succeeded', 'paid', 'captured', 'completed', 'approved', 'success'].includes(
        normalizedStatus
      )
    ) {
      return 'succeeded'
    }
    if (['pending', 'processing', 'requires_action', 'in_process'].includes(normalizedStatus)) {
      return 'pending'
    }
    if (
      ['failed', 'declined', 'rejected', 'cancelled', 'canceled', 'expired'].includes(
        normalizedStatus
      )
    ) {
      return 'failed'
    }
    if (['refunded'].includes(normalizedStatus)) {
      return 'refunded'
    }
    return 'unknown'
  }

  return gatewayMap[status.toLowerCase()] ?? 'unknown'
}

/**
 * Check if a payment status indicates success
 * @param status - Payment status
 * @param gateway - Payment gateway
 * @returns True if payment is successful
 */
export function isSuccessfulPayment(status: string, gateway: string): boolean {
  return normalizePaymentStatus(status, gateway) === 'succeeded'
}

/**
 * Export data to CSV format
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @returns CSV content as string
 */
export function exportToCSV(data: Record<string, unknown>[], _filename: string = 'export'): string {
  if (!data.length) return ''

  // Get headers from first object
  const headers = Object.keys(data[0] ?? {})

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row =>
      headers
        .map(header => {
          const value = row[header]
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && value && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value?.toString() ?? ''
        })
        .join(',')
    ),
  ].join('\n')

  return csvContent
}

/**
 * Trigger CSV download in browser
 * @param csvContent - CSV content string
 * @param filename - Name of the file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Guard against SSR - only run in browser environment
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    console.warn('downloadCSV: Cannot download file in server environment')
    return
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if ('download' in link) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Get date range for common periods
 * @param period - Period identifier
 * @param timezone - Timezone to use
 * @returns Object with from and to dates
 */
export function getDateRange(
  period: 'today' | '7d' | '30d' | '90d' | 'mtd' | 'custom',
  timezone: string = 'America/Sao_Paulo',
  customFrom?: Date,
  customTo?: Date
): { from: Date; to: Date } {
  const now = adjustTimezone(new Date(), timezone)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (period) {
    case 'today':
      return {
        from: today,
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1), // End of today
      }

    case '7d':
      return {
        from: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), // 7 days ago
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }

    case '30d':
      return {
        from: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }

    case '90d':
      return {
        from: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000), // 90 days ago
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }

    case 'mtd': // Month to date
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1), // First day of current month
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }

    case 'custom':
      return {
        from: customFrom ?? today,
        to: customTo ?? new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }

    default:
      return {
        from: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      }
  }
}

/**
 * Validate date range constraints
 * @param from - Start date
 * @param to - End date
 * @param maxDays - Maximum allowed days in range
 * @returns Validation result
 */
export function validateDateRange(
  from: Date,
  to: Date,
  maxDays: number = 370
): { valid: boolean; error?: string } {
  if (from >= to) {
    return { valid: false, error: 'Start date must be before end date' }
  }

  const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDiff > maxDays) {
    return { valid: false, error: `Date range cannot exceed ${maxDays} days` }
  }

  return { valid: true }
}

/**
 * Format large numbers with appropriate suffixes (K, M, B)
 * @param value - Number to format
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatLargeNumber(value: Decimal | string | number, decimals: number = 1): string {
  const num = toNumber(value)

  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(decimals)}B`
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`
  }

  return num.toFixed(0)
}
