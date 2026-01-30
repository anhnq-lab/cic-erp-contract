-- 1. Create SECURITY DEFINER helper to avoid recursion
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Drop the recursive policy
DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;

-- 3. Re-create using the helper
CREATE POLICY "Admin can manage all profiles" ON profiles FOR ALL
USING (
  get_my_role() IN ('Admin', 'Leadership')
)
WITH CHECK (
  get_my_role() IN ('Admin', 'Leadership')
);

-- 4. Fix SuperAdmin Override to be safe (optional, but good practice)
-- Previous verify showed it was checking 'email' column of the target row, which is fine for "Update SELF".
-- But checking `get_my_email()` is safer if we want to allow him to update OTHERS.
-- For now, let's leave the SuperAdmin policy if it's not recursive (it checked email column directly).
-- But `profiles` select for policy check might trigger it?
-- Actually, simple column checks like `email = '...'` don't recurse. Subqueries do.
