-- Add new columns for candidate and employer profiles
ALTER TABLE public.candidate_profiles
ADD COLUMN IF NOT EXISTS desired_job_title text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.employer_profiles
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add 'H1B Transfer' to work_authorization_type enum
-- Safe addition to enum requires a specific block or direct command
ALTER TYPE public.work_authorization_type ADD VALUE IF NOT EXISTS 'H1B Transfer';
