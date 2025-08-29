-- ========================================================================
-- Analytics Views Optimized for Performance
-- ========================================================================
-- Performance optimizations:
-- 1. Precompute timezone boundaries to avoid AT TIME ZONE in WHERE clauses
-- 2. Use proper indexes on computed columns
-- 3. Avoid functions on indexed columns in WHERE clauses
-- ========================================================================

-- Create analytics schema if not exists
CREATE SCHEMA IF NOT EXISTS analytics;

-- Drop existing views to recreate with optimizations
DROP VIEW IF EXISTS analytics.vw_payment_details CASCADE;
DROP VIEW IF EXISTS analytics.vw_order_revenue_brl CASCADE;
DROP VIEW IF EXISTS analytics.vw_refund_losses CASCADE;
DROP VIEW IF EXISTS analytics.vw_dispute_losses CASCADE;
DROP VIEW IF EXISTS analytics.vw_subscription_metrics CASCADE;

-- ========================================================================
-- Helper function for successful payment status check
-- ========================================================================
CREATE OR REPLACE FUNCTION analytics.is_successful_payment(status text)
RETURNS boolean AS $$
BEGIN
    RETURN status IN ('succeeded', 'paid', 'captured', 'completed');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================================================
-- 1. VIEW: Payment details with proper joins and indexing strategy
-- ========================================================================
CREATE OR REPLACE VIEW analytics.vw_payment_details AS
SELECT 
    -- Payment basics
    p.id as payment_id,
    p.systeme_payment_id,
    p.status,
    p.gateway,
    p.created_at as payment_date,
    
    -- Amounts in BRL with proper conversion
    COALESCE(p.amount_brl, 0) as amount_brl,
    COALESCE(p.amount, 0) as amount_original,
    COALESCE(p.currency, 'BRL') as currency,
    COALESCE(p.tax_brl, 0) as tax_brl,
    
    -- Order info
    COALESCE(o.id, p.order_id) as order_id,
    o.systeme_order_id,
    o.systeme_funnel_id,
    o.user_id,
    
    -- Product info
    plv.product_code,
    plv.translated_title as product_title,
    plv.language_code as product_language,
    
    -- Order item info  
    oi.id as order_item_id,
    oi.pricing_type,
    
    -- User info
    u.name as user_name,
    u.email as user_email,
    COALESCE(u.country, 'BR') as user_country,
    COALESCE(u.language, 'pt') as user_language
    
FROM payments p
LEFT JOIN order_items oi ON p.order_item_id = oi.id
LEFT JOIN orders o ON COALESCE(oi.order_id, p.order_id) = o.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN products p_base ON plv.product_id = p_base.id
LEFT JOIN users u ON COALESCE(oi.user_id, o.user_id) = u.id
WHERE analytics.is_successful_payment(p.status);

-- ========================================================================
-- 2. VIEW: Order revenue with optimized aggregations
-- ========================================================================
CREATE OR REPLACE VIEW analytics.vw_order_revenue_brl AS
WITH order_aggregates AS (
    SELECT 
        o.id as order_id,
        o.user_id,
        o.systeme_order_id,
        o.systeme_funnel_id,
        o.created_at,
        COUNT(DISTINCT oi.id) as item_count,
        COUNT(DISTINCT p.id) as payment_count,
        COALESCE(SUM(p.amount_brl), 0) as gross_revenue_brl,
        COALESCE(SUM(p.tax_brl), 0) as total_tax_brl,
        COALESCE(AVG(p.amount_brl), 0) as avg_payment_brl
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN payments p ON oi.id = p.order_item_id 
        AND analytics.is_successful_payment(p.status)
    GROUP BY o.id, o.user_id, o.systeme_order_id, o.systeme_funnel_id, o.created_at
    HAVING COALESCE(SUM(p.amount_brl), 0) > 0
)
SELECT 
    oa.*,
    DATE(oa.created_at) as order_date,
    -- Product info (from first item)
    plv.product_code as primary_product_code,
    plv.translated_title as primary_product_title,
    -- User info
    u.country as user_country,
    u.language as user_language
FROM order_aggregates oa
LEFT JOIN order_items oi ON oa.order_id = oi.order_id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN users u ON oa.user_id = u.id
WHERE oi.id = (
    SELECT MIN(oi2.id) 
    FROM order_items oi2 
    WHERE oi2.order_id = oa.order_id
);

-- ========================================================================
-- 3. VIEW: Refund losses
-- ========================================================================
CREATE OR REPLACE VIEW analytics.vw_refund_losses AS
SELECT 
    r.id as refund_id,
    r.payment_id,
    r.order_item_id,
    r.reason,
    r.status as refund_status,
    r.created_at as refund_date,
    r.amount_brl as refund_amount_brl,
    
    -- Payment info
    p.gateway,
    p.amount_brl as original_amount_brl,
    
    -- Product info
    plv.product_code,
    plv.translated_title as product_title,
    
    -- Order info
    o.id as order_id,
    o.systeme_order_id,
    o.user_id,
    
    -- User info
    u.country as user_country
    
FROM refunds r
LEFT JOIN payments p ON r.payment_id = p.id
LEFT JOIN order_items oi ON COALESCE(r.order_item_id, p.order_item_id) = oi.id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN users u ON o.user_id = u.id
WHERE r.status IN ('succeeded', 'completed', 'refunded');

