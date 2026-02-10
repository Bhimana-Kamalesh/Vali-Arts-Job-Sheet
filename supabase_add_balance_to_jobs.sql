-- Migration: Add balance column to jobs table
-- User reported "column jobs.balance does not exist"

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.jobs.balance IS 'Remaining balance to be paid by the customer';

-- Optional: If you want to initialize balance for existing records
-- UPDATE public.jobs SET balance = cost - (advance + total) WHERE balance IS NULL;
