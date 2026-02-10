-- Migration: Add cost column to job_items table
-- Execute this in Supabase SQL Editor

ALTER TABLE job_items 
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;

COMMENT ON COLUMN job_items.cost IS 'Cost of this specific item';
