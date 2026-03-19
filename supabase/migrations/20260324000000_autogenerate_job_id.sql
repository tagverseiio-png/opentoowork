-- Automated Job Identifier System
-- This migration implements a sequence and trigger to autogenerate 
-- unique internal Job IDs in the format OTW-YYYY-XXXX.

-- 1. Create a sequence for the numeric part of the ID
CREATE SEQUENCE IF NOT EXISTS public.job_id_seq START WITH 1;

-- 2. Create function to generate the formatted ID
CREATE OR REPLACE FUNCTION public.generate_job_id() 
RETURNS TRIGGER AS $$
DECLARE
  year_prefix TEXT;
  new_seq_val BIGINT;
BEGIN
  -- Only generate if job_id is not already provided (allows manual override if needed)
  IF NEW.job_id IS NULL OR NEW.job_id = '' THEN
    year_prefix := TO_CHAR(NOW(), 'YYYY');
    new_seq_val := NEXTVAL('public.job_id_seq');
    
    -- Format: OTW-2026-0001
    NEW.job_id := 'OTW-' || year_prefix || '-' || LPAD(new_seq_val::TEXT, 4, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trigger_generate_job_id ON public.jobs;
CREATE TRIGGER trigger_generate_job_id
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.generate_job_id();

-- 4. Backfill existing jobs without ID (optional but good for consistency)
UPDATE public.jobs 
SET job_id = 'OTW-' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(NEXTVAL('public.job_id_seq')::TEXT, 4, '0')
WHERE job_id IS NULL OR job_id = '';
