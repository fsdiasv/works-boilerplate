-- 🔍 CREATE ANALYTICS VIEWS (MINIMAL SAFE VERSION)
-- Execute este SQL no Supabase SQL Editor para criar views básicas de analytics
-- Esta versão usa apenas colunas que garantidamente existem

-- Criar schema analytics se não existir
CREATE SCHEMA IF NOT EXISTS analytics;

-- 1. VIEW: Pagamentos bem-sucedidos (versão mínima)
CREATE OR REPLACE VIEW analytics.vw_payments_success AS
SELECT 
    p.id as payment_id,
    p.order_item_id,
    COALESCE(p.gateway, 'unknown') as gateway,
    p.gateway_transaction_id,
    COALESCE(p.amount, 0) as amount,
    COALESCE(p.amount_brl, 0) as amount_brl,
    COALESCE(p.tax_brl, 0) as tax_brl,
    COALESCE(p.currency, 'BRL') as currency,
    COALESCE(p.status, 'unknown') as status,
    p.payment_method,
    p.created_at as paid_at,
    p.updated_at,
    
    -- Order item info (básico)
    oi.order_id,
    oi.product_version_id,
    oi.user_id,
    COALESCE(oi.price, 0) as item_price,
    
    -- Order info (básico)
    o.user_id as order_user_id,
    o.status as order_status,
    
    -- Product info (básico)
    plv.product_code,
    plv.translated_title,
    p_base.base_name as product_base_name
    
FROM payments p
LEFT JOIN order_items oi ON p.order_item_id = oi.id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN products p_base ON plv.product_id = p_base.id
WHERE COALESCE(p.status, '') IN ('succeeded', 'paid', 'captured', 'completed');

-- 2. VIEW: Receita por pedido/dia em BRL (versão simplificada)
CREATE OR REPLACE VIEW analytics.vw_order_revenue_brl AS
SELECT 
    o.id as order_id,
    o.user_id,
    DATE(o.created_at) as order_date,
    DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') as order_date_brt,
    
    -- Aggregated payment data
    COUNT(p.id) as payment_count,
    COALESCE(SUM(p.amount_brl), 0) as gross_revenue_brl,
    COALESCE(SUM(p.tax_brl), 0) as total_tax_brl,
    COALESCE(AVG(p.amount_brl), 0) as avg_payment_brl,
    
    -- Product info (from first item)
    MAX(plv.product_code) as primary_product_code,
    MAX(plv.translated_title) as primary_product_title,
    
    o.created_at as order_created_at
    
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payments p ON oi.id = p.order_item_id 
    AND COALESCE(p.status, '') IN ('succeeded', 'paid', 'captured', 'completed')
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
GROUP BY o.id, o.user_id, o.created_at
HAVING COALESCE(SUM(p.amount_brl), 0) > 0;

-- 3. VIEW: Reembolsos (versão básica)
CREATE OR REPLACE VIEW analytics.vw_refunds AS
SELECT 
    r.id as refund_id,
    r.payment_id,
    r.order_item_id,
    r.dispute_id,
    r.type as refund_type,
    r.reason,
    COALESCE(r.amount, 0) as amount,
    COALESCE(r.amount_brl, 0) as amount_brl,
    COALESCE(r.tax_refund_brl, 0) as tax_refund_brl,
    r.created_at as refund_date,
    DATE(r.created_at) as refund_date_only,
    DATE(r.created_at AT TIME ZONE 'America/Sao_Paulo') as refund_date_brt,
    
    -- Payment info
    p.gateway,
    p.payment_method,
    
    -- Order info
    oi.order_id,
    oi.user_id,
    plv.product_code,
    plv.translated_title as product_title
    
FROM refunds r
LEFT JOIN payments p ON r.payment_id = p.id
LEFT JOIN order_items oi ON COALESCE(r.order_item_id, p.order_item_id) = oi.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id;

