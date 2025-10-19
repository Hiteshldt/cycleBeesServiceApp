-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create requests table
CREATE TABLE requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    short_slug VARCHAR(20) UNIQUE NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    bike_name VARCHAR(200) NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    phone_digits_intl VARCHAR(20) NOT NULL, -- No "+" prefix, international format
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'confirmed', 'cancelled')),
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

-- Insert default admin credentials (username: admin, password: cyclebees123)
INSERT INTO admin_credentials (username, password) VALUES 
('admin', 'cyclebees123');

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

-- Create indexes for confirmed order items
CREATE INDEX idx_confirmed_services_request_id ON confirmed_order_services(request_id);
CREATE INDEX idx_confirmed_addons_request_id ON confirmed_order_addons(request_id);

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

-- Insert default add-ons
INSERT INTO addons (name, description, price_paise, display_order) VALUES
('Premium Bike Wash & Polish', 'Complete exterior & interior deep cleaning with protective wax coating', 20000, 1),
('Engine Deep Clean & Detailing', 'Thorough engine bay cleaning, degreasing, and corrosion protection', 30000, 2),
('Chain & Sprocket Complete Service', 'Chain cleaning, lubrication, adjustment, and sprocket inspection', 12000, 3),
('Brake System Service', 'Brake fluid change, brake pad inspection, and brake line check', 15000, 4),
('Complete Fluid Service', 'Engine oil, coolant, brake fluid, and hydraulic fluid top-up/change', 25000, 5),
('Tire Care Package', 'Tire pressure check, puncture repair, tread inspection, and balancing', 8000, 6),
('Electrical System Check', 'Complete wiring inspection, battery test, and light system check', 10000, 7),
('Performance Tuning', 'Carburetor cleaning, air filter service, and engine performance optimization', 35000, 8);

-- Note: Payments table removed - estimates only, no payment processing

-- Create indexes for better performance
CREATE INDEX idx_requests_short_slug ON requests(short_slug);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX idx_request_items_request_id ON request_items(request_id);
CREATE INDEX idx_addons_active_order ON addons(is_active, display_order);

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

-- Trigger to auto-generate short_slug if not provided
CREATE OR REPLACE FUNCTION set_short_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_slug IS NULL OR NEW.short_slug = '' THEN
        NEW.short_slug := generate_short_slug();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_short_slug
    BEFORE INSERT ON requests
    FOR EACH ROW
    EXECUTE FUNCTION set_short_slug();

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

-- Triggers to auto-update totals
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