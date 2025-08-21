-- 📊 CHECK DATABASE STATE
-- Execute este SQL no Supabase SQL Editor para verificar o estado atual das tabelas

-- 1. Verificar estrutura das tabelas
\dt

-- 2. Contar registros em cada tabela principal
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'payments', COUNT(*) FROM payments
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'product_language_versions', COUNT(*) FROM product_language_versions
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'refunds', COUNT(*) FROM refunds
UNION ALL
SELECT 'disputes', COUNT(*) FROM disputes
UNION ALL
SELECT 'funnels', COUNT(*) FROM funnels
ORDER BY record_count DESC;

-- 3. Verificar amostra de dados de pagamentos (se houver)
SELECT 
    id,
    amount_brl,
    status,
    gateway,
    created_at
FROM payments 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Verificar status únicos dos pagamentos
SELECT 
    status,
    COUNT(*) as count
FROM payments 
GROUP BY status
ORDER BY count DESC;

-- 5. Verificar produtos existentes
SELECT 
    product_code,
    base_name,
    COUNT(plv.id) as versions_count
FROM products p
LEFT JOIN product_language_versions plv ON p.id = plv.product_id
GROUP BY p.id, product_code, base_name
ORDER BY versions_count DESC
LIMIT 10;

-- 6. Verificar se há dados recentes (últimos 30 dias)
SELECT 
    'payments' as table_name,
    COUNT(*) as recent_records
FROM payments 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 'orders', COUNT(*)
FROM orders 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 'subscriptions', COUNT(*)
FROM subscriptions 
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- 7. Verificar timezone da sessão atual
SELECT current_setting('timezone') as current_timezone;

-- 8. Verificar se existem índices importantes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('payments', 'orders', 'order_items', 'subscriptions', 'refunds', 'disputes')
ORDER BY tablename, indexname;