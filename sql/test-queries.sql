-- 🧪 TEST ANALYTICS QUERIES
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

-- 2. Teste de KPIs - simulando a query do tRPC
-- (Últimos 30 dias como exemplo)
WITH date_range AS (
    SELECT 
        CURRENT_DATE - INTERVAL '30 days' as start_date,
        CURRENT_DATE as end_date
),
payments_data AS (
    SELECT 
        COUNT(DISTINCT order_id) as order_count,
        COUNT(*) as payment_count,
        SUM(amount_brl) as gross_revenue_brl,
        SUM(tax_brl) as total_tax_brl,
        AVG(amount_brl) as avg_ticket_brl
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
    SUM(amount_brl) as revenue_brl,
    COUNT(DISTINCT order_id) as orders,
    COUNT(*) as payments
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
    SUM(amount_brl) as revenue_brl,
    AVG(amount_brl) as avg_ticket_brl
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
    SUM(amount_brl) as total_amount_brl,
    SUM(net_loss_brl) as total_net_loss_brl,
    AVG(net_loss_brl) as avg_net_loss_brl
FROM analytics.vw_dispute_losses
WHERE DATE(opened_at) >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dispute_status
ORDER BY total_net_loss_brl DESC;

-- 6. Teste de assinaturas (métricas atuais)
SELECT 
    billing_interval,
    COUNT(*) FILTER (WHERE is_active) as active_count,
    COUNT(*) FILTER (WHERE start_date_only >= CURRENT_DATE - INTERVAL '30 days') as new_this_month,
    COUNT(*) FILTER (WHERE canceled_date_only >= CURRENT_DATE - INTERVAL '30 days') as churned_this_month,
    SUM(last_payment_brl) FILTER (WHERE is_active) as total_mrr_estimate
FROM analytics.vw_subscription_metrics
WHERE billing_interval IS NOT NULL
GROUP BY billing_interval
ORDER BY active_count DESC;

-- 7. Teste de performance das queries (EXPLAIN ANALYZE)
-- Descomente para testar performance
/*
EXPLAIN ANALYZE
SELECT 
    COUNT(DISTINCT order_id) as orders,
    SUM(amount_brl) as revenue
FROM analytics.vw_payments_success
WHERE DATE(paid_at AT TIME ZONE 'America/Sao_Paulo') >= CURRENT_DATE - INTERVAL '30 days';
*/

-- 8. Verificar timezone das queries
SELECT 
    current_setting('timezone') as db_timezone,
    NOW() as utc_now,
    NOW() AT TIME ZONE 'America/Sao_Paulo' as sao_paulo_now,
    DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') as sao_paulo_date;

-- 9. Teste de dados sample para desenvolvimento (se não houver dados reais)
-- Descomente apenas se precisar de dados de teste
/*
-- INSERIR DADOS DE TESTE - APENAS SE NECESSÁRIO
INSERT INTO users (id, email, full_name) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'test1@example.com', 'Test User 1'),
('550e8400-e29b-41d4-a716-446655440002', 'test2@example.com', 'Test User 2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, product_code, base_name) VALUES 
('prod-001', 'COURSE-001', 'Test Course 1'),
('prod-002', 'COURSE-002', 'Test Course 2')
ON CONFLICT (id) DO NOTHING;

-- Continue apenas se realmente precisar de dados de teste...
*/

-- 10. Validação final - verificar se todas as views e índices estão funcionando
SELECT 
    'Analytics setup complete' as status,
    'Views: ' || COUNT(*) as view_count
FROM pg_views 
WHERE schemaname = 'analytics';