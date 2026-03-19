-- DEFINITIVE RLS & TRIGGER FIX
-- This migration ensures that notifications can be created by triggers 
-- and resolves the 403/406 errors by making RLS settings more robust.

-- 1. Ensure extensions and schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up notifications policies
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage site_content" ON public.site_content; -- cleanup

-- 3. Robust Notifications Policy
-- Allow any authenticated user (including candidates) to INSERT notifications 
-- (this is needed for triggers to work when the user is the initiator).
-- Only allow users to see/edit their OWN notifications.
CREATE POLICY "Anyone can insert notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can see their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Fix Application Trigger (Robust SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    job_title TEXT;
    employer_uuid UUID;
BEGIN
    -- Get job details
    SELECT j.title, p.id INTO job_title, employer_uuid 
    FROM public.jobs j
    JOIN public.employer_profiles ep ON j.employer_id = ep.id
    JOIN public.profiles p ON ep.user_id = p.id
    WHERE j.id = NEW.job_id;

    -- Insert notification for employer
    IF employer_uuid IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            employer_uuid, 
            'New Application', 
            'You have a new applicant for ' || COALESCE(job_title, 'your job'), 
            'application', 
            '/dashboard'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 5. Fix 406 Error - Ensure Applications Table is accessible
-- Sometimes PostgREST returns 406 if RLS is enabled but no SELECT policy matches.
-- Candidates can view their own applications. Employer can view applications for their jobs.
-- Already had these, but let's make sure they are correct.
DROP POLICY IF EXISTS "Candidates can view own applications" ON public.applications;
CREATE POLICY "Candidates can view own applications"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      WHERE cp.id = applications.candidate_id
      AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON public.applications;
CREATE POLICY "Employers can view applications for their jobs"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      JOIN public.employer_profiles ep ON ep.id = j.employer_id
      WHERE j.id = applications.job_id
      AND ep.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Candidates can insert applications" ON public.applications;
CREATE POLICY "Candidates can insert applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.candidate_profiles cp
      WHERE cp.id = applications.candidate_id
      AND cp.user_id = auth.uid()
    )
  );

-- Re-enable RLS to be sure
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
