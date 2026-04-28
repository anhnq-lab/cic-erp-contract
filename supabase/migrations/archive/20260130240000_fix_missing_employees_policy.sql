-- Migration: Add missing Dev policy for employees table
-- Issue: cleanup_duplicate_policies.sql dropped all policies on employees
--        but disable_rbac_dev.sql didn't create a new one, leaving employees table locked!

-- Re-enable RLS if not already enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create permissive dev policy for employees
DROP POLICY IF EXISTS "Dev_Allow_All_Employees" ON employees;
CREATE POLICY "Dev_Allow_All_Employees" ON employees
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Also ensure customers table has the same open policy
DROP POLICY IF EXISTS "Dev_Allow_All_Customers" ON customers;
CREATE POLICY "Dev_Allow_All_Customers" ON customers
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- Add missing policy for products if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Dev_Allow_All_Products" ON products';
        EXECUTE 'CREATE POLICY "Dev_Allow_All_Products" ON products FOR ALL USING (true) WITH CHECK (true)';
    END IF;
END
$$;

-- Verification comment: After this migration, all major tables should have open Dev policies
-- Tables with Dev_Allow_All_* policies: contracts, contract_business_plans, payments, profiles, units, employees, customers, products
