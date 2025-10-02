-- Migration: Change 'draft' status to 'sent'
-- This migration updates existing database records and schema

-- Step 1: Drop the existing constraint FIRST
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Step 2: Update existing records (now that constraint is removed)
UPDATE requests
SET
  status = 'sent',
  sent_at = COALESCE(sent_at, created_at)
WHERE status = 'draft';

-- Step 3: Re-add the constraint (with the correct allowed values)
ALTER TABLE requests ADD CONSTRAINT requests_status_check
    CHECK (status IN ('sent', 'viewed', 'confirmed', 'cancelled'));

-- Step 4: Update default value
ALTER TABLE requests ALTER COLUMN status SET DEFAULT 'sent';

-- Verify migration
SELECT status, COUNT(*) as count FROM requests GROUP BY status ORDER BY status;