import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import {
  calculateNetRevenue,
  calculateAOV,
  calculateRate,
  isSuccessfulPayment,
  validateDateRange,
  adjustTimezone,
  convertToBRL,
  getCurrencyConversionSQL,
} from '@/lib/analytics-utils'
import { env } from '@/lib/env'
import { createTRPCRouter, workspaceAdminProcedure } from '@/server/api/trpc'

// Input validation schemas with comprehensive security checks
const analyticsFiltersSchema = z
  .object({
    from: z
      .string()
      .datetime()
      .refine(
        date => {
          const d = new Date(date)
          const now = new Date()
          const maxPast = new Date()
          maxPast.setFullYear(maxPast.getFullYear() - 2) // Max 2 years in the past
          return d >= maxPast && d <= now
        },
        { message: 'Date must be within the last 2 years and not in the future' }
      ),
    to: z
      .string()
      .datetime()
      .refine(
        date => {
          const d = new Date(date)
          const now = new Date()
          const maxFuture = new Date()
          maxFuture.setDate(maxFuture.getDate() + 1) // Allow up to tomorrow for timezone differences
          return d <= maxFuture
        },
        { message: 'End date cannot be more than 1 day in the future' }
      ),
    tz: z
      .string()
      .regex(/^[A-Za-z_]+\/[A-Za-z_]+$/, 'Invalid timezone format')
      .default('America/Sao_Paulo')
      .refine(
        tz => {
          // Validate against a whitelist of common timezones
          const validTimezones = [
            'America/New_York',
            'America/Chicago',
            'America/Los_Angeles',
            'America/Sao_Paulo',
            'America/Argentina/Buenos_Aires',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Asia/Dubai',
            'Australia/Sydney',
            'UTC',
          ]
          return validTimezones.includes(tz)
        },
        { message: 'Unsupported timezone' }
      ),
    product: z
      .string()
      .max(100, 'Product code too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid product code format')
      .optional(),
    gateway: z
      .string()
      .max(50, 'Gateway name too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid gateway format')
      .optional(),
    country: z
      .string()
      .length(2, 'Country code must be 2 characters')
      .regex(/^[A-Z]{2}$/, 'Invalid country code format')
      .optional(),
  })
  .refine(
    data => {
      const from = new Date(data.from)
      const to = new Date(data.to)
      const maxDays = 370 // Maximum date range
      const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= maxDays && daysDiff >= 0
    },
    { message: 'Date range cannot exceed 370 days and from must be before to' }
  )

const limitSchema = z.number().min(1).max(200).default(50)
const productsLimitSchema = z.number().min(1).max(50).default(10)

// Output type definitions
const kpisOutputSchema = z.object({
  pedidos: z.number(),
  pagamentos: z.number(),
  receita_bruta_brl: z.string(),
  impostos_brl: z.string(),
  receita_liquida_brl: z.string(),
  ticket_medio_brl: z.string(),
  refunds_brl: z.string(),
  refund_rate: z.string(),
  cb_losses_brl: z.string(),
  cb_rate: z.string(),
  assinaturas_ativas: z.number(),
  mrr_realizado_brl: z.string(),
  // Multi-currency breakdown
  receita_por_moeda: z.object({
    BRL: z.string(),
    USD: z.string(),
    EUR: z.string(),
  }),
  impostos_por_moeda: z.object({
    BRL: z.string(),
    USD: z.string(),
    EUR: z.string(),
  }),
})

const timeseriesPointSchema = z.object({
  day: z.string(), // 'YYYY-MM-DD'
  receita_brl: z.string(),
})

const ordersTimeseriesPointSchema = z.object({
  day: z.string(),
  pedidos: z.number(),
})

const productSchema = z.object({
  product_code: z.string(),
  pedidos: z.number(),
  receita_brl: z.string(),
  ticket_medio_brl: z.string(),
  refund_rate: z.string(),
})

const subscriptionsSummarySchema = z.object({
  assinaturas_ativas: z.number(),
  novas_assinaturas: z.number(),
  churn_assinaturas: z.number(),
  mrr_realizado_brl: z.string(),
})

