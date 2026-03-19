-- Create candidate_skills table
CREATE TABLE IF NOT EXISTS candidate_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  years_experience INTEGER NOT NULL DEFAULT 0,
  skill_level TEXT CHECK (skill_level IN ('Junior', 'Intermediate', 'Senior', 'Lead', 'Architect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_skills table
CREATE TABLE IF NOT EXISTS job_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  years_experience INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT CHECK (plan_type IN ('Free', 'Basic', 'Professional', 'Enterprise')) DEFAULT 'Free',
  status TEXT CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete')) DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  job_posts_count INTEGER DEFAULT 0,
  resume_downloads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_views table
CREATE TABLE IF NOT EXISTS job_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modify existing tables
ALTER TABLE candidate_profiles 
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS availability_status TEXT CHECK (availability_status IN ('Available', 'Not Available', 'Open to Offers')) DEFAULT 'Available',
  ADD COLUMN IF NOT EXISTS resume_text TEXT;

ALTER TABLE employer_profiles
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS job_mode TEXT CHECK (job_mode IN ('On-Site', 'Hybrid', 'Remote'));

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company_logos', 'company_logos', true) 
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for candidate_skills
CREATE POLICY "Anyone can view candidate_skills" ON candidate_skills FOR SELECT USING (true);
CREATE POLICY "Candidates can insert own skills" ON candidate_skills FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM candidate_profiles WHERE id = candidate_skills.candidate_id AND user_id = auth.uid())
);
CREATE POLICY "Candidates can update own skills" ON candidate_skills FOR UPDATE USING (
  EXISTS (SELECT 1 FROM candidate_profiles WHERE id = candidate_skills.candidate_id AND user_id = auth.uid())
);
CREATE POLICY "Candidates can delete own skills" ON candidate_skills FOR DELETE USING (
  EXISTS (SELECT 1 FROM candidate_profiles WHERE id = candidate_skills.candidate_id AND user_id = auth.uid())
);

-- RLS Policies for job_skills
CREATE POLICY "Anyone can view job_skills" ON job_skills FOR SELECT USING (true);
CREATE POLICY "Employers can insert job skills" ON job_skills FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs j 
    JOIN employer_profiles ep ON j.employer_id = ep.id 
    WHERE j.id = job_skills.job_id AND ep.user_id = auth.uid()
  )
);
CREATE POLICY "Employers can update job skills" ON job_skills FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM jobs j 
    JOIN employer_profiles ep ON j.employer_id = ep.id 
    WHERE j.id = job_skills.job_id AND ep.user_id = auth.uid()
  )
);
CREATE POLICY "Employers can delete job skills" ON job_skills FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM jobs j 
    JOIN employer_profiles ep ON j.employer_id = ep.id 
    WHERE j.id = job_skills.job_id AND ep.user_id = auth.uid()
  )
);

-- RLS Policies for subscriptions
CREATE POLICY "Employers can view own subscription" ON subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM employer_profiles WHERE id = subscriptions.employer_id AND user_id = auth.uid())
);

-- RLS Policies for job_views
CREATE POLICY "Anyone can insert job_views" ON job_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Employers can view own job views" ON job_views FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM jobs j 
    JOIN employer_profiles ep ON j.employer_id = ep.id 
    WHERE j.id = job_views.job_id AND ep.user_id = auth.uid()
  )
);

-- Storage Policies for company logos
CREATE POLICY "Employers can upload own logos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'company_logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Anyone can view company logos" ON storage.objects FOR SELECT USING (bucket_id = 'company_logos');
CREATE POLICY "Employers can update own logos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'company_logos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Employers can delete own logos" ON storage.objects FOR DELETE USING (
  bucket_id = 'company_logos' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Updated_at triggers
CREATE TRIGGER update_candidate_skills_updated_at BEFORE UPDATE ON candidate_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_skills_updated_at BEFORE UPDATE ON job_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
