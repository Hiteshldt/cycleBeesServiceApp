-- Rollback Migration: Restore request_notes table
-- Date: 2025-10-19
-- Purpose: Recreate request_notes table if needed

-- Recreate the table structure
CREATE TABLE IF NOT EXISTS request_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    note_text TEXT NOT NULL CHECK (char_length(note_text) <= 1000),
    created_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_request_notes_request_id ON request_notes(request_id);

-- Note: This restores the table structure but not the API endpoints
-- You'll need to restore the API files from git history if needed
