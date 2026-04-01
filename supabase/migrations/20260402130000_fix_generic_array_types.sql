-- Migration to fix generic ARRAY types that cause 406 Not Acceptable errors in PostgREST
-- These were likely generated as placeholders and need to be real Postgres array types.

-- 1. Correct candidate_profiles
ALTER TABLE public.candidate_profiles 
  ALTER COLUMN skills TYPE text[] USING (
    CASE 
      WHEN skills IS NULL THEN NULL
      ELSE skills::text[] 
    END
  );

-- 2. Correct jobs table
ALTER TABLE public.jobs 
  ALTER COLUMN work_authorization TYPE public.work_authorization_type[] USING (
    CASE 
      WHEN work_authorization IS NULL THEN NULL
      ELSE work_authorization::public.work_authorization_type[]
    END
  );

ALTER TABLE public.jobs 
  ALTER COLUMN skills_required TYPE text[] USING (
    CASE 
      WHEN skills_required IS NULL THEN NULL
      ELSE skills_required::text[]
    END
  );

-- 3. Ensure permissions are correct for the API
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
