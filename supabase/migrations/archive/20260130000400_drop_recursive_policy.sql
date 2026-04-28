-- Drop the problematic policy causing recursion
DROP POLICY IF EXISTS "Admin can manage all profiles" ON profiles;

-- Ensure SuperAdmin Override is valid
-- (It was created in previous step, so it should be there, but we can ensure it)
DROP POLICY IF EXISTS "SuperAdmin Override" ON profiles;
CREATE POLICY "SuperAdmin Override" ON profiles FOR UPDATE
USING (email = 'anhnq@cic.com.vn')
WITH CHECK (email = 'anhnq@cic.com.vn');

-- Also allow Select for SuperAdmin
DROP POLICY IF EXISTS "SuperAdmin Read All" ON profiles;
CREATE POLICY "SuperAdmin Read All" ON profiles FOR SELECT
USING (email = 'anhnq@cic.com.vn');
