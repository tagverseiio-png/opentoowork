-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert referrals" ON public.referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "Employers can view referrals for their jobs" ON public.referrals FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.jobs j 
    JOIN public.employer_profiles ep ON j.employer_id = ep.id 
    WHERE j.id = referrals.job_id AND ep.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can view all referrals" ON public.referrals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
