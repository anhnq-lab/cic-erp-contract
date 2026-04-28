-- Migration: 20260129160000_optimize_rls.sql
-- Description: Optimize RLS by using STABLE Security Definer functions to avoid checking profiles table for every row.

-- 1. Create Helper Functions
CREATE OR REPLACE FUNCTION auth_user_role() 
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_unit_id() 
RETURNS uuid AS $$
  -- Explicitly cast to uuid to avoid "Actual return type is text" error if pg infers incorrectly
  SELECT unit_id::uuid FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Optimize Contracts Policies
DROP POLICY IF EXISTS "Contracts_View_Policy" ON contracts;
CREATE POLICY "Contracts_View_Policy" ON contracts
    FOR SELECT USING (
        auth_user_role() IN ('Leadership', 'Legal', 'Accountant', 'ChiefAccountant', 'AdminUnit')
        OR
        unit_id = auth_user_unit_id()
    );

DROP POLICY IF EXISTS "Contracts_Manage_Policy" ON contracts;
CREATE POLICY "Contracts_Manage_Policy" ON contracts
    FOR ALL USING (
        auth_user_role() IN ('NVKD', 'UnitLeader', 'AdminUnit')
        AND
        unit_id = auth_user_unit_id()
    );

-- 3. Optimize PAKD Policies
DROP POLICY IF EXISTS "PAKD_View_Policy" ON contract_business_plans;
CREATE POLICY "PAKD_View_Policy" ON contract_business_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_business_plans.contract_id
            AND (
                auth_user_role() IN ('Leadership', 'Legal', 'Accountant', 'ChiefAccountant', 'AdminUnit')
                OR
                contracts.unit_id = auth_user_unit_id()
            )
        )
    );

-- 4. Clean up / Verification
-- (Combined previous needed fixes if any)
