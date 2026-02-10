-- Add urgent priority field to jobs table
ALTER TABLE jobs ADD COLUMN is_urgent BOOLEAN DEFAULT FALSE;

-- Optional: Add index for filtering urgent jobs
CREATE INDEX idx_jobs_urgent ON jobs(is_urgent) WHERE is_urgent = TRUE;
