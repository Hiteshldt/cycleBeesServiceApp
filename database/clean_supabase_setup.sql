-- ===============================================
-- CycleBees Clean Database Setup Script
-- ===============================================
-- This script completely rebuilds the database from scratch
-- WARNING: This will DELETE ALL EXISTING DATA
-- Use this for a fresh start with the complete schema

-- ===============================================
-- STEP 1: Drop Everything (Clean Slate)
-- ===============================================

-- Drop all triggers first (to avoid dependency issues)
DROP TRIGGER IF EXISTS trigger_set_short_slug ON requests;
DROP TRIGGER IF EXISTS trigger_update_totals_insert ON request_items;
DROP TRIGGER IF EXISTS trigger_update_totals_update ON request_items;
DROP TRIGGER IF EXISTS trigger_update_totals_delete ON request_items;

-- Drop all functions
DROP FUNCTION IF EXISTS generate_short_slug();
DROP FUNCTION IF EXISTS set_short_slug();
DROP FUNCTION IF EXISTS update_request_totals();

-- Drop all tables (in order to handle foreign key dependencies)
DROP TABLE IF EXISTS confirmed_order_addons;
DROP TABLE IF EXISTS confirmed_order_services;
DROP TABLE IF EXISTS request_items;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS addons;
DROP TABLE IF EXISTS admin_credentials;

-- ===============================================
-- STEP 2: Enable Required Extensions
-- ===============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================
-- STEP 3: Create All Tables From Scratch
-- ===============================================

-- Create requests table
CREATE TABLE requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    short_slug VARCHAR(20) UNIQUE NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    bike_name VARCHAR(200) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    phone_digits_intl VARCHAR(20) NOT NULL, -- No "+" prefix, international format
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'viewed', 'confirmed', 'cancelled')),
    subtotal_paise INTEGER DEFAULT 0,
    tax_paise INTEGER DEFAULT 0,
    total_paise INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create request_items table
CREATE TABLE request_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    section VARCHAR(20) NOT NULL CHECK (section IN ('repair', 'replacement')),
    label VARCHAR(500) NOT NULL,
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    is_suggested BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_credentials table for simple authentication
CREATE TABLE admin_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create addons table for fixed add-on services
CREATE TABLE addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table to store confirmed order selections (for service items)
CREATE TABLE confirmed_order_services (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    service_item_id UUID REFERENCES request_items(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table to store confirmed order addons
CREATE TABLE confirmed_order_addons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    addon_id UUID REFERENCES addons(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- STEP 4: Create All Functions
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
-- STEP 5: Create All Triggers
-- ===============================================

-- Trigger to auto-generate short_slug for new requests
CREATE TRIGGER trigger_set_short_slug
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION set_short_slug();

-- Triggers to auto-update totals when request_items change
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
-- STEP 6: Create All Indexes for Performance
-- ===============================================

-- Main table indexes
CREATE INDEX idx_requests_short_slug ON requests(short_slug);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_request_items_request_id ON request_items(request_id);
CREATE INDEX idx_addons_active_order ON addons(is_active, display_order);

-- Confirmed order indexes
CREATE INDEX idx_confirmed_services_request_id ON confirmed_order_services(request_id);
CREATE INDEX idx_confirmed_addons_request_id ON confirmed_order_addons(request_id);

-- ===============================================
-- STEP 7: Insert All Default Data
-- ===============================================

-- Insert default admin credentials (username: admin, password: cyclebees123)
INSERT INTO admin_credentials (username, password) VALUES 
('admin', 'cyclebees123');

-- Insert default add-ons (8 premium services)
INSERT INTO addons (name, description, price_paise, display_order) VALUES
('Premium Bike Wash & Polish', 'Complete exterior & interior deep cleaning with protective wax coating', 20000, 1),
('Engine Deep Clean & Detailing', 'Thorough engine bay cleaning, degreasing, and corrosion protection', 30000, 2),
('Chain & Sprocket Complete Service', 'Chain cleaning, lubrication, adjustment, and sprocket inspection', 12000, 3),
('Brake System Service', 'Brake fluid change, brake pad inspection, and brake line check', 15000, 4),
('Complete Fluid Service', 'Engine oil, coolant, brake fluid, and hydraulic fluid top-up/change', 25000, 5),
('Tire Care Package', 'Tire pressure check, puncture repair, tread inspection, and balancing', 8000, 6),
('Electrical System Check', 'Complete wiring inspection, battery test, and light system check', 10000, 7),
('Performance Tuning', 'Carburetor cleaning, air filter service, and engine performance optimization', 35000, 8);

-- ===============================================
-- VERIFICATION QUERIES (Run these after setup)
-- ===============================================

-- Check all tables were created
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns
FROM information_schema.tables t 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check admin credentials
SELECT username, is_active, created_at FROM admin_credentials;

-- Check addons
SELECT name, price_paise, is_active, display_order FROM addons ORDER BY display_order;

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

-- Check indexes exist
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ===============================================
-- SETUP COMPLETED ✅
-- ===============================================
-- 
-- Your database is now completely ready for CycleBees!
--
-- What was created:
-- ✅ 6 tables (requests, request_items, addons, admin_credentials, confirmed_order_services, confirmed_order_addons)
-- ✅ 3 functions (generate_short_slug, set_short_slug, update_request_totals)  
-- ✅ 4 triggers (auto-slug generation + total calculations)
-- ✅ 7 performance indexes
-- ✅ 1 admin user (admin/cyclebees123)
-- ✅ 8 default add-on services
--
-- Test your setup:
-- 1. Admin login: username=admin, password=cyclebees123
-- 2. API test: /api/addons should return 8 services
-- 3. App test: npm run dev should work without database errors
--
-- 🚀 Your CycleBees application is ready to use!