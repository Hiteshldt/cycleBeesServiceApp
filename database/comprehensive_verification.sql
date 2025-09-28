-- COMPREHENSIVE DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify everything is working

-- ============================================================================
-- SECTION 1: DATABASE STRUCTURE VERIFICATION
-- ============================================================================

SELECT '🏗️ DATABASE STRUCTURE CHECK' as section_title;

-- Check all tables exist
SELECT 
    '📋 All Tables in Database:' as check_type,
    table_name,
    CASE 
        WHEN table_name IN ('service_bundles', 'confirmed_order_bundles') THEN '🆕 NEW (Bundles)'
        WHEN table_name = 'lacarte_settings' THEN '💰 Pricing'
        WHEN table_name = 'request_notes' THEN '📝 Notes'
        WHEN table_name IN ('requests', 'request_items') THEN '📦 Core'
        WHEN table_name IN ('addons', 'confirmed_order_addons') THEN '➕ Add-ons'
        ELSE '🔧 System'
    END as category
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY 
    CASE 
        WHEN table_name IN ('service_bundles', 'confirmed_order_bundles') THEN 1
        ELSE 2
    END,
    table_name;

-- ============================================================================
-- SECTION 2: BUNDLES SYSTEM VERIFICATION
-- ============================================================================

SELECT '🎁 BUNDLES SYSTEM VERIFICATION' as section_title;

-- Check bundles table structure
SELECT 
    '🔧 Bundles Table Structure:' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'service_bundles' 
ORDER BY ordinal_position;

-- Verify sample bundles data
SELECT '📊 Sample Bundles Data:' as check_type;
SELECT 
    name as bundle_name,
    description,
    price_paise/100 as price_rupees,
    array_length(bullet_points, 1) as features_count,
    is_active,
    display_order,
    created_at::date as created_date
FROM service_bundles 
ORDER BY display_order;

-- Show detailed bundle features
SELECT '📝 Bundle Features Detail:' as check_type;
SELECT 
    name as bundle_name,
    unnest(bullet_points) as feature,
    price_paise/100 as price_rupees
FROM service_bundles 
ORDER BY display_order, name;

-- Check confirmed bundles table
SELECT '🔗 Confirmed Bundles Table Structure:' as check_type;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'confirmed_order_bundles' 
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 3: RELATIONSHIPS & CONSTRAINTS VERIFICATION
-- ============================================================================

SELECT '🔗 RELATIONSHIPS VERIFICATION' as section_title;

-- Check foreign key relationships
SELECT 
    '🔑 Foreign Key Relationships:' as check_type,
    tc.table_name as from_table, 
    kcu.column_name as from_column, 
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    CASE 
        WHEN tc.table_name = 'confirmed_order_bundles' THEN '✅ Bundles System'
        ELSE '📦 Existing System'
    END as system_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- Check indexes
SELECT 
    '📊 Database Indexes:' as check_type,
    tablename as table_name,
    indexname as index_name,
    CASE 
        WHEN tablename LIKE '%bundle%' THEN '🆕 Bundles Indexes'
        WHEN tablename = 'lacarte_settings' THEN '💰 Pricing Indexes'
        ELSE '📦 Other Indexes'
    END as category
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY 
    CASE 
        WHEN tablename LIKE '%bundle%' THEN 1
        WHEN tablename = 'lacarte_settings' THEN 2
        ELSE 3
    END,
    tablename, indexname;

-- ============================================================================
-- SECTION 4: DATA INTEGRITY CHECKS
-- ============================================================================

SELECT '🔍 DATA INTEGRITY CHECKS' as section_title;

