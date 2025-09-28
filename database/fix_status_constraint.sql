-- Fix status constraint to include 'draft'
-- This will allow both 'draft' and 'sent' statuses

-- Check current constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as current_definition
FROM pg_constraint 
WHERE conname LIKE '%status%' 
    AND conrelid = 'requests'::regclass;

-- Drop existing constraint and add new one with 'draft'
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check 
    CHECK (status IN ('draft', 'sent', 'viewed', 'confirmed', 'cancelled'));

-- Update default to 'draft' since that's what you want
ALTER TABLE requests ALTER COLUMN status SET DEFAULT 'draft';

-- Verify the fix
SELECT 
    'FIXED CONSTRAINT:' as info,
    pg_get_constraintdef(oid) as new_definition
FROM pg_constraint 
WHERE conname LIKE '%status%' 
    AND conrelid = 'requests'::regclass;