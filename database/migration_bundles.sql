-- Migration: Add service bundles system
-- This adds bundles that contain multiple services/features with bullet points

-- Create service_bundles table
CREATE TABLE service_bundles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    bullet_points TEXT[], -- Array of bullet point strings
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create confirmed_order_bundles table to track selected bundles in orders
CREATE TABLE confirmed_order_bundles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    bundle_id UUID REFERENCES service_bundles(id) ON DELETE CASCADE,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_service_bundles_active_order ON service_bundles(is_active, display_order);
CREATE INDEX idx_confirmed_bundles_request_id ON confirmed_order_bundles(request_id);

-- Insert default service bundles
INSERT INTO service_bundles (name, description, price_paise, bullet_points, display_order) VALUES
('Complete Care Package', 'Comprehensive bike maintenance and care', 250000, 
 ARRAY[
   'Full bike inspection and diagnostics',
   'Complete cleaning and detailing',
   'Chain lubrication and adjustment',
   'Brake system check and adjustment',
   'Tire pressure and alignment check',
   '30-day service warranty'
 ], 1),

('Performance Boost Bundle', 'Enhance your bike''s performance and efficiency', 180000,
 ARRAY[
   'Engine tuning and optimization',
   'Air filter cleaning/replacement',
   'Carburetor cleaning and adjustment',
   'Spark plug inspection and replacement',
   'Performance testing and calibration'
 ], 2),

('Safety First Package', 'Essential safety checks and maintenance', 120000,
 ARRAY[
   'Complete brake system service',
   'Light system inspection and repair',
   'Horn and electrical safety check',
   'Steering and suspension check',
   'Emergency breakdown assistance (1 month)'
 ], 3),

('Quick Refresh Bundle', 'Basic maintenance to keep your bike running smooth', 80000,
 ARRAY[
   'Oil change and filter replacement',
   'Chain cleaning and lubrication',
   'Basic visual inspection',
   'Tire pressure check',
   '7-day service guarantee'
 ], 4);

-- Verify migration
SELECT id, name, price_paise, array_length(bullet_points, 1) as bullet_count 
FROM service_bundles 
ORDER BY display_order;