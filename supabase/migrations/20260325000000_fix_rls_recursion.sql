-- FIX RLS RECURSION
-- This migration resolves the infinite loop in 'profiles' policies by using a security definer function.

-- 1. Create helper function to check if current user is an admin
-- SECURITY DEFINER allows this function to bypass RLS and read the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can do everything on candidate_profiles" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Admins can do everything on employer_profiles" ON public.employer_profiles;
DROP POLICY IF EXISTS "Admins can do everything on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can do everything on applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can do everything on candidate_skills" ON public.candidate_skills;
DROP POLICY IF EXISTS "Admins can do everything on job_skills" ON public.job_skills;
DROP POLICY IF EXISTS "Admins can manage site_content" ON public.site_content;

-- 3. Re-create policies using the is_admin() function
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles FOR ALL TO authenticated USING ( public.is_admin() );

CREATE POLICY "Admins can do everything on candidate_profiles"
ON public.candidate_profiles FOR ALL TO authenticated USING ( public.is_admin() );

CREATE POLICY "Admins can do everything on employer_profiles"
ON public.employer_profiles FOR ALL TO authenticated USING ( public.is_admin() );

CREATE POLICY "Admins can do everything on jobs"
ON public.jobs FOR ALL TO authenticated USING ( public.is_admin() );

CREATE POLICY "Admins can do everything on applications"
ON public.applications FOR ALL TO authenticated USING ( public.is_admin() );

CREATE POLICY "Admins can do everything on candidate_skills"
ON public.candidate_skills FOR ALL TO authenticated USING ( public.is_admin() );

CREATE POLICY "Admins can do everything on job_skills"
ON public.job_skills FOR ALL TO authenticated USING ( public.is_admin() );

CREATE POLICY "Admins can manage site_content"
ON public.site_content FOR ALL TO authenticated USING ( public.is_admin() );

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
