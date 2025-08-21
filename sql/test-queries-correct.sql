-- 🧪 TEST ANALYTICS QUERIES (ESTRUTURA REAL DO BANCO)
-- Execute estas queries no Supabase SQL Editor para testar as views e validar dados

-- 1. Teste básico das views - verificar se retornam dados
SELECT 'vw_payments_success' as view_name, COUNT(*) as record_count FROM analytics.vw_payments_success
UNION ALL
SELECT 'vw_order_revenue_brl', COUNT(*) FROM analytics.vw_order_revenue_brl
UNION ALL
SELECT 'vw_refunds', COUNT(*) FROM analytics.vw_refunds
UNION ALL
SELECT 'vw_dispute_losses', COUNT(*) FROM analytics.vw_dispute_losses
UNION ALL
SELECT 'vw_subscription_metrics', COUNT(*) FROM analytics.vw_subscription_metrics
ORDER BY record_count DESC;

-- 2. Teste de KPIs - simulando a query do tRPC (últimos 30 dias)
WITH date_range AS (
    SELECT 
        CURRENT_DATE - INTERVAL '30 days' as start_date,
        CURRENT_DATE as end_date
),
payments_data AS (
    SELECT 
        COUNT(DISTINCT order_id) as order_count,
        COUNT(*) as payment_count,
        COALESCE(SUM(amount_brl), 0) as gross_revenue_brl,
        COALESCE(SUM(tax_brl), 0) as total_tax_brl,
        COALESCE(AVG(amount_brl), 0) as avg_ticket_brl
    FROM analytics.vw_payments_success p, date_range dr
    WHERE DATE(p.paid_at) BETWEEN dr.start_date AND dr.end_date
),
refunds_data AS (
    SELECT 
        COALESCE(SUM(amount_brl), 0) as total_refunds_brl
    FROM analytics.vw_refunds r, date_range dr
    WHERE DATE(r.refund_date) BETWEEN dr.start_date AND dr.end_date
),
disputes_data AS (
    SELECT 
        COALESCE(SUM(net_loss_brl), 0) as total_chargeback_losses_brl
    FROM analytics.vw_dispute_losses d, date_range dr
    WHERE DATE(d.loss_date) BETWEEN dr.start_date AND dr.end_date
),
subscriptions_data AS (
    SELECT 
        COUNT(*) FILTER (WHERE is_active) as active_subscriptions,
        COUNT(*) FILTER (WHERE start_date_only >= (CURRENT_DATE - INTERVAL '30 days')) as new_subscriptions,
        COUNT(*) FILTER (WHERE canceled_date_only >= (CURRENT_DATE - INTERVAL '30 days')) as churned_subscriptions
    FROM analytics.vw_subscription_metrics
)
SELECT 
    -- KPIs calculados
    p.order_count,
    p.payment_count,
    p.gross_revenue_brl,
    p.total_tax_brl,
    (p.gross_revenue_brl - p.total_tax_brl - r.total_refunds_brl - d.total_chargeback_losses_brl) as net_revenue_brl,
    p.avg_ticket_brl,
    r.total_refunds_brl,
    CASE 
        WHEN p.gross_revenue_brl > 0 
        THEN (r.total_refunds_brl / p.gross_revenue_brl * 100) 
        ELSE 0 
    END as refund_rate_percent,
    d.total_chargeback_losses_brl,
    CASE 
        WHEN p.gross_revenue_brl > 0 
        THEN (d.total_chargeback_losses_brl / p.gross_revenue_brl * 100) 
        ELSE 0 
    END as chargeback_rate_percent,
    s.active_subscriptions,
    s.new_subscriptions,
    s.churned_subscriptions
FROM payments_data p
CROSS JOIN refunds_data r
CROSS JOIN disputes_data d
CROSS JOIN subscriptions_data s;

-- 3. Teste de série temporal de receita (últimos 7 dias)
SELECT 
    DATE(paid_at AT TIME ZONE 'America/Sao_Paulo') as day,
    COALESCE(SUM(amount_brl), 0) as revenue_brl,
    COUNT(DISTINCT order_id) as orders,
    COUNT(*) as payments,
    COUNT(DISTINCT user_country) as countries,
    STRING_AGG(DISTINCT gateway, ', ') as gateways_used
FROM analytics.vw_payments_success
WHERE DATE(paid_at AT TIME ZONE 'America/Sao_Paulo') >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(paid_at AT TIME ZONE 'America/Sao_Paulo')
ORDER BY day;

-- 4. Teste de produtos top (últimos 30 dias)
SELECT 
    product_code,
    product_base_name,
    COUNT(DISTINCT order_id) as orders,
    COUNT(*) as payments,
    COALESCE(SUM(amount_brl), 0) as revenue_brl,
    COALESCE(AVG(amount_brl), 0) as avg_ticket_brl,
    COUNT(DISTINCT user_country) as countries_sold,
    STRING_AGG(DISTINCT gateway, ', ') as gateways_used
