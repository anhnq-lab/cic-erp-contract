-- Migration: Link profile to employee by email
-- When a user signs in with Google OAuth, auto-match their email to an employee record

-- 1. Add employee_id column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL;

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- 3. Backfill existing profiles: match by email
UPDATE profiles p
SET 
  employee_id = e.id,
  full_name = COALESCE(p.full_name, e.name),
  unit_id = COALESCE(p.unit_id, e.unit_id),
  role = COALESCE(e.role_code::user_role, p.role)
FROM employees e
WHERE LOWER(p.email) = LOWER(e.email)
  AND p.employee_id IS NULL;

-- 4. Update handle_new_user trigger to auto-link on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  matched_emp RECORD;
BEGIN
  -- Look up employee by email
  SELECT id, name, unit_id, role_code
  INTO matched_emp
  FROM public.employees
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  IF matched_emp.id IS NOT NULL THEN
    -- Employee found: create profile with employee data
    INSERT INTO public.profiles (id, email, full_name, role, unit_id, employee_id)
    VALUES (
      new.id,
      new.email,
      matched_emp.name,
      COALESCE(matched_emp.role_code::user_role, 'NVKD'),
      matched_emp.unit_id,
      matched_emp.id
    );
  ELSE
    -- No matching employee: create default profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'NVKD');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search_path for security
ALTER FUNCTION handle_new_user() SET search_path = public;
