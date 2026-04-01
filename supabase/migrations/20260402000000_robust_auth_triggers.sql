-- 1. Ensure 'profiles' table has 'is_active' column and unique email
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Remove duplicate email records if any before adding constraint (safe precaution)
-- DELETE FROM public.profiles a USING public.profiles b WHERE a.ctid < b.ctid AND a.email = b.email;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- 2. Fixed 'handle_new_user' trigger with robust error handling and conflict management
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Determine role safely from metadata or default to candidate
  BEGIN
    user_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    user_role := 'candidate'::public.user_role;
  END;

  -- Insert into public.profiles with conflict handling on ID
  -- We handle potential email conflicts by updating the existing ID record if it exists
  INSERT INTO public.profiles (id, full_name, email, role, phone, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.email, 'no-email@provided.com'),
    user_role,
    NEW.raw_user_meta_data->>'phone',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = true,
    email = EXCLUDED.email;

  -- Secondary profile tables
  IF (user_role = 'candidate') THEN
    INSERT INTO public.candidate_profiles (user_id, work_authorization, is_active)
    VALUES (NEW.id, 'USC', true)
    ON CONFLICT (user_id) DO UPDATE SET is_active = true;
  ELSIF (user_role = 'employer') THEN
    INSERT INTO public.employer_profiles (user_id, company_name, location, is_active)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
      COALESCE(NEW.raw_user_meta_data->>'location', 'Remote'),
      true
    )
    ON CONFLICT (user_id) DO UPDATE SET is_active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
