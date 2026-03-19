-- ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FIX TABLES (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.job_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    years_experience INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.job_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES public.employer_profiles(id) ON DELETE CASCADE UNIQUE,
    stripe_customer_id TEXT,
    plan_type TEXT DEFAULT 'Free',
    status TEXT DEFAULT 'active',
    current_period_end TIMESTAMPTZ,
    job_posts_count INTEGER DEFAULT 0,
    job_posts_limit INTEGER DEFAULT 1,
    resume_downloads_count INTEGER DEFAULT 0,
    resume_access TEXT DEFAULT 'No',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FIX COLUMNS (ADD IF THEY ARE MISSING)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='employer_profiles' AND column_name='logo_url') THEN
        ALTER TABLE public.employer_profiles ADD COLUMN logo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='expires_at') THEN
        ALTER TABLE public.jobs ADD COLUMN expires_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='jobs' AND column_name='job_mode') THEN
        ALTER TABLE public.jobs ADD COLUMN job_mode TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidate_profiles' AND column_name='linkedin_url') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN linkedin_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidate_profiles' AND column_name='availability_status') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN availability_status TEXT DEFAULT 'Available';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='candidate_profiles' AND column_name='resume_text') THEN
        ALTER TABLE public.candidate_profiles ADD COLUMN resume_text TEXT;
    END IF;
END $$;

-- 3. FIX AUTH TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'candidate'::public.user_role);

  INSERT INTO public.profiles (id, full_name, email, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    user_role,
    NEW.raw_user_meta_data->>'phone'
  ) ON CONFLICT (id) DO NOTHING;

  IF (user_role = 'candidate') THEN
    INSERT INTO public.candidate_profiles (user_id, work_authorization)
    VALUES (NEW.id, 'USC') ON CONFLICT (user_id) DO NOTHING;
  ELSIF (user_role = 'employer') THEN
    INSERT INTO public.employer_profiles (user_id, company_name, location, company_website)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
      COALESCE(NEW.raw_user_meta_data->>'location', 'Remote'),
      NEW.raw_user_meta_data->>'company_website'
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Create default free subscription
    INSERT INTO public.subscriptions (employer_id, plan_type, status)
    SELECT id, 'Free', 'active' FROM public.employer_profiles WHERE user_id = NEW.id
    ON CONFLICT (employer_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. BACKFILL PROFILES
INSERT INTO public.profiles (id, full_name, email, role, phone)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', email), email, COALESCE((raw_user_meta_data->>'role')::public.user_role, 'candidate'::public.user_role), raw_user_meta_data->>'phone'
FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.employer_profiles (user_id, company_name, location)
SELECT id, COALESCE(raw_user_meta_data->>'company_name', 'My Company'), COALESCE(raw_user_meta_data->>'location', 'Remote')
FROM auth.users WHERE (raw_user_meta_data->>'role') = 'employer' AND id NOT IN (SELECT user_id FROM public.employer_profiles) ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.candidate_profiles (user_id, work_authorization)
SELECT id, 'USC' FROM auth.users WHERE (raw_user_meta_data->>'role') = 'candidate' AND id NOT IN (SELECT user_id FROM public.candidate_profiles) ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    keywords TEXT,
    location TEXT,
    min_salary INTEGER,
    visa_status TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own job alerts" ON public.job_alerts
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS benefits TEXT;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;
ALTER TABLE public.candidate_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
