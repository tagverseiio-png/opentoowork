-- FIX NOTIFICATION TRIGGER RLS
-- This migration fixes the RLS violation when candidates apply for jobs.
-- By adding SECURITY DEFINER, the trigger function can insert notifications 
-- for employers even if the current user (candidate) doesn't have direct permission.

CREATE OR REPLACE FUNCTION public.notify_on_application()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    employer_uuid UUID;
BEGIN
    -- 1. Get job title and employer's user_id
    SELECT j.title, p.id INTO job_title, employer_uuid 
    FROM public.jobs j
    JOIN public.employer_profiles ep ON j.employer_id = ep.id
    JOIN public.profiles p ON ep.user_id = p.id
    WHERE j.id = NEW.job_id;

    -- 2. Insert notification (runs with service role privileges due to SECURITY DEFINER)
    IF employer_uuid IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        VALUES (
            employer_uuid, 
            'New Application', 
            'You have a new applicant for ' || job_title, 
            'application', 
            '/dashboard'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-establish the trigger
DROP TRIGGER IF EXISTS trigger_notify_on_application ON public.applications;
CREATE TRIGGER trigger_notify_on_application
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION notify_on_application();

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
