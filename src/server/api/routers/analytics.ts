import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { 
  calculateNetRevenue, 
  calculateAOV, 
  calculateRate, 
  isSuccessfulPayment,
  validateDateRange,
  adjustTimezone
} from '@/lib/analytics-utils'
import { createTRPCRouter, publicProcedure } from '@/server/api/trpc'

// Input validation schemas
const analyticsFiltersSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  tz: z.string().default('America/Sao_Paulo'),
  product: z.string().optional(),
  gateway: z.string().optional(),
  country: z.string().optional(),
})

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

export const analyticsRouter = createTRPCRouter({
  /**
   * Get comprehensive KPIs for the dashboard
   */
  kpis: publicProcedure
    .input(analyticsFiltersSchema)
    .output(kpisOutputSchema)
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input
      
      // Validate date range
      const fromDate = new Date(from)
      const toDate = new Date(to)
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
                  user: {
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
                user: true,
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
                user: {
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
              user: {
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
                startDate: { lt: toAdjusted }
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
              user: {
                country,
              },
            }),
          },
        })

        // Helper function to convert currency to BRL (simplified rates)
        const convertToBRL = (amount: number, currency: string): number => {
          const rates: Record<string, number> = {
            'USD': 5.50, // Example rate
            'EUR': 6.00, // Example rate
            'BRL': 1.00,
          }
          return amount * (rates[currency] || rates['USD'] || 1.00)
        }

        // Calculate metrics using order_items.price with currency conversion
        const receita_bruta = orderItems.reduce((sum, item) => {
          if (!item.price || !item.order?.currency) return sum
          const amount = Number(item.price)
          if (isNaN(amount)) return sum
          const currency = item.order.currency
          return sum + convertToBRL(amount, currency)
        }, 0)
        
        // For now, we don't have tax data in order_items, so setting to 0
        const impostos = 0
        
        const refunds_total = refunds.reduce((sum, r) => {
          const amount = r.amountBrl ? Number(r.amountBrl) : 0
          return sum + (isNaN(amount) ? 0 : amount)
        }, 0)
        
        const cb_losses = disputes.reduce((sum, d) => {
          const loss = d.netLossBrl ? Number(d.netLossBrl) : 0
          return sum + (isNaN(loss) ? 0 : loss)
        }, 0)
        
        const receita_liquida = calculateNetRevenue(receita_bruta, impostos, refunds_total, cb_losses)
        
        // Get unique orders count
        const uniqueOrderIds = new Set(completedOrders.map(o => o.id))
        const pedidos = uniqueOrderIds.size
        const pagamentos = orderItems.length // Total order items as "pagamentos"
        
        const ticket_medio = calculateAOV(receita_bruta, pedidos)
        const refund_rate = calculateRate(refunds_total, receita_bruta)
        const cb_rate = calculateRate(cb_losses, receita_bruta)

        // Calculate MRR from subscription order items
        const subscriptionOrderItems = orderItems.filter(oi => 
          oi.pricingType === 'subscription' && oi.subscriptions && oi.subscriptions.length > 0
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
   */
  revenueTimeseries: publicProcedure
    .input(analyticsFiltersSchema)
    .output(z.array(timeseriesPointSchema))
    .query(async ({ ctx, input }) => {
      const { from, to, tz, product, gateway, country } = input
      
      const fromDate = adjustTimezone(new Date(from), tz)
      const toDate = adjustTimezone(new Date(to), tz)

      try {
        // Use CTE with orders and order_items (no payments table)
        const results = await ctx.db.$queryRaw<Array<{ day: string; receita_brl: string }>>`
          WITH daily_revenue AS (
            SELECT 
              DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz}) as order_day,
              oi.price,
              o.currency
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
            LEFT JOIN users u ON oi.user_id = u.id
            WHERE o.created_at >= ${fromDate}
              AND o.created_at <= ${toDate}
              AND o.status = 'COMPLETED'
              ${gateway ? Prisma.sql`AND o.gateway = ${gateway}` : Prisma.sql``}
              ${product ? Prisma.sql`AND plv.product_code = ${product}` : Prisma.sql``}
              ${country ? Prisma.sql`AND u.country = ${country}` : Prisma.sql``}
              AND oi.price IS NOT NULL
          )
          SELECT 
            order_day::text as day,
            SUM(
              CASE 
                WHEN currency = 'USD' THEN COALESCE(price, 0) * 5.50
                WHEN currency = 'EUR' THEN COALESCE(price, 0) * 6.00
                ELSE COALESCE(price, 0)
              END
            )::text as receita_brl
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
  ordersTimeseries: publicProcedure
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
              ${product ? Prisma.sql`
                AND EXISTS (
                  SELECT 1 FROM order_items oi 
                  LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id 
                  WHERE oi.order_id = o.id AND plv.product_code = ${product}
                )
              ` : Prisma.sql``}
              ${country ? Prisma.sql`
                AND EXISTS (
                  SELECT 1 FROM order_items oi 
                  LEFT JOIN users u ON oi.user_id = u.id 
                  WHERE oi.order_id = o.id AND u.country = ${country}
                )
              ` : Prisma.sql``}
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
  productsTop: publicProcedure
    .input(analyticsFiltersSchema.extend({ limit: productsLimitSchema }))
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
          Prisma.sql`oi.price IS NOT NULL`
        ]
        
        if (gateway) {
          whereConditions.push(Prisma.sql`o.gateway = ${gateway}`)
        }
        if (country) {
          whereConditions.push(Prisma.sql`u.country = ${country}`)
        }

        const results = await ctx.db.$queryRaw<Array<{
          product_code: string
          pedidos: number
          receita_brl: string
          refunds_brl: string
        }>>`
          SELECT 
            plv.product_code,
            COUNT(DISTINCT o.id)::int as pedidos,
            SUM(
              CASE 
                WHEN o.currency = 'USD' THEN COALESCE(oi.price, 0) * 5.50
                WHEN o.currency = 'EUR' THEN COALESCE(oi.price, 0) * 6.00
                ELSE COALESCE(oi.price, 0)
              END
            )::text as receita_brl,
            COALESCE(SUM(r.amount_brl), 0)::text as refunds_brl
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
          LEFT JOIN users u ON oi.user_id = u.id
          LEFT JOIN refunds r ON oi.id = r.order_item_id AND r.created_at >= ${fromDate} AND r.created_at <= ${toDate}
          WHERE ${Prisma.join(whereConditions, ' AND ')}
          GROUP BY plv.product_code
          ORDER BY SUM(
            CASE 
              WHEN o.currency = 'USD' THEN COALESCE(oi.price, 0) * 5.50
              WHEN o.currency = 'EUR' THEN COALESCE(oi.price, 0) * 6.00
              ELSE COALESCE(oi.price, 0)
            END
          ) DESC
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
  subscriptionsSummary: publicProcedure
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
                startDate: { lt: toDate }
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
              user: {
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
              user: {
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
              user: {
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
                user: {
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
  disputesSummary: publicProcedure
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
  paymentsRecent: publicProcedure
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
                user: true,
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
            const user = orderItem?.user

            return {
              payment_id: payment.id.toString(),
              paid_at: payment.createdAt,
              order_id: orderItem?.orderId ? orderItem.orderId.toString() : null,
              product_code: productVersion?.productCode || null,
              amount_brl: payment.amountBrl ? Number(payment.amountBrl).toFixed(2) : '0.00',
              gateway: payment.gateway || null,
              payment_method: payment.paymentMethod || null,
              country: user?.country || null,
            }
          } catch (mappingError) {
            console.error(`[paymentsRecent] Error mapping payment ${index}:`, {
              paymentId: payment.id,
              error: mappingError,
              paymentData: {
                hasOrderItem: !!payment.orderItem,
                hasProductVersion: !!payment.orderItem?.productVersion,
                hasUser: !!payment.orderItem?.user,
              }
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
})