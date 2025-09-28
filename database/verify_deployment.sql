-- Verification Script - Run AFTER migrations to confirm success

-- 1. Check all tables exist
SELECT 'Tables Check:' as check_type;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verify bundles data
SELECT 'Bundles Data:' as check_type;
SELECT 
    name,
    price_paise/100 as price_rupees,
    array_length(bullet_points, 1) as features_count,
    is_active
FROM service_bundles 
ORDER BY display_order;

-- 3. Check if La Carte settings exist
SELECT 'La Carte Settings:' as check_type;
SELECT 
    id,
    current_price_paise/100 as current_price_rupees,
    real_price_paise/100 as real_price_rupees,
    is_active
FROM lacarte_settings;

-- 4. Verify table relationships
SELECT 'Table Relationships:' as check_type;
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
    AND tc.table_name LIKE '%bundle%'
ORDER BY tc.table_name;

-- 5. Check indexes
SELECT 'Indexes Check:' as check_type;
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename LIKE '%bundle%' 
    OR tablename = 'lacarte_settings'
    OR tablename = 'request_notes'
ORDER BY tablename, indexname;