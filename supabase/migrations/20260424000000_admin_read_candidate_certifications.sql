-- Allow admins to view all candidate certifications in admin registry views
DROP POLICY IF EXISTS "Admins can view all candidate certifications" ON public.candidate_certifications;

CREATE POLICY "Admins can view all candidate certifications"
ON public.candidate_certifications
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
