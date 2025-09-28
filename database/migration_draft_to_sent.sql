-- Migration: Change 'draft' status to 'sent'
-- This migration updates existing database records and schema

-- Step 1: Update existing records
UPDATE requests SET status = 'sent' WHERE status = 'draft';

-- Step 2: Update schema constraint
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
ALTER TABLE requests ADD CONSTRAINT requests_status_check 
    CHECK (status IN ('sent', 'viewed', 'confirmed', 'cancelled'));

-- Step 3: Update default value
ALTER TABLE requests ALTER COLUMN status SET DEFAULT 'sent';

-- Verify migration
SELECT status, COUNT(*) FROM requests GROUP BY status;