-- 4. VIEW: Perdas por disputas (versão básica)
CREATE OR REPLACE VIEW analytics.vw_dispute_losses AS
SELECT 
    d.id as dispute_id,
    d.payment_id,
    d.order_item_id,
    d.user_id,
    COALESCE(d.gateway, 'unknown') as gateway,
    d.gateway_dispute_id,
    d.type as dispute_type,
    COALESCE(d.status, 'unknown') as dispute_status,
    COALESCE(d.amount, 0) as amount,
    COALESCE(d.amount_brl, 0) as amount_brl,
    COALESCE(d.fee_amount, 0) as fee_amount,
    COALESCE(d.fee_amount_brl, 0) as fee_amount_brl,
    COALESCE(d.net_loss_brl, 0) as net_loss_brl,
    d.outcome,
    
    -- Dates
    d.opened_at,
    d.resolved_at,
    DATE(d.opened_at) as opened_date,
    DATE(d.opened_at AT TIME ZONE 'America/Sao_Paulo') as opened_date_brt,
    DATE(COALESCE(d.resolved_at, d.opened_at)) as loss_date,
    DATE(COALESCE(d.resolved_at, d.opened_at) AT TIME ZONE 'America/Sao_Paulo') as loss_date_brt,
    
    -- Product info
    plv.product_code,
    plv.translated_title as product_title,
    
    -- Order info
    oi.order_id
    
FROM disputes d
LEFT JOIN payments p ON d.payment_id = p.id
LEFT JOIN order_items oi ON COALESCE(d.order_item_id, p.order_item_id) = oi.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id;

-- 5. VIEW: Métricas de assinaturas (versão muito básica)
CREATE OR REPLACE VIEW analytics.vw_subscription_metrics AS
SELECT 
    s.id as subscription_id,
    s.order_item_id,
    s.user_id,
    COALESCE(s.status, 'unknown') as subscription_status,
    s.billing_interval,
    s.start_date,
    s.canceled_at,
    
    -- Dates for timezone conversion
    DATE(s.start_date) as start_date_only,
    DATE(s.start_date AT TIME ZONE 'America/Sao_Paulo') as start_date_brt,
    DATE(s.canceled_at) as canceled_date_only,
    DATE(s.canceled_at AT TIME ZONE 'America/Sao_Paulo') as canceled_date_brt,
    
    -- Status categorization
    CASE 
        WHEN COALESCE(s.status, '') IN ('active', 'trialing') OR (s.canceled_at IS NULL AND s.start_date <= CURRENT_DATE) 
        THEN true 
        ELSE false 
    END as is_active,
    
    CASE 
        WHEN s.canceled_at IS NOT NULL 
        THEN true 
        ELSE false 
    END as is_churned,
    
    -- Product info
    plv.product_code,
    plv.translated_title as product_title,
    
    -- Order info for revenue calculation
    oi.order_id,
    COALESCE(oi.price, 0) as subscription_price
    
FROM subscriptions s
LEFT JOIN order_items oi ON s.order_item_id = oi.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id;

-- Comentários nas views
COMMENT ON VIEW analytics.vw_payments_success IS 'Pagamentos bem-sucedidos (versão básica)';
COMMENT ON VIEW analytics.vw_order_revenue_brl IS 'Receita agregada por pedido em BRL (versão básica)';
COMMENT ON VIEW analytics.vw_refunds IS 'Reembolsos (versão básica)';
COMMENT ON VIEW analytics.vw_dispute_losses IS 'Disputas e chargebacks (versão básica)';
COMMENT ON VIEW analytics.vw_subscription_metrics IS 'Métricas de assinaturas (versão básica)';

-- Verificar se as views foram criadas
SELECT 
    schemaname, 
    viewname,
    'Created successfully' as status
FROM pg_views 
WHERE schemaname = 'analytics'
ORDER BY viewname;

-- Teste rápido das views
SELECT 'vw_payments_success' as view_name, COUNT(*) as records FROM analytics.vw_payments_success
UNION ALL
SELECT 'vw_order_revenue_brl', COUNT(*) FROM analytics.vw_order_revenue_brl
UNION ALL
SELECT 'vw_refunds', COUNT(*) FROM analytics.vw_refunds
UNION ALL
SELECT 'vw_dispute_losses', COUNT(*) FROM analytics.vw_dispute_losses
UNION ALL
SELECT 'vw_subscription_metrics', COUNT(*) FROM analytics.vw_subscription_metrics;