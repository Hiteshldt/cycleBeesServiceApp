-- Migration: Add La Carte settings table
-- This adds dynamic pricing for La Carte service package

-- Create La Carte settings table
CREATE TABLE lacarte_settings (
    id VARCHAR(20) DEFAULT 'lacarte' PRIMARY KEY,
    real_price_paise INTEGER NOT NULL DEFAULT 9900,
    current_price_paise INTEGER NOT NULL DEFAULT 9900,
    discount_note VARCHAR(200) DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO lacarte_settings (id, real_price_paise, current_price_paise, discount_note, is_active) 
VALUES ('lacarte', 9900, 9900, '', true);

-- Create index
CREATE INDEX idx_lacarte_settings_active ON lacarte_settings(is_active);

-- Verify migration
SELECT * FROM lacarte_settings;