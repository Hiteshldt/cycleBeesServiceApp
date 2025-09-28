-- ===============================================
-- CycleBees Supabase Database Migration Script
-- ===============================================
-- This script updates the existing database to match the complete project requirements
-- Current State: Only 'requests' and 'request_items' tables exist
-- Target State: Complete schema with all tables, functions, triggers, and data

-- ===============================================
-- STEP 1: Enable Required Extensions
-- ===============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- STEP 2: Update Existing Tables Structure
-- ===============================================

-- Check and update 'requests' table structure
-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add short_slug column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'short_slug') THEN
        ALTER TABLE requests ADD COLUMN short_slug VARCHAR(20) UNIQUE;
    END IF;
    
    -- Add order_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'order_id') THEN
        ALTER TABLE requests ADD COLUMN order_id VARCHAR(100) NOT NULL DEFAULT 'TEMP_ORDER_ID';
    END IF;
    
    -- Add bike_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'bike_name') THEN
        ALTER TABLE requests ADD COLUMN bike_name VARCHAR(200) NOT NULL DEFAULT 'Unknown Bike';
    END IF;
    
    -- Add customer_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'customer_name') THEN
        ALTER TABLE requests ADD COLUMN customer_name VARCHAR(200) NOT NULL DEFAULT 'Unknown Customer';
    END IF;
    
    -- Add phone_digits_intl column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'phone_digits_intl') THEN
        ALTER TABLE requests ADD COLUMN phone_digits_intl VARCHAR(20) NOT NULL DEFAULT '919999999999';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'status') THEN
        ALTER TABLE requests ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
    END IF;
    
    -- Add pricing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'subtotal_paise') THEN
        ALTER TABLE requests ADD COLUMN subtotal_paise INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'tax_paise') THEN
        ALTER TABLE requests ADD COLUMN tax_paise INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'total_paise') THEN
        ALTER TABLE requests ADD COLUMN total_paise INTEGER DEFAULT 0;
    END IF;
    
    -- Add sent_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'requests' AND column_name = 'sent_at') THEN
        ALTER TABLE requests ADD COLUMN sent_at TIMESTAMP WITH TIME ZONE NULL;
    END IF;
END $$;

-- Add constraints to 'requests' table if they don't exist
DO $$
BEGIN
    -- Add status constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'requests_status_check') THEN
        ALTER TABLE requests ADD CONSTRAINT requests_status_check 
        CHECK (status IN ('draft', 'viewed', 'confirmed', 'cancelled'));
    END IF;
END $$;

-- Check and update 'request_items' table structure
DO $$
BEGIN
    -- Add section column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'request_items' AND column_name = 'section') THEN
        ALTER TABLE request_items ADD COLUMN section VARCHAR(20) NOT NULL DEFAULT 'repair';
    END IF;
    
    -- Add label column if it doesn't exist (might be named differently)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'request_items' AND column_name = 'label') THEN
        ALTER TABLE request_items ADD COLUMN label VARCHAR(500) NOT NULL DEFAULT 'Service Item';
    END IF;
    
    -- Add price_paise column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'request_items' AND column_name = 'price_paise') THEN
        ALTER TABLE request_items ADD COLUMN price_paise INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add is_suggested column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'request_items' AND column_name = 'is_suggested') THEN
        ALTER TABLE request_items ADD COLUMN is_suggested BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add constraints to 'request_items' table if they don't exist
DO $$
BEGIN
    -- Add section constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'request_items_section_check') THEN
        ALTER TABLE request_items ADD CONSTRAINT request_items_section_check 
        CHECK (section IN ('repair', 'replacement'));
    END IF;
    
    -- Add price constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints 
                   WHERE constraint_name = 'request_items_price_check') THEN
        ALTER TABLE request_items ADD CONSTRAINT request_items_price_check 
        CHECK (price_paise > 0);
    END IF;
END $$;

-- ===============================================
-- STEP 3: Create Missing Tables
-- ===============================================

