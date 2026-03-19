-- Admin Security & RLS Overrides
-- This migration ensures that users with the 'admin' role can manage all data.

-- PROFILES
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- CANDIDATE PROFILES
CREATE POLICY "Admins can do everything on candidate_profiles"
ON public.candidate_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- EMPLOYER PROFILES
CREATE POLICY "Admins can do everything on employer_profiles"
ON public.employer_profiles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- JOBS
CREATE POLICY "Admins can do everything on jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- APPLICATIONS
CREATE POLICY "Admins can do everything on applications"
ON public.applications
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- CANDIDATE SKILLS
CREATE POLICY "Admins can do everything on candidate_skills"
ON public.candidate_skills
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- JOB SKILLS
CREATE POLICY "Admins can do everything on job_skills"
ON public.job_skills
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- SITE CONTENT
-- Ensure ONLY admins can insert/update/delete site content
DROP POLICY IF EXISTS "Anyone can view site_content" ON public.site_content;
CREATE POLICY "Anyone can view site_content" ON public.site_content FOR SELECT USING (true);

CREATE POLICY "Admins can manage site_content"
ON public.site_content
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
