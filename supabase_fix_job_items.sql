-- Consolidated migration to ensure job_items table exists and has all required columns and policies.

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.job_items (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES public.jobs(job_id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    description TEXT,
    size TEXT,
    quantity TEXT,
    material TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    position INTEGER DEFAULT 0
);

-- 2. Add 'cost' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_items' AND column_name = 'cost') THEN
        ALTER TABLE public.job_items ADD COLUMN cost NUMERIC DEFAULT 0;
    END IF;
END $$;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON public.job_items(job_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies (Drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.job_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.job_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.job_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.job_items;

-- Allow read access to everyone (or authenticated users)
CREATE POLICY "Enable read access for all users" ON public.job_items FOR SELECT USING (true);

-- Allow insert/update/delete for authenticated users
CREATE POLICY "Enable insert for authenticated users" ON public.job_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.job_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.job_items FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Force schema cache reload (optional but good practice)
NOTIFY pgrst, 'reload config';
