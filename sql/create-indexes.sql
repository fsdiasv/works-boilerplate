-- ⚡ CREATE PERFORMANCE INDEXES
-- Execute este SQL no Supabase SQL Editor para criar índices de performance

-- 1. Índices para tabela de pagamentos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status_created_at 
ON payments(status, created_at) 
WHERE status IN ('succeeded', 'paid', 'captured', 'completed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_gateway_created_at 
ON payments(gateway, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_amount_brl 
ON payments(amount_brl) 
WHERE amount_brl IS NOT NULL AND status IN ('succeeded', 'paid', 'captured', 'completed');

-- 2. Índices para tabela de reembolsos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_created_at_amount 
ON refunds(created_at, amount_brl);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_payment_id 
ON refunds(payment_id);

-- 3. Índices para tabela de disputas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_opened_resolved 
ON disputes(opened_at, resolved_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_status_amount 
ON disputes(status, amount_brl);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_net_loss 
ON disputes(net_loss_brl) 
WHERE net_loss_brl IS NOT NULL;

-- 4. Índices para tabela de assinaturas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_status_dates 
ON subscriptions(status, start_date, canceled_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_start_date 
ON subscriptions(start_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_canceled_at 
ON subscriptions(canceled_at) 
WHERE canceled_at IS NOT NULL;

-- 5. Índices para tabela de pedidos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at_user 
ON orders(created_at, user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_systeme_funnel 
ON orders(systeme_funnel_id) 
WHERE systeme_funnel_id IS NOT NULL;

-- 6. Índices para tabela de itens de pedido
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_product 
ON order_items(order_id, product_version_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_user_created 
ON order_items(user_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_version 
ON order_items(product_version_id);

-- 7. Índices para tabela de produtos
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_code 
ON products(product_code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_versions_code_lang 
ON product_language_versions(product_code, language_code);

-- 8. Índices compostos para queries de analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_analytics 
ON payments(created_at, status, gateway, amount_brl) 
WHERE status IN ('succeeded', 'paid', 'captured', 'completed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_analytics 
ON orders(created_at, user_id, systeme_funnel_id);

-- 9. Índices para timezone queries (América/São Paulo) - sintaxe corrigida
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at_tz_brt 
ON payments((timezone('America/Sao_Paulo', created_at)::date), status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_refunds_created_at_tz_brt 
ON refunds((timezone('America/Sao_Paulo', created_at)::date));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_disputes_opened_at_tz_brt 
ON disputes((timezone('America/Sao_Paulo', opened_at)::date));

-- 10. Verificar tamanho dos índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('payments', 'orders', 'order_items', 'subscriptions', 'refunds', 'disputes')
ORDER BY pg_relation_size(indexrelid) DESC;

-- 11. Verificar performance dos índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('payments', 'orders', 'order_items', 'subscriptions', 'refunds', 'disputes')
ORDER BY idx_scan DESC;

-- Comentários nos índices principais
COMMENT ON INDEX idx_payments_status_created_at IS 'Índice principal para consultas de pagamentos por período e status';
COMMENT ON INDEX idx_subscriptions_status_dates IS 'Índice para consultas de assinaturas ativas/canceladas';
COMMENT ON INDEX idx_disputes_opened_resolved IS 'Índice para consultas de disputas por período';
COMMENT ON INDEX idx_refunds_created_at_amount IS 'Índice para consultas de reembolsos por período';