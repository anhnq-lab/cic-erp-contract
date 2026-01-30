-- Allow Admin to update any profile
CREATE POLICY "Admin can manage all profiles" ON profiles FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'Admin'
);

-- Ensure public can still update own profile (existing policy matches this)
-- "Users can update own profile" USING (auth.uid() = id)

-- Performance optimization: Ensure role column is indexed (optional but good)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
