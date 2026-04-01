-- Migration to activate all existing data that might have NULL 'is_active' status
-- This ensures that all previously created jobs show up on the new site.

UPDATE public.jobs SET is_active = true WHERE is_active IS NOT false;
UPDATE public.profiles SET is_active = true WHERE is_active IS NOT false;
UPDATE public.candidate_profiles SET is_active = true WHERE is_active IS NOT false;
UPDATE public.employer_profiles SET is_active = true WHERE is_active IS NOT false;

-- Ensure defaults are stable
ALTER TABLE public.jobs ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.candidate_profiles ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE public.employer_profiles ALTER COLUMN is_active SET DEFAULT true;
