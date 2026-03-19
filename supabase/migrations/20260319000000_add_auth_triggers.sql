-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role public.user_role;
BEGIN
  -- Extract role and handle casting
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'candidate'::public.user_role);

  -- Insert into public.profiles
  INSERT INTO public.profiles (id, full_name, email, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    user_role,
    NEW.raw_user_meta_data->>'phone'
  );

  -- Insert into secondary profile table based on role
  IF (user_role = 'candidate') THEN
    INSERT INTO public.candidate_profiles (user_id, work_authorization)
    VALUES (NEW.id, 'USC'); -- Defaulting to USC, candidate can update later
  ELSIF (user_role = 'employer') THEN
    INSERT INTO public.employer_profiles (user_id, company_name, location)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
      COALESCE(NEW.raw_user_meta_data->>'location', 'Remote')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on every new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill for existing users who might be missing profiles
INSERT INTO public.profiles (id, full_name, email, role, phone)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  email, 
  COALESCE((raw_user_meta_data->>'role')::public.user_role, 'candidate'::public.user_role),
  raw_user_meta_data->>'phone'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.employer_profiles (user_id, company_name, location)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'company_name', 'My Company'),
  COALESCE(raw_user_meta_data->>'location', 'Remote')
FROM auth.users
WHERE (raw_user_meta_data->>'role') = 'employer'
AND id NOT IN (SELECT user_id FROM public.employer_profiles)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.candidate_profiles (user_id, work_authorization)
SELECT 
  id, 
  'USC'
FROM auth.users
WHERE (raw_user_meta_data->>'role') = 'candidate'
AND id NOT IN (SELECT user_id FROM public.candidate_profiles)
ON CONFLICT (user_id) DO NOTHING;
