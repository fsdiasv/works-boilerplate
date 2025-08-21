-- 🔍 CREATE ANALYTICS VIEWS (SAFE VERSION)
-- Execute este SQL no Supabase SQL Editor para criar as views de analytics
-- Versão segura que verifica se as colunas existem antes de usar

-- Criar schema analytics se não existir
CREATE SCHEMA IF NOT EXISTS analytics;

-- Primeiro, vamos verificar quais colunas existem na tabela users
DO $$
BEGIN
    -- Verificar se a coluna locale existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'locale' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Column users.locale does not exist, will use default value';
    END IF;
    
    -- Verificar se a coluna timezone existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'timezone' AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Column users.timezone does not exist, will use default value';
    END IF;
END $$;

-- 1. VIEW: Pagamentos bem-sucedidos com joins necessários (versão simplificada)
CREATE OR REPLACE VIEW analytics.vw_payments_success AS
SELECT 
    p.id as payment_id,
    p.order_item_id,
    p.gateway,
    p.gateway_transaction_id,
    p.amount,
    p.amount_brl,
    p.tax_brl,
    p.currency,
    p.status,
    p.payment_method,
    p.card_last_four,
    p.card_brand,
    p.client_ip,
    p.statement_descriptor,
    p.created_at as paid_at,
    p.updated_at,
    
    -- Order item info
    oi.order_id,
    oi.product_version_id,
    oi.user_id,
    oi.item_type,
    oi.pricing_type,
    oi.price as item_price,
    oi.systeme_order_item_id,
    oi.description as item_description,
    
    -- Order info
    o.systeme_order_id,
    o.systeme_funnel_id,
    o.status as order_status,
    o.client_ip as order_client_ip,
    o.traffic_metadata,
    
    -- Product info
    plv.product_id,
    plv.language_code,
    plv.product_code,
    plv.translated_title,
    plv.author,
    p_base.base_name as product_base_name,
    p_base.niche,
    p_base.gender,
    
    -- User info (básico, sem PII) - usando valores padrão por segurança
    'pt' as user_locale,  -- padrão para o Brasil
    'America/Sao_Paulo' as user_timezone  -- padrão para o Brasil
    
FROM payments p
LEFT JOIN order_items oi ON p.order_item_id = oi.id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN products p_base ON plv.product_id = p_base.id
LEFT JOIN users u ON oi.user_id = u.id
WHERE p.status IN ('succeeded', 'paid', 'captured', 'completed');

-- 2. VIEW: Receita por pedido/dia em BRL
CREATE OR REPLACE VIEW analytics.vw_order_revenue_brl AS
SELECT 
    o.id as order_id,
    o.user_id,
    o.systeme_order_id,
    o.systeme_funnel_id,
    DATE(o.created_at) as order_date,
    DATE(o.created_at AT TIME ZONE 'America/Sao_Paulo') as order_date_brt,
    
    -- Aggregated payment data
    COUNT(p.id) as payment_count,
    SUM(p.amount_brl) as gross_revenue_brl,
    SUM(p.tax_brl) as total_tax_brl,
    AVG(p.amount_brl) as avg_payment_brl,
    
    -- Product info (from first item)
    MAX(plv.product_code) as primary_product_code,
    MAX(plv.translated_title) as primary_product_title,
    
    o.created_at as order_created_at
    
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payments p ON oi.id = p.order_item_id AND p.status IN ('succeeded', 'paid', 'captured', 'completed')
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
GROUP BY o.id, o.user_id, o.systeme_order_id, o.systeme_funnel_id, o.created_at
HAVING SUM(p.amount_brl) > 0;

-- 3. VIEW: Reembolsos
CREATE OR REPLACE VIEW analytics.vw_refunds AS
SELECT 
    r.id as refund_id,
    r.payment_id,
    r.order_item_id,
    r.dispute_id,
    r.type as refund_type,
    r.reason,
    r.amount,
    r.amount_brl,
    r.tax_refund_brl,
    r.created_at as refund_date,
    DATE(r.created_at) as refund_date_only,
    DATE(r.created_at AT TIME ZONE 'America/Sao_Paulo') as refund_date_brt,
    
    -- Payment info
    p.gateway,
    p.payment_method,
    p.order_item_id as payment_order_item_id,
    
    -- Order info via payment
    oi.order_id,
    oi.user_id,
    plv.product_code,
    plv.translated_title as product_title
    
