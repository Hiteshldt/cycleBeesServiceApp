-- Migration: Remove request_notes table
-- Date: 2025-10-19
-- Purpose: Drop unused request_notes table (no UI, no data, orphaned feature)
-- Analysis: scripts/analyze-request-notes.ts confirmed table is empty and unused

-- Step 1: Drop the table
-- This will cascade to any foreign keys if they exist
DROP TABLE IF EXISTS request_notes CASCADE;

-- Step 2: Verification
-- Check that table no longer exists
-- Run this separately to verify:
-- SELECT tablename FROM pg_tables WHERE tablename = 'request_notes';
-- Expected result: 0 rows (table does not exist)

-- NOTES:
-- - Table was empty (0 rows)
-- - No UI components used it
-- - API endpoints have been removed from codebase
-- - This is a clean removal with no data loss
