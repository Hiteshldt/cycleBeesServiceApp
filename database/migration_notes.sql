-- Migration: Add request notes functionality
-- This adds a notes system for requests

-- Create request_notes table
CREATE TABLE request_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL,
    created_by VARCHAR(50) DEFAULT 'admin', -- who created the note
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_request_notes_request_id ON request_notes(request_id);
CREATE INDEX idx_request_notes_created_at ON request_notes(created_at DESC);

-- Verify migration
SELECT COUNT(*) as notes_count FROM request_notes;