FROM refunds r
LEFT JOIN payments p ON r.payment_id = p.id
LEFT JOIN order_items oi ON COALESCE(r.order_item_id, p.order_item_id) = oi.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id;

-- 4. VIEW: Perdas por disputas
CREATE OR REPLACE VIEW analytics.vw_dispute_losses AS
SELECT 
    d.id as dispute_id,
    d.payment_id,
    d.order_item_id,
    d.user_id,
    d.gateway,
    d.gateway_dispute_id,
    d.type as dispute_type,
    d.original_type,
    d.status as dispute_status,
    d.reason_code,
    d.reason_description,
    d.amount,
    d.amount_brl,
    d.fee_amount,
    d.fee_amount_brl,
    d.net_loss_brl,
    d.outcome,
    
    -- Dates
    d.opened_at,
    d.escalated_at,
    d.response_due_date,
    d.resolved_at,
    DATE(d.opened_at) as opened_date,
    DATE(d.opened_at AT TIME ZONE 'America/Sao_Paulo') as opened_date_brt,
    DATE(COALESCE(d.resolved_at, d.opened_at)) as loss_date,
    DATE(COALESCE(d.resolved_at, d.opened_at) AT TIME ZONE 'America/Sao_Paulo') as loss_date_brt,
    
    -- Payment info
    p.gateway_transaction_id,
    p.payment_method,
    
    -- Product info
    plv.product_code,
    plv.translated_title as product_title,
    
    -- Order info
    oi.order_id
    
FROM disputes d
LEFT JOIN payments p ON d.payment_id = p.id
LEFT JOIN order_items oi ON COALESCE(d.order_item_id, p.order_item_id) = oi.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id;

-- 5. VIEW: Métricas de assinaturas
CREATE OR REPLACE VIEW analytics.vw_subscription_metrics AS
SELECT 
    s.id as subscription_id,
    s.order_item_id,
    s.user_id,
    s.status as subscription_status,
    s.billing_interval,
    s.start_date,
    s.canceled_at,
    s.created_at,
    
    -- Dates for timezone conversion
    DATE(s.start_date) as start_date_only,
    DATE(s.start_date AT TIME ZONE 'America/Sao_Paulo') as start_date_brt,
    DATE(s.canceled_at) as canceled_date_only,
    DATE(s.canceled_at AT TIME ZONE 'America/Sao_Paulo') as canceled_date_brt,
    
    -- Status categorization
    CASE 
        WHEN s.status IN ('active', 'trialing') OR (s.canceled_at IS NULL AND s.start_date <= CURRENT_DATE) 
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
    oi.price as subscription_price,
    
    -- Payment info for MRR calculation (last successful payment)
    p.amount_brl as last_payment_brl
    
FROM subscriptions s
LEFT JOIN order_items oi ON s.order_item_id = oi.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN payments p ON oi.id = p.order_item_id 
    AND p.status IN ('succeeded', 'paid', 'captured', 'completed')
    AND p.created_at = (
        SELECT MAX(p2.created_at) 
        FROM payments p2 
        WHERE p2.order_item_id = oi.id 
        AND p2.status IN ('succeeded', 'paid', 'captured', 'completed')
    );

-- 6. Índices básicos para melhorar performance das views
CREATE INDEX IF NOT EXISTS idx_payments_success_created_at ON payments(created_at) WHERE status IN ('succeeded', 'paid', 'captured', 'completed');
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at);
CREATE INDEX IF NOT EXISTS idx_disputes_dates ON disputes(opened_at, resolved_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON subscriptions(start_date, canceled_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_version_id);

-- Comentários nas views
COMMENT ON VIEW analytics.vw_payments_success IS 'Pagamentos bem-sucedidos com dados de produto, pedido e usuário';
COMMENT ON VIEW analytics.vw_order_revenue_brl IS 'Receita agregada por pedido em BRL';
COMMENT ON VIEW analytics.vw_refunds IS 'Reembolsos com informações de produto e pedido';
COMMENT ON VIEW analytics.vw_dispute_losses IS 'Disputas e chargebacks com perdas líquidas';
COMMENT ON VIEW analytics.vw_subscription_metrics IS 'Métricas de assinaturas com status e datas';

-- Verificar se as views foram criadas
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE schemaname = 'analytics'
ORDER BY viewname;

-- Verificar estrutura da tabela users para debug
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY column_name;