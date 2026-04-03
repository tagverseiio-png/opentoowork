-- Add recruiter metadata fields required by signup/profile validation
ALTER TABLE public.employer_profiles
  ADD COLUMN IF NOT EXISTS recruiter_job_title TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
