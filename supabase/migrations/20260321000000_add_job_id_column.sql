-- Add job_id (custom string) column to jobs table
ALTER TABLE IF EXISTS public.jobs ADD COLUMN IF NOT EXISTS job_id TEXT;

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON public.jobs(job_id);

-- Ensure updated_at trigger exists for jobs if not already there
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_jobs_updated_at') THEN
        CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
