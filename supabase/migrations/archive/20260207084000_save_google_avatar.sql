-- Save Google avatar URL when creating profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  matched_emp RECORD;
  google_avatar TEXT;
BEGIN
  -- Get Google avatar from user metadata
  google_avatar := new.raw_user_meta_data->>'avatar_url';

  -- Look up employee by email
  SELECT id, name, unit_id, role_code
  INTO matched_emp
  FROM public.employees
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  IF matched_emp.id IS NOT NULL THEN
    -- Employee found: create profile with employee data + Google avatar
    INSERT INTO public.profiles (id, email, full_name, role, unit_id, employee_id, avatar_url)
    VALUES (
      new.id,
      new.email,
      matched_emp.name,
      COALESCE(matched_emp.role_code::user_role, 'NVKD'),
      matched_emp.unit_id,
      matched_emp.id,
      google_avatar
    );
  ELSE
    -- No matching employee: create default profile with Google avatar
    INSERT INTO public.profiles (id, email, full_name, role, avatar_url)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'NVKD', google_avatar);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION handle_new_user() SET search_path = public;

-- Backfill avatar_url for existing profiles from auth.users metadata
UPDATE profiles p
SET avatar_url = u.raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE p.id = u.id
  AND p.avatar_url IS NULL
  AND u.raw_user_meta_data->>'avatar_url' IS NOT NULL;
