-- Notification System Schema
-- This migration implements a centralized notification table and automated triggers for 
-- platform-wide alerts (Applications, Status Updates).

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'application_received', 'status_update', 'job_match', 'system'
  link TEXT, -- Optional link to relevant page (e.g., job detail or application)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
ON public.notifications FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. Trigger for NEW APPLICATION (Notify Employer)
CREATE OR REPLACE FUNCTION notify_employer_new_application()
RETURNS TRIGGER AS $$
DECLARE
  employer_user_id UUID;
  job_title TEXT;
  candidate_name TEXT;
BEGIN
  -- Get employer's user_id and job title
  SELECT ep.user_id, j.title INTO employer_user_id, job_title
  FROM public.jobs j
  JOIN public.employer_profiles ep ON j.employer_id = ep.id
  WHERE j.id = NEW.job_id;

  -- Get candidate's name
  SELECT p.full_name INTO candidate_name
  FROM public.candidate_profiles cp
  JOIN public.profiles p ON cp.user_id = p.id
  WHERE cp.id = NEW.candidate_id;

  -- Insert notification
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    employer_user_id,
    'New Application Received',
    candidate_name || ' has applied for the position: ' || job_title,
    'application_received',
    '/employer/dashboard'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_employer_on_application
AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION notify_employer_new_application();

-- 3. Trigger for STATUS UPDATE (Notify Candidate)
CREATE OR REPLACE FUNCTION notify_candidate_status_update()
RETURNS TRIGGER AS $$
DECLARE
  candidate_user_id UUID;
  job_title TEXT;
BEGIN
  -- Only trigger if status has changed
  IF (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Get candidate's user_id
    SELECT cp.user_id INTO candidate_user_id
    FROM public.candidate_profiles cp
    WHERE cp.id = NEW.candidate_id;

    -- Get job title
    SELECT title INTO job_title
    FROM public.jobs
    WHERE id = NEW.job_id;

    -- Insert notification
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      candidate_user_id,
      'Application Status Updated',
      'Your application for "' || job_title || '" has been moved to: ' || NEW.status,
      'status_update',
      '/candidate/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_candidate_on_status_change
AFTER UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION notify_candidate_status_update();