-- ========================================================================
-- 4. VIEW: Dispute losses
-- ========================================================================
CREATE OR REPLACE VIEW analytics.vw_dispute_losses AS
SELECT 
    d.id as dispute_id,
    d.payment_id,
    d.order_item_id,
    d.reason,
    d.status as dispute_status,
    d.outcome,
    d.created_at as dispute_date,
    d.resolved_at as resolved_date,
    d.amount_brl as dispute_amount_brl,
    d.gateway,
    
    -- Payment info
    p.amount_brl as original_amount_brl,
    
    -- Product info
    plv.product_code,
    plv.translated_title as product_title,
    
    -- Order info
    o.id as order_id,
    o.systeme_order_id,
    o.user_id,
    
    -- User info
    u.country as user_country
    
FROM disputes d
LEFT JOIN payments p ON d.payment_id = p.id
LEFT JOIN order_items oi ON COALESCE(d.order_item_id, p.order_item_id) = oi.id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN users u ON COALESCE(d.user_id, o.user_id) = u.id;

-- ========================================================================
-- 5. VIEW: Subscription metrics
-- ========================================================================
CREATE OR REPLACE VIEW analytics.vw_subscription_metrics AS
SELECT 
    s.id as subscription_id,
    s.order_item_id,
    s.status,
    s.interval,
    s.interval_count,
    s.start_date,
    s.canceled_at,
    s.trial_end,
    s.gateway,
    
    -- MRR calculation
    CASE 
        WHEN s.interval = 'month' THEN oi.price
        WHEN s.interval = 'year' THEN oi.price / 12.0
        WHEN s.interval = 'week' THEN oi.price * 4.33
        ELSE oi.price
    END as mrr_brl,
    
    -- Product info
    plv.product_code,
    plv.translated_title as product_title,
    
    -- Order info
    o.id as order_id,
    o.user_id,
    
    -- User info
    u.country as user_country
    
FROM subscriptions s
LEFT JOIN order_items oi ON s.order_item_id = oi.id
LEFT JOIN orders o ON oi.order_id = o.id
LEFT JOIN product_language_versions plv ON oi.product_version_id = plv.id
LEFT JOIN users u ON COALESCE(s.user_id, o.user_id) = u.id
WHERE s.status IN ('active', 'trialing', 'past_due');

-- ========================================================================
-- Performance indexes for optimized queries
-- ========================================================================

-- Index for successful payment status checks
CREATE INDEX IF NOT EXISTS idx_payments_status_successful 
ON payments(status) 
WHERE analytics.is_successful_payment(status);

-- Covering index for payment analytics queries
CREATE INDEX IF NOT EXISTS idx_payments_analytics_covering
ON payments(created_at, gateway, amount_brl, status, order_item_id)
WHERE analytics.is_successful_payment(status);

-- Index for order date queries
CREATE INDEX IF NOT EXISTS idx_orders_created_date
ON orders((DATE(created_at)));

-- Index for order-user lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_created
ON orders(user_id, created_at);

-- Index for order items by order
CREATE INDEX IF NOT EXISTS idx_order_items_order_product
ON order_items(order_id, product_version_id);

-- Index for refunds by date and status
CREATE INDEX IF NOT EXISTS idx_refunds_date_status
ON refunds(created_at, status)
WHERE status IN ('succeeded', 'completed', 'refunded');

-- Index for disputes by resolved date
CREATE INDEX IF NOT EXISTS idx_disputes_resolved_date
ON disputes(resolved_at)
WHERE resolved_at IS NOT NULL;

-- Index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
ON subscriptions(status, start_date)
WHERE status IN ('active', 'trialing', 'past_due');

-- ========================================================================
-- Helper function for timezone-aware date filtering
-- ========================================================================
CREATE OR REPLACE FUNCTION analytics.get_timezone_boundaries(
    start_date date,
    end_date date,
    timezone text DEFAULT 'America/Sao_Paulo'
)
RETURNS TABLE(start_utc timestamp, end_utc timestamp) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (start_date::timestamp AT TIME ZONE timezone) as start_utc,
        ((end_date + INTERVAL '1 day')::timestamp AT TIME ZONE timezone) as end_utc;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================================================
-- Example usage with proper timezone handling
-- ========================================================================
COMMENT ON SCHEMA analytics IS 'Optimized analytics views for performance';
COMMENT ON FUNCTION analytics.is_successful_payment IS 'Check if payment status is successful';
COMMENT ON FUNCTION analytics.get_timezone_boundaries IS 'Convert date range to UTC boundaries for efficient filtering';

-- Example query using optimized timezone filtering:
-- WITH bounds AS (
--     SELECT * FROM analytics.get_timezone_boundaries('2024-01-01', '2024-01-31')
-- )
-- SELECT 
--     DATE(payment_date AT TIME ZONE 'America/Sao_Paulo') as day,
--     SUM(amount_brl) as revenue
-- FROM analytics.vw_payment_details
-- WHERE payment_date >= (SELECT start_utc FROM bounds)
--   AND payment_date < (SELECT end_utc FROM bounds)
-- GROUP BY 1
-- ORDER BY 1;