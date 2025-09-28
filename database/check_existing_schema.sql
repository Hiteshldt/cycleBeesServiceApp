-- Database Schema Check Script
-- Run this FIRST in Supabase to see what already exists

-- Check what tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if bundles tables exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'service_bundles'
) as service_bundles_exists;

SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'confirmed_order_bundles'
) as confirmed_order_bundles_exists;

-- Check if lacarte settings exist
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lacarte_settings'
) as lacarte_settings_exists;

-- Check if notes table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'request_notes'
) as request_notes_exists;