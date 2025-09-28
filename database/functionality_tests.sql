-- FUNCTIONALITY TESTING SCRIPT
-- Run these queries individually to test each feature

-- ============================================================================
-- TEST 1: BUNDLES BASIC FUNCTIONALITY
-- ============================================================================

-- Test: Can we query bundles like the API would?
SELECT 'TEST 1A: API-style bundles query' as test_name;
SELECT 
    id,
    name,
    description,
    price_paise,
    bullet_points,
    is_active,
    display_order
FROM service_bundles 
WHERE is_active = true
ORDER BY display_order;

-- Test: Individual bundle lookup
SELECT 'TEST 1B: Single bundle lookup' as test_name;
SELECT * FROM service_bundles WHERE name = 'Complete Care Package';

-- ============================================================================
-- TEST 2: BULLET POINTS FUNCTIONALITY
-- ============================================================================

-- Test: Bullet points array operations
SELECT 'TEST 2A: Bullet points expansion' as test_name;
SELECT 
    name,
    unnest(bullet_points) as individual_feature,
    price_paise/100 as price_rupees
FROM service_bundles 
WHERE name = 'Complete Care Package';

-- Test: Bullet points count and validation
SELECT 'TEST 2B: Features count validation' as test_name;
SELECT 
    name,
    array_length(bullet_points, 1) as features_count,
    bullet_points[1] as first_feature,
    bullet_points[array_length(bullet_points, 1)] as last_feature
FROM service_bundles 
ORDER BY display_order;

-- ============================================================================
-- TEST 3: PRICING CALCULATIONS
-- ============================================================================

-- Test: Price formatting for different currencies
SELECT 'TEST 3A: Price formatting test' as test_name;
SELECT 
    name,
    price_paise,
    price_paise/100 as rupees,
    '₹' || (price_paise/100) as formatted_price,
    CASE 
        WHEN price_paise >= 200000 THEN 'Premium (₹2000+)'
        WHEN price_paise >= 100000 THEN 'Standard (₹1000+)'
        ELSE 'Basic (<₹1000)'
    END as price_tier
FROM service_bundles 
ORDER BY price_paise DESC;

-- Test: Bundle selection pricing (multiple bundles)
SELECT 'TEST 3B: Multiple bundle selection test' as test_name;
SELECT 
    'Multi-Bundle Order' as scenario,
    SUM(price_paise) as total_bundles_paise,
    SUM(price_paise)/100 as total_bundles_rupees,
    COUNT(*) as bundles_selected,
    ARRAY_AGG(name) as selected_bundles
FROM service_bundles 
WHERE name IN ('Complete Care Package', 'Quick Refresh Bundle');

-- ============================================================================
-- TEST 4: ORDER INTEGRATION SIMULATION
-- ============================================================================

-- Test: Simulate confirmed order with bundles
-- (This simulates what happens when a customer confirms an order)

-- First, check if we have any existing requests to test with
SELECT 'TEST 4A: Available test requests' as test_name;
SELECT 
    id,
    order_id,
    bike_name,
    customer_name,
    status
FROM requests 
LIMIT 3;

-- Test: Bundle selection simulation (without actually inserting)
SELECT 'TEST 4B: Bundle order simulation' as test_name;
SELECT 
    'SIMULATED ORDER' as order_type,
    sb.name as bundle_name,
    sb.price_paise/100 as bundle_price_rupees,
    'Would be stored in confirmed_order_bundles table' as action
FROM service_bundles sb
WHERE sb.is_active = true
ORDER BY sb.display_order;

-- ============================================================================
-- TEST 5: ADMIN INTERFACE DATA QUERIES
-- ============================================================================

-- Test: Admin bundles management query
SELECT 'TEST 5A: Admin management query' as test_name;
SELECT 
    id,
    name,
    description,
    price_paise/100 as price_rupees,
    array_length(bullet_points, 1) as features_count,
    is_active,
    display_order,
    created_at::date as created_date
FROM service_bundles 
ORDER BY display_order;

-- Test: Bundle edit simulation
SELECT 'TEST 5B: Bundle editability check' as test_name;
SELECT 
    'Bundle Update Simulation' as test_type,
    id,
    name as current_name,
    name || ' (Updated)' as potential_new_name,
    price_paise as current_price,
    price_paise + 5000 as potential_new_price,
    bullet_points as current_features
FROM service_bundles 
WHERE name = 'Quick Refresh Bundle';

-- ============================================================================
-- TEST 6: CUSTOMER EXPERIENCE QUERIES
-- ============================================================================

-- Test: Customer bundle selection page query
SELECT 'TEST 6A: Customer selection page data' as test_name;
SELECT 
    display_order,
    name,
    description,
    price_paise/100 as display_price,
    bullet_points,
    CASE 
        WHEN price_paise < 100000 THEN 'Affordable'
        WHEN price_paise < 200000 THEN 'Premium'
        ELSE 'Comprehensive'
    END as value_category
FROM service_bundles 
WHERE is_active = true
ORDER BY display_order;

-- Test: Bundle comparison for customer
SELECT 'TEST 6B: Bundle comparison data' as test_name;
SELECT 
    name,
    price_paise/100 as price,
    array_length(bullet_points, 1) as features,
    ROUND((price_paise/100.0) / array_length(bullet_points, 1), 2) as price_per_feature,
    CASE 
        WHEN (price_paise/100.0) / array_length(bullet_points, 1) < 200 THEN '💰 Great Value'
        WHEN (price_paise/100.0) / array_length(bullet_points, 1) < 400 THEN '⚖️ Fair Value'
        ELSE '🔴 Premium Pricing'
    END as value_rating
FROM service_bundles 
WHERE is_active = true
ORDER BY (price_paise/100.0) / array_length(bullet_points, 1);

-- ============================================================================
-- TEST 7: SYSTEM INTEGRATION VERIFICATION
-- ============================================================================

-- Test: Check all required tables for full system
SELECT 'TEST 7A: System completeness check' as test_name;
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'service_bundles' THEN 
            CASE 
                WHEN (SELECT COUNT(*) FROM service_bundles) > 0 THEN '✅ Ready with data'
                ELSE '⚠️ Empty table'
            END
        WHEN table_name = 'confirmed_order_bundles' THEN '✅ Ready for orders'
        WHEN table_name = 'requests' THEN 
            CASE 
                WHEN (SELECT COUNT(*) FROM requests) > 0 THEN '✅ Has requests'
                ELSE '📝 No requests yet'
            END
        WHEN table_name = 'addons' THEN 
            CASE 
                WHEN (SELECT COUNT(*) FROM addons) > 0 THEN '✅ Has add-ons'
                ELSE '⚠️ No add-ons'
            END
        ELSE '✅ Available'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('service_bundles', 'confirmed_order_bundles', 'requests', 'addons', 'lacarte_settings')
ORDER BY 
    CASE 
        WHEN table_name LIKE '%bundle%' THEN 1
        ELSE 2
    END;

-- Final system status
SELECT 'FINAL SYSTEM STATUS' as test_name;
SELECT 
    'System Ready: ' || 
    CASE 
        WHEN (SELECT COUNT(*) FROM service_bundles WHERE is_active = true) >= 4 
            AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confirmed_order_bundles')
            AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requests')
        THEN '✅ FULLY OPERATIONAL 🚀'
        ELSE '⚠️ Check configuration'
    END as overall_status,
    (SELECT COUNT(*) FROM service_bundles WHERE is_active = true) as active_bundles,
    'Ready for customers!' as customer_status;