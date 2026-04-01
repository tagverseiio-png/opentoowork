-- IMPROVED AUTH TRIGGER: Prevents 500 errors on re-signup or profile restoration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- 1. Determine role safely from metadata or default to candidate
  -- Note: Role exists in the 'user_role' enum created in previous migrations
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'candidate'::public.user_role);

  -- 2. Insert into public.profiles with conflict handling
  -- This handles the case where a user record was deleted but metadata lingers, 
  -- or where an admin only deleted from the profiles table.
  INSERT INTO public.profiles (id, full_name, email, role, phone, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    user_role,
    NEW.raw_user_meta_data->>'phone',
    true -- Ensure re-activated if previously soft-deleted
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = true,
    email = EXCLUDED.email;

  -- 3. Insert into secondary profile table with conflict handling
  IF (user_role = 'candidate') THEN
    INSERT INTO public.candidate_profiles (user_id, work_authorization)
    VALUES (NEW.id, 'USC')
    ON CONFLICT (user_id) DO NOTHING;
  ELSIF (user_role = 'employer') THEN
    INSERT INTO public.employer_profiles (user_id, company_name, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
      COALESCE(NEW.raw_user_meta_data->>'location', 'Remote')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