-- Create admin_credentials table
CREATE TABLE IF NOT EXISTS admin_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addons table
CREATE TABLE IF NOT EXISTS addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table to store confirmed order selections (for service items)
CREATE TABLE IF NOT EXISTS confirmed_order_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    service_item_id UUID REFERENCES request_items(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table to store confirmed order addons
CREATE TABLE IF NOT EXISTS confirmed_order_addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES addons(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- STEP 4: Create Required Functions
-- ===============================================

-- Function to generate short slug
CREATE OR REPLACE FUNCTION generate_short_slug()
RETURNS VARCHAR(20) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(20) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    -- Check if slug already exists, if so generate a new one
    WHILE EXISTS(SELECT 1 FROM requests WHERE short_slug = result) LOOP
        result := '';
        FOR i IN 1..8 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate short_slug
CREATE OR REPLACE FUNCTION set_short_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_slug IS NULL OR NEW.short_slug = '' THEN
        NEW.short_slug := generate_short_slug();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update totals when request_items change
CREATE OR REPLACE FUNCTION update_request_totals()
RETURNS TRIGGER AS $$
DECLARE
    request_total INTEGER;
BEGIN
    -- Calculate total for the request (GST inclusive)
    SELECT 
        COALESCE(SUM(price_paise), 0) as total
    INTO request_total
    FROM request_items 
    WHERE request_id = COALESCE(NEW.request_id, OLD.request_id);
    
    -- Update the request totals (all prices are GST inclusive)
    UPDATE requests 
    SET 
        subtotal_paise = request_total,
        tax_paise = 0,
        total_paise = request_total
    WHERE id = COALESCE(NEW.request_id, OLD.request_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ===============================================
-- STEP 5: Create Triggers
-- ===============================================

-- Drop existing triggers if they exist (to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_set_short_slug ON requests;
DROP TRIGGER IF EXISTS trigger_update_totals_insert ON request_items;
DROP TRIGGER IF EXISTS trigger_update_totals_update ON request_items;
DROP TRIGGER IF EXISTS trigger_update_totals_delete ON request_items;

-- Create triggers
CREATE TRIGGER trigger_set_short_slug
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION set_short_slug();

CREATE TRIGGER trigger_update_totals_insert
    AFTER INSERT ON request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_request_totals();

CREATE TRIGGER trigger_update_totals_update
    AFTER UPDATE ON request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_request_totals();

CREATE TRIGGER trigger_update_totals_delete
    AFTER DELETE ON request_items
    FOR EACH ROW
    EXECUTE FUNCTION update_request_totals();

-- ===============================================
-- STEP 6: Create Indexes for Performance
-- ===============================================

-- Create indexes only if they don't exist
CREATE INDEX IF NOT EXISTS idx_requests_short_slug ON requests(short_slug);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_items_request_id ON request_items(request_id);
CREATE INDEX IF NOT EXISTS idx_addons_active_order ON addons(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_confirmed_services_request_id ON confirmed_order_services(request_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_addons_request_id ON confirmed_order_addons(request_id);

-- ===============================================
-- STEP 7: Update Existing Data
-- ===============================================

-- Generate short slugs for existing requests that don't have them
UPDATE requests 
SET short_slug = generate_short_slug() 
WHERE short_slug IS NULL OR short_slug = '';

-- Update existing requests with proper order_ids if they have temp values
UPDATE requests 
SET order_id = CONCAT('CB', 
    TO_CHAR(created_at, 'YYMMDD'), 
    TO_CHAR(created_at, 'HH24MI'), 
    LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0'))
WHERE order_id = 'TEMP_ORDER_ID' OR order_id IS NULL;

-- Update existing request_items to ensure they have proper sections
UPDATE request_items 
SET section = 'repair' 
WHERE section IS NULL;

-- ===============================================
-- STEP 8: Insert Default Data
-- ===============================================

-- Insert default admin credentials (only if not exists)
INSERT INTO admin_credentials (username, password) 
SELECT 'admin', 'cyclebees123'
WHERE NOT EXISTS (SELECT 1 FROM admin_credentials WHERE username = 'admin');

-- Insert default add-ons (only if table is empty)
INSERT INTO addons (name, description, price_paise, display_order)
SELECT * FROM (VALUES
    ('Premium Bike Wash & Polish', 'Complete exterior & interior deep cleaning with protective wax coating', 20000, 1),
    ('Engine Deep Clean & Detailing', 'Thorough engine bay cleaning, degreasing, and corrosion protection', 30000, 2),
    ('Chain & Sprocket Complete Service', 'Chain cleaning, lubrication, adjustment, and sprocket inspection', 12000, 3),
    ('Brake System Service', 'Brake fluid change, brake pad inspection, and brake line check', 15000, 4),
    ('Complete Fluid Service', 'Engine oil, coolant, brake fluid, and hydraulic fluid top-up/change', 25000, 5),
    ('Tire Care Package', 'Tire pressure check, puncture repair, tread inspection, and balancing', 8000, 6),
    ('Electrical System Check', 'Complete wiring inspection, battery test, and light system check', 10000, 7),
    ('Performance Tuning', 'Carburetor cleaning, air filter service, and engine performance optimization', 35000, 8)
) AS new_addons(name, description, price_paise, display_order)
WHERE NOT EXISTS (SELECT 1 FROM addons LIMIT 1);

-- ===============================================
-- STEP 9: Final Data Validation and Cleanup
-- ===============================================

-- Update totals for all existing requests to ensure consistency
UPDATE requests 
SET 
    subtotal_paise = COALESCE(
        (SELECT SUM(price_paise) FROM request_items WHERE request_id = requests.id), 0
    ),
    tax_paise = 0,
    total_paise = COALESCE(
        (SELECT SUM(price_paise) FROM request_items WHERE request_id = requests.id), 0
    );

-- ===============================================
-- VERIFICATION QUERIES
-- ===============================================
-- Run these queries after the migration to verify everything is working:

-- Check all tables exist
SELECT 
    table_name, 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check admin credentials
SELECT username, is_active FROM admin_credentials;

-- Check addons
SELECT name, price_paise, is_active FROM addons ORDER BY display_order;

-- Check functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('generate_short_slug', 'set_short_slug', 'update_request_totals');

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ===============================================
-- MIGRATION COMPLETED
-- ===============================================
-- Your database should now be fully ready for the CycleBees application!
-- 
-- Summary of changes:
-- ✅ Updated existing 'requests' table with all required columns
-- ✅ Updated existing 'request_items' table with all required columns  
-- ✅ Created 'admin_credentials' table with default admin user
-- ✅ Created 'addons' table with 8 default services
-- ✅ Created 'confirmed_order_services' and 'confirmed_order_addons' tables
-- ✅ Added all required functions and triggers
-- ✅ Created performance indexes
-- ✅ Added default data (admin user and add-on services)
-- ✅ Updated existing data to match new schema requirements