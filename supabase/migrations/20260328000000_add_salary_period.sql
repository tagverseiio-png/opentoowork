-- Add missing columns to the jobs table for recent features
ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS salary_period TEXT DEFAULT 'Annually';
ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS job_id TEXT;

-- Verify or create index for job_id
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON public.jobs(job_id);

-- Check for the existence of job_views table just in case it was missed
CREATE TABLE IF NOT EXISTS public.job_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reset RLS for job_views for visibility
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert job_views" ON public.job_views;
CREATE POLICY "Anyone can insert job_views" ON job_views FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Employers can view own job views" ON public.job_views;
CREATE POLICY "Employers can view own job views" ON job_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j 
    JOIN employer_profiles ep ON j.employer_id = ep.id 
    WHERE j.id = job_views.job_id AND ep.user_id = auth.uid()
  )
);
