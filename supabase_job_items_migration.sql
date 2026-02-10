-- Migration: Add job_items table for multiple items per job sheet
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS job_items (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES jobs(job_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  description TEXT,
  size TEXT,
  quantity TEXT,
  material TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position INTEGER DEFAULT 0
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON job_items(job_id);

-- Add comment for documentation
COMMENT ON TABLE job_items IS 'Stores multiple items per job sheet (Flex Banner, DTP, Vinyl, etc.)';
