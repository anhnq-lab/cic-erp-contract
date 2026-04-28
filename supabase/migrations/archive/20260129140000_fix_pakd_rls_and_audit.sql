-- Migration: 20260129140000_fix_pakd_rls_and_audit.sql
-- Description: Fix strict RLS on PAKD creation and ensure audit logs are writable

-- 1. Fix PAKD Create Policy to allow Leadership and AdminUnit global access (or implicit Unit access)
DROP POLICY IF EXISTS "PAKD_Create_Policy" ON contract_business_plans;

CREATE POLICY "PAKD_Create_Policy" ON contract_business_plans
    FOR INSERT WITH CHECK (
        -- Global Admins can create anywhere
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Leadership', 'Legal', 'Accountant', 'ChiefAccountant', 'AdminUnit')
        OR
        -- Unit Members can create if contract belongs to their unit
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_business_plans.contract_id
            AND contracts.unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
        )
    );

-- 2. Ensure contract_reviews is writable for workflow logging
-- We rely on the Service to do the insertion, so the user needs permission.

DROP POLICY IF EXISTS "Enable insert for authenticated users_reviews" ON contract_reviews;
CREATE POLICY "Enable insert for authenticated users_reviews" ON contract_reviews 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Ensure contract_reviews is readable for everyone (to display history)
DROP POLICY IF EXISTS "Enable read access for all users_reviews" ON contract_reviews;
CREATE POLICY "Enable read access for all users_reviews" ON contract_reviews 
    FOR SELECT USING (true);