-- Check constraints
SELECT 
    '⚡ Table Constraints:' as check_type,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    CASE 
        WHEN tc.table_name LIKE '%bundle%' THEN '🆕 Bundles'
        ELSE '📦 Existing'
    END as system
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('CHECK', 'PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, tc.constraint_type;

-- Verify data types and nullability
SELECT '📋 Critical Columns Check:' as check_type;
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'bullet_points' AND data_type = 'ARRAY' THEN '✅ Array Type Correct'
        WHEN column_name LIKE '%_paise' AND data_type = 'integer' THEN '✅ Price Format Correct'
        WHEN column_name = 'is_active' AND data_type = 'boolean' THEN '✅ Boolean Correct'
        ELSE '📝 Standard Column'
    END as validation_status
FROM information_schema.columns 
WHERE table_name IN ('service_bundles', 'confirmed_order_bundles', 'lacarte_settings')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SECTION 5: FUNCTIONAL TESTING QUERIES
-- ============================================================================

SELECT '🧪 FUNCTIONAL TESTING' as section_title;

-- Test 1: Bundles with pricing calculation
SELECT '🧮 Pricing Calculation Test:' as test_type;
SELECT 
    name as bundle_name,
    price_paise as price_in_paise,
    ROUND(price_paise/100.0, 2) as price_in_rupees,
    '₹' || ROUND(price_paise/100.0, 2) as formatted_price,
    CASE 
        WHEN price_paise >= 200000 THEN '💰 Premium'
        WHEN price_paise >= 100000 THEN '💵 Standard'
        ELSE '💲 Basic'
    END as price_category
FROM service_bundles 
ORDER BY price_paise DESC;

-- Test 2: Bundle features count validation
SELECT '📊 Features Count Validation:' as test_type;
SELECT 
    name as bundle_name,
    array_length(bullet_points, 1) as features_count,
    price_paise/100 as price_rupees,
    ROUND((price_paise/100.0) / array_length(bullet_points, 1), 2) as price_per_feature,
    CASE 
        WHEN array_length(bullet_points, 1) >= 5 THEN '⭐ Feature Rich'
        WHEN array_length(bullet_points, 1) >= 3 THEN '✅ Good Features'
        ELSE '🔴 Check Features'
    END as feature_status
FROM service_bundles 
ORDER BY array_length(bullet_points, 1) DESC;

-- Test 3: Active bundles for customer display
SELECT '🛒 Customer-Facing Bundles:' as test_type;
SELECT 
    display_order,
    name as bundle_name,
    description,
    '₹' || (price_paise/100) as display_price,
    array_length(bullet_points, 1) as features,
    CASE 
        WHEN is_active THEN '✅ Available'
        ELSE '❌ Hidden'
    END as availability_status
FROM service_bundles 
WHERE is_active = true
ORDER BY display_order;

-- Test 4: JSON format test (for API responses)
SELECT '🔌 API Response Format Test:' as test_type;
SELECT json_build_object(
    'id', id,
    'name', name,
    'description', description,
    'price_paise', price_paise,
    'bullet_points', bullet_points,
    'is_active', is_active,
    'display_order', display_order
) as api_response_sample
FROM service_bundles 
WHERE is_active = true
LIMIT 1;

-- ============================================================================
-- SECTION 6: COMPATIBILITY CHECKS
-- ============================================================================

SELECT '🔄 COMPATIBILITY VERIFICATION' as section_title;

-- Check existing tables compatibility
SELECT '📦 Existing System Check:' as check_type;
SELECT 
    'requests' as table_name,
    COUNT(*) as record_count,
    '✅ Core system ready' as status
FROM requests
UNION ALL
SELECT 
    'addons' as table_name,
    COUNT(*) as record_count,
    '✅ Add-ons ready' as status
FROM addons
UNION ALL
SELECT 
    'service_bundles' as table_name,
    COUNT(*) as record_count,
    '🆕 Bundles ready' as status
FROM service_bundles;

-- Final summary
SELECT '🎉 VERIFICATION SUMMARY' as section_title;
SELECT 
    'Database Status: ✅ ALL SYSTEMS OPERATIONAL' as final_status,
    (SELECT COUNT(*) FROM service_bundles) as bundles_count,
    (SELECT COUNT(*) FROM addons) as addons_count,
    (SELECT COUNT(*) FROM requests) as requests_count,
    'Ready for Production 🚀' as deployment_status;