FROM analytics.vw_payments_success
WHERE DATE(paid_at) >= CURRENT_DATE - INTERVAL '30 days'
  AND product_code IS NOT NULL
GROUP BY product_code, product_base_name
ORDER BY revenue_brl DESC
LIMIT 10;

-- 5. Teste de disputas (resumo dos últimos 30 dias)
SELECT 
    dispute_status,
    COUNT(*) as total_disputes,
    COALESCE(SUM(amount_brl), 0) as total_amount_brl,
    COALESCE(SUM(net_loss_brl), 0) as total_net_loss_brl,
    COALESCE(AVG(net_loss_brl), 0) as avg_net_loss_brl,
    STRING_AGG(DISTINCT gateway, ', ') as gateways_affected
FROM analytics.vw_dispute_losses
WHERE DATE(opened_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dispute_status
ORDER BY total_net_loss_brl DESC;

-- 6. Teste de assinaturas (métricas atuais)
SELECT 
    COALESCE(billing_interval, 'unknown') as billing_interval,
    COUNT(*) FILTER (WHERE is_active) as active_count,
    COUNT(*) FILTER (WHERE start_date_only >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
    COUNT(*) FILTER (WHERE canceled_date_only >= CURRENT_DATE - INTERVAL '30 days') as churned_this_month,
    COALESCE(SUM(last_payment_brl) FILTER (WHERE is_active), 0) as total_mrr_estimate,
    COUNT(DISTINCT user_country) as countries_active
FROM analytics.vw_subscription_metrics
GROUP BY billing_interval
ORDER BY active_count DESC;

-- 7. Teste de países (análise geográfica)
SELECT 
    COALESCE(user_country, 'Unknown') as country,
    COUNT(DISTINCT order_id) as orders,
    COALESCE(SUM(amount_brl), 0) as revenue_brl,
    COALESCE(AVG(amount_brl), 0) as avg_ticket_brl,
    COUNT(DISTINCT product_code) as unique_products
FROM analytics.vw_payments_success
WHERE DATE(paid_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_country
ORDER BY revenue_brl DESC
LIMIT 10;

-- 8. Teste de gateways (performance por gateway)
SELECT 
    COALESCE(gateway, 'Unknown') as gateway,
    COUNT(*) as payments,
    COALESCE(SUM(amount_brl), 0) as revenue_brl,
    COALESCE(AVG(amount_brl), 0) as avg_ticket_brl,
    COUNT(DISTINCT user_country) as countries_served
FROM analytics.vw_payments_success
WHERE DATE(paid_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY gateway
ORDER BY revenue_brl DESC;

-- 9. Verificar integridade dos dados
SELECT 
    'Data Integrity Check' as check_type,
    
    -- Verificar se há pagamentos órfãos (sem order_item)
    (SELECT COUNT(*) FROM payments WHERE order_item_id IS NULL) as orphan_payments,
    
    -- Verificar se há order_items órfãos (sem order)
    (SELECT COUNT(*) FROM order_items WHERE order_id IS NULL) as orphan_order_items,
    
    -- Verificar se há orders órfãos (sem user)
    (SELECT COUNT(*) FROM orders WHERE user_id IS NULL) as orphan_orders,
    
    -- Verificar se há produtos sem versões de idioma
    (SELECT COUNT(*) FROM products p WHERE NOT EXISTS (
        SELECT 1 FROM product_language_versions plv WHERE plv.product_id = p.id
    )) as products_without_versions;

-- 10. Teste de timezone das queries
SELECT 
    'Timezone Test' as test_type,
    current_setting('timezone') as db_timezone,
    NOW() as utc_now,
    NOW() AT TIME ZONE 'America/Sao_Paulo' as sao_paulo_now,
    DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') as sao_paulo_date,
    
    -- Verificar diferença entre UTC e BRT para dados atuais
    (SELECT COUNT(*) FROM payments WHERE DATE(created_at) = CURRENT_DATE) as payments_today_utc,
    (SELECT COUNT(*) FROM payments WHERE DATE(created_at AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE) as payments_today_brt;

-- 11. Amostra de dados para verificação manual
SELECT 
    'Sample Data' as section,
    'Top 5 Recent Payments' as description;

SELECT 
    p.id,
    p.amount_brl,
    p.status,
    p.gateway,
    p.created_at,
    u.name as user_name,
    u.country,
    plv.product_code
FROM payments p
LEFT JOIN order_items oi ON p.order_item_id = oi.id
LEFT JOIN users u ON oi.user_id = u.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
ORDER BY p.created_at DESC
LIMIT 5;

-- 12. Validação final - verificar se todas as views e índices estão funcionando
SELECT 
    'Analytics Setup Validation' as status,
    (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'analytics') as views_created,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename IN ('payments', 'orders', 'order_items', 'subscriptions', 'refunds', 'disputes')) as indexes_found,
    CASE 
        WHEN (SELECT COUNT(*) FROM analytics.vw_payments_success) > 0 
        THEN 'Analytics views have data' 
        ELSE 'Analytics views are empty - check data population' 
    END as data_status;