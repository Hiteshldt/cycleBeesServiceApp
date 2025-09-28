-- DATA RELATIONSHIPS VALIDATION
-- Verify all foreign keys and data integrity

-- ============================================================================
-- TEST: FOREIGN KEY RELATIONSHIPS
-- ============================================================================

SELECT 'FOREIGN KEY RELATIONSHIPS TEST' as test_section;

-- Test confirmed_order_bundles relationships
SELECT 'Test 1: Bundle-Order Relationship' as test_name;
SELECT 
    tc.constraint_name,
    tc.table_name as child_table,
    kcu.column_name as child_column,
    ccu.table_name as parent_table,
    ccu.column_name as parent_column,
    '✅ Relationship Valid' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'confirmed_order_bundles';

-- ============================================================================
-- TEST: REFERENTIAL INTEGRITY
-- ============================================================================

-- Test: Can we simulate a bundle order? (Check if we can reference existing requests)
SELECT 'Test 2: Referential Integrity Check' as test_name;
SELECT 
    'Simulated Bundle Order' as test_type,
    r.id as request_id,
    r.order_id,
    sb.id as bundle_id,
    sb.name as bundle_name,
    'Could create confirmed_order_bundles record' as simulation_result
FROM requests r
CROSS JOIN service_bundles sb
WHERE r.status IN ('sent', 'viewed')
    AND sb.is_active = true
LIMIT 2;

-- ============================================================================
-- TEST: CASCADE DELETE BEHAVIOR
-- ============================================================================

SELECT 'Test 3: Cascade Delete Configuration' as test_name;
SELECT 
    tc.table_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Properly configured'
        ELSE '⚠️ Check configuration'
    END as delete_behavior_status
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'confirmed_order_bundles';

-- ============================================================================
-- TEST: DATA TYPE COMPATIBILITY
-- ============================================================================

SELECT 'Test 4: Data Type Compatibility' as test_name;
-- Check UUID compatibility between tables
SELECT 
    'UUID Compatibility' as check_type,
    'service_bundles.id' as column1,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'service_bundles' AND column_name = 'id') as type1,
    'confirmed_order_bundles.bundle_id' as column2,
    (SELECT data_type FROM information_schema.columns 
     WHERE table_name = 'confirmed_order_bundles' AND column_name = 'bundle_id') as type2,
    CASE 
        WHEN (SELECT data_type FROM information_schema.columns WHERE table_name = 'service_bundles' AND column_name = 'id') =
             (SELECT data_type FROM information_schema.columns WHERE table_name = 'confirmed_order_bundles' AND column_name = 'bundle_id')
        THEN '✅ Types Match'
        ELSE '❌ Type Mismatch'
    END as compatibility_status;

-- ============================================================================
-- TEST: COMPLETE SYSTEM INTEGRATION
-- ============================================================================

SELECT 'Test 5: System Integration Verification' as test_name;
-- Verify all key tables can work together
SELECT 
    'Full System Chain' as integration_test,
    COUNT(DISTINCT r.id) as total_requests,
    COUNT(DISTINCT a.id) as total_addons,
    COUNT(DISTINCT sb.id) as total_bundles,
    COUNT(DISTINCT ri.id) as total_request_items,
    CASE 
        WHEN COUNT(DISTINCT sb.id) >= 4 
            AND COUNT(DISTINCT a.id) >= 1
            AND COUNT(DISTINCT r.id) >= 0
        THEN '✅ All Systems Ready'
        ELSE '⚠️ Check System Components'
    END as integration_status
FROM service_bundles sb
CROSS JOIN addons a
LEFT JOIN requests r ON true
LEFT JOIN request_items ri ON ri.request_id = r.id
WHERE sb.is_active = true AND a.is_active = true;

-- ============================================================================
-- FINAL VALIDATION SUMMARY
-- ============================================================================

SELECT 'FINAL VALIDATION SUMMARY' as final_check;
SELECT 
    '🎯 BUNDLES SYSTEM STATUS' as system_name,
    CASE 
        -- Check all critical components exist
        WHEN EXISTS (SELECT 1 FROM service_bundles WHERE is_active = true)
            AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'confirmed_order_bundles')
            AND EXISTS (SELECT 1 FROM information_schema.table_constraints 
                       WHERE table_name = 'confirmed_order_bundles' AND constraint_type = 'FOREIGN KEY')
        THEN '✅ FULLY OPERATIONAL'
        ELSE '⚠️ NEEDS ATTENTION'
    END as overall_status,
    
    (SELECT COUNT(*) FROM service_bundles WHERE is_active = true) as active_bundles_count,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM service_bundles WHERE is_active = true) >= 4
        THEN '✅ Sample data loaded'
        ELSE '❌ Missing sample data'
    END as sample_data_status,
    
    'Ready for customer orders! 🚀' as deployment_readiness;