-- ROLLBACK SCRIPT: Remove 'pending' status and WhatsApp tracking fields
-- Use this to restore production database to previous state
-- Date: 2025-10-02

-- Step 1: Drop new indexes
DROP INDEX IF EXISTS idx_requests_pending;
DROP INDEX IF EXISTS idx_requests_whatsapp_sent;

-- Step 2: Restore default status to 'sent'
ALTER TABLE requests ALTER COLUMN status SET DEFAULT 'sent';

-- Step 3: Drop new constraint
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Step 4: Re-add old constraint (without 'pending')
ALTER TABLE requests ADD CONSTRAINT requests_status_check
    CHECK (status IN ('sent', 'viewed', 'confirmed', 'cancelled'));

-- Step 5: Remove new columns
ALTER TABLE requests
DROP COLUMN IF EXISTS whatsapp_message_id,
DROP COLUMN IF EXISTS whatsapp_sent_at,
DROP COLUMN IF EXISTS whatsapp_error;

-- Verification: Check old schema restored
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'requests'
ORDER BY ordinal_position;

-- Should NOT see whatsapp_message_id, whatsapp_sent_at, whatsapp_error
-- Default for status should be 'sent'
