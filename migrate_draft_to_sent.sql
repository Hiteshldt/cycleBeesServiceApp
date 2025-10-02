-- Migration Script: Update all 'draft' status requests to 'sent'
-- This script directly updates the database, bypassing API validation

BEGIN;

-- Update all draft requests to sent
UPDATE requests
SET
  status = 'sent',
  sent_at = CASE
    WHEN sent_at IS NULL THEN created_at
    ELSE sent_at
  END
WHERE status = 'draft';

-- Verify the migration
SELECT
  COUNT(*) as total_migrated,
  'draft' as old_status,
  'sent' as new_status
FROM requests
WHERE status = 'sent'
  AND sent_at IS NOT NULL;

-- Check if any drafts remain
SELECT COUNT(*) as remaining_drafts
FROM requests
WHERE status = 'draft';

COMMIT;

-- Final verification
SELECT
  status,
  COUNT(*) as count
FROM requests
GROUP BY status
ORDER BY status;
