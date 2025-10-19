-- Migration: Add 'pending' status and WhatsApp tracking fields
-- Date: 2025-10-02
-- Purpose: Track WhatsApp delivery status separately from request status

-- Step 1: Add new columns for WhatsApp tracking
ALTER TABLE requests
ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_error TEXT;

-- Step 2: Drop existing status constraint
ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;

-- Step 3: Add new constraint with 'pending' status
ALTER TABLE requests ADD CONSTRAINT requests_status_check
    CHECK (status IN ('pending', 'sent', 'viewed', 'confirmed', 'cancelled'));

-- Step 4: Update default status to 'pending'
ALTER TABLE requests ALTER COLUMN status SET DEFAULT 'pending';

-- Step 5: Create index for pending requests (for admin dashboard filtering)
CREATE INDEX IF NOT EXISTS idx_requests_pending ON requests(status) WHERE status = 'pending';

-- Step 6: Create index for WhatsApp tracking
CREATE INDEX IF NOT EXISTS idx_requests_whatsapp_sent ON requests(whatsapp_sent_at) WHERE whatsapp_sent_at IS NOT NULL;

-- Verification queries (optional - comment out for production)
-- Check column additions
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'requests'
  AND column_name IN ('whatsapp_message_id', 'whatsapp_sent_at', 'whatsapp_error');

-- Check constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'requests_status_check';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'requests'
  AND indexname IN ('idx_requests_pending', 'idx_requests_whatsapp_sent');