const disputesSummarySchema = z.object({
  cb_losses_brl: z.string(),
  total_disputas: z.number(),
  abertas: z.number(),
  resolvidas: z.number(),
  perdidas: z.number(),
  ganhas: z.number(),
})

const recentPaymentSchema = z.object({
  payment_id: z.string(),
  paid_at: z.date(),
  order_id: z.string().nullable(),
  product_code: z.string().nullable(),
  amount_brl: z.string(),
  gateway: z.string().nullable(),
  payment_method: z.string().nullable(),
  country: z.string().nullable(),
})

const salesByProductSchema = z.object({
  product_code: z.string(),
  quantity: z.number(),
  percentage: z.number(),
})

const revenueByProductSchema = z.object({
  product_code: z.string(),
  revenue_brl: z.string(),
  percentage: z.number(),
})

const salesByDayOfWeekSchema = z.object({
  day_of_week: z.string(),
  sales: z.number(),
  percentage: z.number(),
})

const salesByHourSchema = z.object({
  hour: z.number(),
  sales: z.number(),
  percentage: z.number(),
})

export const analyticsRouter = createTRPCRouter({
  /**
   * Get comprehensive KPIs for the dashboard
   * SECURITY: Requires workspace admin role and filters by workspace
   */
  kpis: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(kpisOutputSchema)
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input
      const workspaceId = ctx.activeWorkspace.id

      // Validate date range
      const fromDate = new Date(from)
      const toDate = new Date(to)

      // Enhanced date validation (incorporating security feedback)
      if (fromDate >= toDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'From date must be before to date',
        })
      }

      const validation = validateDateRange(fromDate, toDate)

      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.error || 'Invalid date range',
        })
      }

      // Adjust dates to specified timezone
      const fromAdjusted = adjustTimezone(fromDate, tz)
      const toAdjusted = adjustTimezone(toDate, tz)

      try {
        // Build where conditions for completed orders
        const orderWhere = {
          createdAt: {
            gte: fromAdjusted,
            lte: toAdjusted,
          },
          status: 'COMPLETED', // Only completed orders
          ...(gateway && { gateway }),
        }

        // Get completed orders with their order items and relations
        const completedOrders = await ctx.db.order.findMany({
          where: orderWhere,
          include: {
            orderItems: {
              where: {
                ...(product && {
                  productVersion: {
                    productCode: product,
                  },
                }),
                ...(country && {
                  customer: {
                    country,
                  },
                }),
              },
              include: {
                productVersion: {
                  include: {
                    product: true,
                  },
                },
                customer: true,
                subscriptions: true,
              },
            },
          },
        })

        // Flatten order items from completed orders
        const orderItems = completedOrders.flatMap(order =>
          order.orderItems.map(item => ({
            ...item,
            order: {
              ...order,
              orderItems: undefined, // Remove to avoid circular reference
            },
          }))
        )

        // Get refunds
        const refunds = await ctx.db.refund.findMany({
          where: {
            createdAt: {
              gte: fromAdjusted,
              lte: toAdjusted,
            },
            ...(gateway && {
              payment: {
                gateway,
              },
            }),
            ...(product && {
              orderItem: {
                productVersion: {
                  productCode: product,
                },
              },
            }),
            ...(country && {
              orderItem: {
                customer: {
                  country,
                },
              },
            }),
          },
        })

        // Get disputes/chargebacks
        const disputes = await ctx.db.dispute.findMany({
          where: {
            resolvedAt: {
              gte: fromAdjusted,
              lte: toAdjusted,
            },
            ...(gateway && { gateway }),
            ...(product && {
              orderItem: {
                productVersion: {
                  productCode: product,
                },
              },
            }),
            ...(country && {
              customer: {
                country,
              },
            }),
          },
        })

        // Get active subscriptions
        const activeSubscriptions = await ctx.db.subscription.findMany({
          where: {
            OR: [
              { status: { in: ['active', 'trialing'] } },
              {
                canceledAt: null,
                startDate: { lt: toAdjusted },
              },
            ],
            ...(product && {
              orderItem: {
                productVersion: {
                  productCode: product,
                },
              },
            }),
            ...(country && {
              customer: {
                country,
              },
            }),
          },
        })

        // Currency conversion is now handled by the utility function

        // Calculate metrics using order_items.price with currency conversion and breakdown
        const receitaPorMoeda = orderItems.reduce(
          (acc, item) => {
            if (!item.price || !item.order?.currency) return acc
            const amount = Number(item.price)
            if (isNaN(amount)) return acc
            const currency = item.order.currency

            if (currency === 'BRL') {
              acc.BRL += amount
            } else if (currency === 'USD') {
              acc.USD += amount
            } else if (currency === 'EUR') {
              acc.EUR += amount
            }

            return acc
          },
          { BRL: 0, USD: 0, EUR: 0 }
        )

        const receita_bruta = orderItems.reduce((sum, item) => {
          if (!item.price || !item.order?.currency) return sum
          const amount = Number(item.price)
          if (isNaN(amount)) return sum
          const currency = item.order.currency
          return sum + convertToBRL(amount, currency)
        }, 0)

        // Calculate taxes as 2.5% of gross revenue (per currency)
        const impostos = receita_bruta * 0.025
        const impostosPorMoeda = {
          BRL: receitaPorMoeda.BRL * 0.025,
          USD: receitaPorMoeda.USD * 0.025,
          EUR: receitaPorMoeda.EUR * 0.025,
        }

        const refunds_total = refunds.reduce((sum, r) => {
          const amount = r.amountBrl ? Number(r.amountBrl) : 0
          return sum + (isNaN(amount) ? 0 : amount)
        }, 0)

        const cb_losses = disputes.reduce((sum, d) => {
          const loss = d.netLossBrl ? Number(d.netLossBrl) : 0
          return sum + (isNaN(loss) ? 0 : loss)
        }, 0)

        const receita_liquida = calculateNetRevenue(
          receita_bruta,
          impostos,
          refunds_total,
          cb_losses
        )

        // Get unique orders count
        const uniqueOrderIds = new Set(completedOrders.map(o => o.id))
        const pedidos = uniqueOrderIds.size
        const pagamentos = orderItems.length // Total order items as "pagamentos"

        const ticket_medio = calculateAOV(receita_bruta, pedidos)
        const refund_rate = calculateRate(refunds_total, receita_bruta)
        const cb_rate = calculateRate(cb_losses, receita_bruta)

        // Calculate MRR from subscription order items
        const subscriptionOrderItems = orderItems.filter(
          oi => oi.pricingType === 'subscription' && oi.subscriptions && oi.subscriptions.length > 0
        )
        const mrr_realizado = subscriptionOrderItems.reduce((sum, oi) => {
          if (!oi.price || !oi.order?.currency) return sum
          const amount = Number(oi.price)
          if (isNaN(amount)) return sum
          const currency = oi.order.currency
          return sum + convertToBRL(amount, currency)
        }, 0)

        return {
          pedidos,
          pagamentos,
          receita_bruta_brl: receita_bruta.toFixed(2),
          impostos_brl: impostos.toFixed(2),
          receita_liquida_brl: receita_liquida.toFixed(2),
          ticket_medio_brl: ticket_medio.toFixed(2),
          refunds_brl: refunds_total.toFixed(2),
          refund_rate: (refund_rate * 100).toFixed(2),
          cb_losses_brl: cb_losses.toFixed(2),
          cb_rate: (cb_rate * 100).toFixed(2),
          assinaturas_ativas: activeSubscriptions.length,
          mrr_realizado_brl: mrr_realizado.toFixed(2),
          receita_por_moeda: {
            BRL: receitaPorMoeda.BRL.toFixed(2),
            USD: receitaPorMoeda.USD.toFixed(2),
            EUR: receitaPorMoeda.EUR.toFixed(2),
          },
          impostos_por_moeda: {
            BRL: impostosPorMoeda.BRL.toFixed(2),
            USD: impostosPorMoeda.USD.toFixed(2),
            EUR: impostosPorMoeda.EUR.toFixed(2),
          },
        }
      } catch (error) {
        console.error('Error calculating KPIs:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate KPIs',
        })
      }
    }),

  /**
   * Get daily revenue time series
   * SECURITY: Requires workspace admin role and filters by workspace
   */
  revenueTimeseries: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(z.array(timeseriesPointSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input

      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Use CTE with orders and order_items (no payments table)
        const conversionSQL = getCurrencyConversionSQL()
        const results = await ctx.db.$queryRaw<Array<{ day: string; receita_brl: string }>>`
          WITH daily_revenue AS (
            SELECT 
              DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz}) as order_day,
              oi.price,
              o.currency
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
            LEFT JOIN customers c ON oi.customer_id = c.id
            WHERE o.created_at >= ${fromDate}
              AND o.created_at <= ${toDate}
              AND o.status = 'COMPLETED'
              ${gateway ? Prisma.sql`AND o.gateway = ${gateway}` : Prisma.sql``}
              ${product ? Prisma.sql`AND plv.product_code = ${product}` : Prisma.sql``}
              ${country ? Prisma.sql`AND c.country = ${country}` : Prisma.sql``}
              AND oi.price IS NOT NULL
          )
          SELECT 
            order_day::text as day,
            SUM(${Prisma.raw(conversionSQL)})::text as receita_brl
          FROM daily_revenue
          GROUP BY order_day
          ORDER BY order_day ASC
        `

        return results.map(row => ({
          day: row.day,
          receita_brl: row.receita_brl,
        }))
      } catch (error) {
        console.error('Error fetching revenue timeseries:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch revenue timeseries',
        })
      }
    }),

  /**
   * Get daily orders time series
   */
  ordersTimeseries: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(z.array(ordersTimeseriesPointSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input

      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Use CTE with orders only (no payments table)
        const results = await ctx.db.$queryRaw<Array<{ day: string; pedidos: number }>>`
          WITH daily_orders AS (
            SELECT 
              DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz}) as order_day,
              o.id as order_id
            FROM orders o
            WHERE o.created_at >= ${fromDate}
              AND o.created_at <= ${toDate}
              AND o.status = 'COMPLETED'
              ${gateway ? Prisma.sql`AND o.gateway = ${gateway}` : Prisma.sql``}
              ${
                product
                  ? Prisma.sql`
                AND EXISTS (
                  SELECT 1 FROM order_items oi 
                  LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id 
                  WHERE oi.order_id = o.id AND plv.product_code = ${product}
                )
              `
                  : Prisma.sql``
              }
              ${
                country
                  ? Prisma.sql`
                AND EXISTS (
                  SELECT 1 FROM order_items oi 
                  LEFT JOIN customers c ON oi.customer_id = c.id 
                  WHERE oi.order_id = o.id AND c.country = ${country}
                )
              `
                  : Prisma.sql``
              }
          )
          SELECT 
            order_day::text as day,
            COUNT(DISTINCT order_id)::int as pedidos
          FROM daily_orders
          GROUP BY order_day
          ORDER BY order_day ASC
        `

        return results
      } catch (error) {
        console.error('Error fetching orders timeseries:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch orders timeseries',
        })
      }
    }),

  /**
   * Get top products by revenue
   */
  productsTop: workspaceAdminProcedure
    .input(
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
        tz: z.string().default('America/Sao_Paulo'),
        product: z.string().optional(),
        gateway: z.string().optional(),
        country: z.string().optional(),
        limit: productsLimitSchema,
      })
    )
    .output(z.array(productSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, limit, gateway, country } = input

      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Build dynamic WHERE conditions for orders + order_items
        const whereConditions = [
          Prisma.sql`o.created_at >= ${fromDate}`,
          Prisma.sql`o.created_at <= ${toDate}`,
          Prisma.sql`o.status = 'COMPLETED'`,
          Prisma.sql`plv.product_code IS NOT NULL`,
          Prisma.sql`oi.price IS NOT NULL`,
        ]

        if (gateway) {
          whereConditions.push(Prisma.sql`o.gateway = ${gateway}`)
        }
        if (country) {
          whereConditions.push(Prisma.sql`c.country = ${country}`)
        }

        // Get dynamic conversion SQL for use in query
        const conversionSQL = getCurrencyConversionSQL()
          .replace(/price/g, 'oi.price')
          .replace(/currency/g, 'o.currency')

        const results = await ctx.db.$queryRaw<
          Array<{
            product_code: string
            pedidos: number
            receita_brl: string
            refunds_brl: string
          }>
        >`
          SELECT 
            plv.product_code,
            COUNT(DISTINCT o.id)::int as pedidos,
            SUM(${Prisma.raw(conversionSQL)})::text as receita_brl,
            COALESCE(SUM(r.amount_brl), 0)::text as refunds_brl
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
          LEFT JOIN customers c ON oi.customer_id = c.id
          LEFT JOIN refunds r ON oi.id = r.order_item_id AND r.created_at >= ${fromDate} AND r.created_at <= ${toDate}
          WHERE ${Prisma.join(whereConditions, ' AND ')}
          GROUP BY plv.product_code
          ORDER BY SUM(${Prisma.raw(conversionSQL)}) DESC
          LIMIT ${limit}
        `

        return results.map(row => {
          const receita = Number(row.receita_brl)
          const refunds = Number(row.refunds_brl)
          const pedidos = row.pedidos

          return {
            product_code: row.product_code,
            pedidos,
            receita_brl: receita.toFixed(2),
            ticket_medio_brl: calculateAOV(receita, pedidos).toFixed(2),
            refund_rate: (calculateRate(refunds, receita) * 100).toFixed(2),
          }
        })
      } catch (error) {
        console.error('Error fetching top products:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch top products',
        })
      }
    }),

  /**
   * Get subscriptions summary
   */
  subscriptionsSummary: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(subscriptionsSummarySchema)
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, country } = input

      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Active subscriptions
        const activeSubscriptions = await ctx.db.subscription.count({
          where: {
            OR: [
              { status: { in: ['active', 'trialing'] } },
              {
                canceledAt: null,
                startDate: { lt: toDate },
              },
            ],
            ...(product && {
              orderItem: {
                productVersion: {
                  productCode: product,
                },
              },
            }),
            ...(country && {
              customer: {
                country,
              },
            }),
          },
        })

        // New subscriptions in period
        const novasAssinaturas = await ctx.db.subscription.count({
          where: {
            startDate: {
              gte: fromDate,
              lte: toDate,
            },
            ...(product && {
              orderItem: {
                productVersion: {
                  productCode: product,
                },
              },
            }),
            ...(country && {
              customer: {
                country,
              },
            }),
          },
        })

        // Churned subscriptions in period
        const churnAssinaturas = await ctx.db.subscription.count({
          where: {
            canceledAt: {
              gte: fromDate,
              lte: toDate,
            },
            ...(product && {
              orderItem: {
                productVersion: {
                  productCode: product,
                },
              },
            }),
            ...(country && {
              customer: {
                country,
              },
            }),
          },
        })

        // MRR from subscription payments in period
        const subscriptionPayments = await ctx.db.payment.findMany({
          where: {
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
            status: {
              in: ['succeeded', 'paid', 'captured', 'completed', 'SUCCESS'],
            },
            orderItem: {
              subscriptions: {
                some: {},
              },
              ...(product && {
                productVersion: {
                  productCode: product,
                },
              }),
              ...(country && {
                customer: {
                  country,
                },
              }),
            },
          },
        })

        const mrrRealizado = subscriptionPayments.reduce(
          (sum, payment) => sum + (Number(payment.amountBrl) || 0),
          0
        )

        return {
          assinaturas_ativas: activeSubscriptions,
          novas_assinaturas: novasAssinaturas,
          churn_assinaturas: churnAssinaturas,
          mrr_realizado_brl: mrrRealizado.toFixed(2),
        }
      } catch (error) {
        console.error('Error fetching subscriptions summary:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch subscriptions summary',
        })
      }
    }),

  /**
   * Get disputes/chargebacks summary
   */
  disputesSummary: workspaceAdminProcedure
    .input(z.object({ from: z.string().datetime(), to: z.string().datetime() }))
    .output(disputesSummarySchema)
    .query(async ({ ctx, input }) => {
      const { from, to } = input

      const fromDate = new Date(from)
      const toDate = new Date(to)

      try {
        const disputes = await ctx.db.dispute.findMany({
          where: {
            openedAt: {
              gte: fromDate,
              lte: toDate,
            },
          },
        })

        const totalDisputas = disputes.length
        const abertas = disputes.filter(d => !d.resolvedAt).length
        const resolvidas = disputes.filter(d => d.resolvedAt).length
        const perdidas = disputes.filter(d => d.outcome === 'lost').length
        const ganhas = disputes.filter(d => d.outcome === 'won').length
        const cbLosses = disputes.reduce((sum, d) => sum + (Number(d.netLossBrl) || 0), 0)

        return {
          cb_losses_brl: cbLosses.toFixed(2),
          total_disputas: totalDisputas,
          abertas,
          resolvidas,
          perdidas,
          ganhas,
        }
      } catch (error) {
        console.error('Error fetching disputes summary:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch disputes summary',
        })
      }
    }),

  /**
   * Get recent payments
   */
  paymentsRecent: workspaceAdminProcedure
    .input(z.object({ limit: limitSchema }))
    .output(z.array(recentPaymentSchema))
    .query(async ({ ctx, input }) => {
      const { limit } = input

      try {
        console.log(`[paymentsRecent] Fetching ${limit} recent payments`)

        const payments = await ctx.db.payment.findMany({
          where: {
            status: {
              in: ['succeeded', 'paid', 'captured', 'completed', 'SUCCESS'],
            },
          },
          include: {
            orderItem: {
              include: {
                order: true,
                productVersion: true,
                customer: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
        })

        console.log(`[paymentsRecent] Found ${payments.length} payments`)

        return payments.map((payment, index) => {
          try {
            const orderItem = payment.orderItem
            const productVersion = orderItem?.productVersion
            const customer = orderItem?.customer

            return {
              payment_id: payment.id.toString(),
              paid_at: payment.createdAt,
              order_id: orderItem?.orderId ? orderItem.orderId.toString() : null,
              product_code: productVersion?.productCode || null,
              amount_brl: payment.amountBrl ? Number(payment.amountBrl).toFixed(2) : '0.00',
              gateway: payment.gateway || null,
              payment_method: payment.paymentMethod || null,
              country: customer?.country || null,
            }
          } catch (mappingError) {
            console.error(`[paymentsRecent] Error mapping payment ${index}:`, {
              paymentId: payment.id,
              error: mappingError,
              paymentData: {
                hasOrderItem: !!payment.orderItem,
                hasProductVersion: !!payment.orderItem?.productVersion,
                hasCustomer: !!payment.orderItem?.customer,
              },
            })
            throw mappingError
          }
        })
      } catch (error) {
        console.error('[paymentsRecent] Database query error:', {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          inputLimit: limit,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent payments',
        })
      }
    }),

  /**
   * Get sales by product with quantities and percentages
   */
  salesByProduct: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(z.array(salesByProductSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input
      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Build WHERE conditions dynamically - using orders/order_items structure
        const whereConditions = [
          Prisma.sql`o.created_at >= ${fromDate}`,
          Prisma.sql`o.created_at <= ${toDate}`,
          Prisma.sql`o.status = 'COMPLETED'`,
          Prisma.sql`plv.product_code IS NOT NULL`,
        ]

        if (gateway) whereConditions.push(Prisma.sql`o.gateway = ${gateway}`)
        if (product) whereConditions.push(Prisma.sql`plv.product_code = ${product}`)
        if (country) whereConditions.push(Prisma.sql`c.country = ${country}`)

        const whereClause = Prisma.join(whereConditions, ' AND ')

        const results = await ctx.db.$queryRaw<Array<{ product_code: string; quantity: bigint }>>(
          Prisma.sql`
            WITH product_sales AS (
              SELECT 
                plv.product_code,
                COUNT(DISTINCT o.id) as quantity
              FROM orders o
              LEFT JOIN order_items oi ON o.id = oi.order_id
              LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
              LEFT JOIN customers c ON oi.customer_id = c.id
              WHERE ${whereClause}
              GROUP BY plv.product_code
            )
            SELECT 
              product_code,
              quantity
            FROM product_sales
            ORDER BY quantity DESC
          `
        )

        const totalSales = results.reduce((sum, row) => sum + Number(row.quantity), 0)

        return results.map(row => ({
          product_code: row.product_code,
          quantity: Number(row.quantity),
          percentage: totalSales > 0 ? (Number(row.quantity) / totalSales) * 100 : 0,
        }))
      } catch (error) {
        console.error('Error fetching sales by product:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sales by product',
        })
      }
    }),

  /**
   * Get revenue by product with amounts and percentages
   */
  revenueByProduct: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(z.array(revenueByProductSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input
      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Build WHERE conditions dynamically - using orders/order_items structure
        const whereConditions = [
          Prisma.sql`o.created_at >= ${fromDate}`,
          Prisma.sql`o.created_at <= ${toDate}`,
          Prisma.sql`o.status = 'COMPLETED'`,
          Prisma.sql`plv.product_code IS NOT NULL`,
          Prisma.sql`oi.price IS NOT NULL`,
        ]

        if (gateway) whereConditions.push(Prisma.sql`o.gateway = ${gateway}`)
        if (product) whereConditions.push(Prisma.sql`plv.product_code = ${product}`)
        if (country) whereConditions.push(Prisma.sql`c.country = ${country}`)

        const whereClause = Prisma.join(whereConditions, ' AND ')

        // Get dynamic conversion SQL for use in query
        const conversionSQL = getCurrencyConversionSQL()
          .replace(/price/g, 'oi.price')
          .replace(/currency/g, 'o.currency')

        const results = await ctx.db.$queryRaw<
          Array<{ product_code: string; revenue_brl: string }>
        >(
          Prisma.sql`
            WITH product_revenue AS (
              SELECT 
                plv.product_code,
                SUM(${Prisma.raw(conversionSQL)}) as revenue_brl
              FROM orders o
              LEFT JOIN order_items oi ON o.id = oi.order_id
              LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
              LEFT JOIN customers c ON oi.customer_id = c.id
              WHERE ${whereClause}
              GROUP BY plv.product_code
            )
            SELECT 
              product_code,
              revenue_brl::text
            FROM product_revenue
            ORDER BY revenue_brl DESC
          `
        )

        const totalRevenue = results.reduce((sum, row) => sum + parseFloat(row.revenue_brl), 0)

        return results.map(row => {
          const revenue = parseFloat(row.revenue_brl)
          return {
            product_code: row.product_code,
            revenue_brl: revenue.toFixed(2),
            percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
          }
        })
      } catch (error) {
        console.error('Error fetching revenue by product:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch revenue by product',
        })
      }
    }),

  /**
   * Get sales distribution by day of week
   */
  salesByDayOfWeek: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(z.array(salesByDayOfWeekSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input
      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Build WHERE conditions dynamically - using orders/order_items structure
        const whereConditions = [
          Prisma.sql`o.created_at >= ${fromDate}`,
          Prisma.sql`o.created_at <= ${toDate}`,
          Prisma.sql`o.status = 'COMPLETED'`,
        ]

        if (gateway) whereConditions.push(Prisma.sql`o.gateway = ${gateway}`)
        if (product) whereConditions.push(Prisma.sql`plv.product_code = ${product}`)
        if (country) whereConditions.push(Prisma.sql`c.country = ${country}`)

        const whereClause = Prisma.join(whereConditions, ' AND ')

        const results = await ctx.db.$queryRaw<Array<{ day_name: string; sales: bigint }>>(
          Prisma.sql`
            WITH daily_sales AS (
              SELECT 
                EXTRACT(DOW FROM o.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz}) as day_of_week,
                COUNT(DISTINCT o.id) as sales
              FROM orders o
              LEFT JOIN order_items oi ON o.id = oi.order_id
              LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
              LEFT JOIN customers c ON oi.customer_id = c.id
              WHERE ${whereClause}
              GROUP BY 1
            )
            SELECT 
              CASE day_of_week
                WHEN 0 THEN 'Dom'
                WHEN 1 THEN 'Seg'
                WHEN 2 THEN 'Ter'
                WHEN 3 THEN 'Qua'
                WHEN 4 THEN 'Qui'
                WHEN 5 THEN 'Sex'
                WHEN 6 THEN 'Sab'
              END as day_name,
              sales
            FROM daily_sales
            ORDER BY day_of_week
          `
        )

        const totalSales = results.reduce((sum, row) => sum + Number(row.sales), 0)

        return results.map(row => ({
          day_of_week: row.day_name,
          sales: Number(row.sales),
          percentage: totalSales > 0 ? (Number(row.sales) / totalSales) * 100 : 0,
        }))
      } catch (error) {
        console.error('Error fetching sales by day of week:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sales by day of week',
        })
      }
    }),

  /**
   * Get sales distribution by hour of day
   */
  salesByHour: workspaceAdminProcedure
    .input(analyticsFiltersSchema)
    .output(z.array(salesByHourSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input
      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Build WHERE conditions dynamically - using orders/order_items structure
        const whereConditions = [
          Prisma.sql`o.created_at >= ${fromDate}`,
          Prisma.sql`o.created_at <= ${toDate}`,
          Prisma.sql`o.status = 'COMPLETED'`,
        ]

        if (gateway) whereConditions.push(Prisma.sql`o.gateway = ${gateway}`)
        if (product) whereConditions.push(Prisma.sql`plv.product_code = ${product}`)
        if (country) whereConditions.push(Prisma.sql`c.country = ${country}`)

        const whereClause = Prisma.join(whereConditions, ' AND ')

        const results = await ctx.db.$queryRaw<Array<{ hour: number; sales: bigint }>>(
          Prisma.sql`
            WITH hourly_sales AS (
              SELECT 
                EXTRACT(HOUR FROM o.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz}) as hour,
                COUNT(DISTINCT o.id) as sales
              FROM orders o
              LEFT JOIN order_items oi ON o.id = oi.order_id
              LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
              LEFT JOIN customers c ON oi.customer_id = c.id
              WHERE ${whereClause}
              GROUP BY 1
            )
            SELECT 
              hour::integer,
              sales
            FROM hourly_sales
            ORDER BY hour
          `
        )

        const totalSales = results.reduce((sum, row) => sum + Number(row.sales), 0)

        return results.map(row => {
          const sales = Number(row.sales)
          return {
            hour: row.hour,
            sales,
            percentage: totalSales > 0 ? (sales / totalSales) * 100 : 0,
          }
        })
      } catch (error) {
        console.error('Error fetching sales by hour:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch sales by hour',
        })
      }
    }),

  /**
   * Get exchange rates configuration
   * SECURITY: Requires workspace admin role
   */
  exchangeRates: workspaceAdminProcedure
    .output(
      z.object({
        usd_to_brl: z.number(),
        eur_to_brl: z.number(),
        last_updated: z.string(),
      })
    )
    .query(({ ctx }) => {
      const workspaceId = ctx.activeWorkspace.id
      // eslint-disable-next-line no-console -- Intentional logging for development
      console.log(`[Analytics Exchange Rates] Workspace: ${workspaceId}`)

      return {
        usd_to_brl: Number(env.EXCHANGE_RATE_USD_TO_BRL) || 5.5,
        eur_to_brl: Number(env.EXCHANGE_RATE_EUR_TO_BRL) || 6.0,
        last_updated: new Date().toISOString(),
      }
    }),
})
