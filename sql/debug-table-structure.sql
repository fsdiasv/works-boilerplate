-- 🔍 DEBUG TABLE STRUCTURE
-- Execute este SQL no Supabase SQL Editor para verificar a estrutura das tabelas

-- 1. Verificar estrutura da tabela users
SELECT 
    'users' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela payments
SELECT 
    'payments' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela orders
SELECT 
    'orders' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela order_items
SELECT 
    'order_items' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Verificar estrutura da tabela products
SELECT 
    'products' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar estrutura da tabela product_language_versions
SELECT 
    'product_language_versions' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'product_language_versions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar estrutura da tabela subscriptions
SELECT 
    'subscriptions' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Verificar estrutura da tabela refunds
SELECT 
    'refunds' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'refunds' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Verificar estrutura da tabela disputes
SELECT 
    'disputes' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'disputes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Listar todas as tabelas no schema public
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 11. Verificar se existem foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 12. Verificar mapeamento Prisma vs PostgreSQL
-- Baseado no schema Prisma, estas colunas deveriam existir:
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'locale') 
        THEN '✅ users.locale exists'
        ELSE '❌ users.locale missing'
    END as locale_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'timezone') 
        THEN '✅ users.timezone exists'
        ELSE '❌ users.timezone missing'
    END as timezone_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'amount_brl') 
        THEN '✅ payments.amount_brl exists'
        ELSE '❌ payments.amount_brl missing'
    END as amount_brl_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'systeme_order_id') 
        THEN '✅ orders.systeme_order_id exists'
        ELSE '❌ orders.systeme_order_id missing'
    END as systeme_order_check;