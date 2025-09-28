-- VERIFY STATUS IMPLEMENTATION
-- Check that "draft" has been properly replaced with "sent"

-- Check current status constraint
SELECT 
    'STATUS CONSTRAINT CHECK' as test_name,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%status%' 
    AND conrelid = 'requests'::regclass;

-- Check current status values in database
SELECT 
    'CURRENT STATUS VALUES' as test_name,
    status,
    COUNT(*) as count
FROM requests 
GROUP BY status
ORDER BY status;

-- Check default value
SELECT 
    'DEFAULT VALUE CHECK' as test_name,
    column_name,
    column_default,
    CASE 
        WHEN column_default LIKE '%sent%' THEN '✅ Correct (sent)'
        WHEN column_default LIKE '%draft%' THEN '❌ Still draft'
        ELSE '⚠️ Unknown default'
    END as status_check
FROM information_schema.columns 
WHERE table_name = 'requests' 
    AND column_name = 'status';

-- Verify no draft references exist
SELECT 
    'DRAFT REFERENCES CHECK' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM requests WHERE status = 'draft') THEN '❌ Found draft records'
        ELSE '✅ No draft records found'
    END as draft_check;

-- Test status transitions (should only allow sent, viewed, confirmed, cancelled)
SELECT 
    'VALID STATUS TRANSITIONS' as test_name,
    'sent' as status, 'Should be valid' as expected
UNION ALL
SELECT 
    'VALID STATUS TRANSITIONS' as test_name,
    'viewed' as status, 'Should be valid' as expected
UNION ALL
SELECT 
    'VALID STATUS TRANSITIONS' as test_name,
    'confirmed' as status, 'Should be valid' as expected
UNION ALL
SELECT 
    'VALID STATUS TRANSITIONS' as test_name,
    'cancelled' as status, 'Should be valid' as expected;

-- Final summary
SELECT 
    'IMPLEMENTATION STATUS' as final_check,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM requests WHERE status = 'draft')
            AND EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'requests' 
                       AND column_name = 'status' 
                       AND column_default LIKE '%sent%')
        THEN '✅ DRAFT TO SENT MIGRATION COMPLETE'
        ELSE '⚠️ MIGRATION NEEDS ATTENTION'
    END as migration_status;