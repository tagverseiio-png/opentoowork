-- OPEN TOO WORK: CONSOLIDATED SCHEMA RESCUE SCRIPT
-- RUN THIS IN THE SUPABASE SQL EDITOR TO SYNCHRONIZE YOUR DATABASE

-- 1. ADD JOB_ID COLUMN TO JOBS TABLE
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='job_id') THEN
        ALTER TABLE public.jobs ADD COLUMN job_id TEXT;
    END IF;
END $$;

-- 2. CREATE NOTIFICATIONS SYSTEM
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'application', 'status_update', 'system'
    is_read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE RLS ON NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- NOTIFICATION POLICIES
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can view own notifications') THEN
        CREATE POLICY "Users can view own notifications" ON public.notifications
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Users can update own notifications') THEN
        CREATE POLICY "Users can update own notifications" ON public.notifications
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. ADMIN SECURITY OVERRIDES
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admins have full access to profiles') THEN
        CREATE POLICY "Admins have full access to profiles" ON public.profiles
            FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admins have full access to jobs') THEN
        CREATE POLICY "Admins have full access to jobs" ON public.jobs
            FOR ALL USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );
    END IF;
END $$;

-- 4. AUTOMATED JOB ID GENERATION (OTW-YYYY-XXXX)
-- Create sequence if not exists
CREATE SEQUENCE IF NOT EXISTS job_id_seq START 1;

-- Function to generate the ID
CREATE OR REPLACE FUNCTION generate_job_id()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    next_val TEXT;
BEGIN
    -- Only generate if job_id is missing
    IF NEW.job_id IS NULL OR NEW.job_id = '' THEN
        year_prefix := to_char(CURRENT_DATE, 'YYYY');
        next_val := lpad(nextval('job_id_seq')::text, 4, '0');
        NEW.job_id := 'OTW-' || year_prefix || '-' || next_val;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to apply the ID before insert
DROP TRIGGER IF EXISTS trigger_generate_job_id ON public.jobs;
CREATE TRIGGER trigger_generate_job_id
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION generate_job_id();

-- 5. NOTIFICATION TRIGGERS
-- Trigger for new applications
CREATE OR REPLACE FUNCTION notify_on_application()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    employer_uuid UUID;
BEGIN
    SELECT title, profiles.id INTO job_title, employer_uuid 
    FROM public.jobs 
    JOIN public.employer_profiles ON jobs.employer_id = employer_profiles.id
    JOIN public.profiles ON employer_profiles.user_id = profiles.id
    WHERE jobs.id = NEW.job_id;

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (employer_uuid, 'New Application', 'You have a new applicant for ' || job_title, 'application', '/dashboard');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_on_application ON public.applications;
CREATE TRIGGER trigger_notify_on_application
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION notify_on_application();

-- REFRESH SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
