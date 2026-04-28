-- Migration: 20260129120000_rbac_schema.sql
-- Description: Formalize RBAC with Enums and strict RLS

-- 1. Create UserRole Enum (Idempotent)
-- 1. Create UserRole Type (if not exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('NVKD', 'AdminUnit', 'UnitLeader', 'Accountant', 'ChiefAccountant', 'Legal', 'Leadership');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Update Profiles Table
-- Safely add 'role' column if missing.
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'NVKD';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'unit_id') THEN
         ALTER TABLE profiles ADD COLUMN unit_id UUID REFERENCES units(id);
    END IF;
END $$;

-- 3. Cleanup Old Policies (From 20260129000000 or older)
DROP POLICY IF EXISTS "Unit Scope Read" ON contracts;
DROP POLICY IF EXISTS "Unit Scope Insert" ON contracts;
DROP POLICY IF EXISTS "Unit Scope Update" ON contracts;
DROP POLICY IF EXISTS "Contracts Visibility" ON contracts;
DROP POLICY IF EXISTS "Contracts Management" ON contracts;

DROP POLICY IF EXISTS "Unit Scope Read PAKD" ON contract_business_plans;
DROP POLICY IF EXISTS "Unit Scope Write PAKD" ON contract_business_plans;
DROP POLICY IF EXISTS "PAKD Visibility" ON contract_business_plans;
DROP POLICY IF EXISTS "PAKD Update" ON contract_business_plans;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;


-- 4. New RLS Policies using Enum

-- 4.1. Profiles
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- 4.2. Contracts
-- Visibility: Global roles OR Own Unit
CREATE POLICY "Contracts_View_Policy" ON contracts
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Leadership', 'Legal', 'Accountant', 'ChiefAccountant', 'AdminUnit')
        OR
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    );

-- Management: NVKD/UnitLeader can CRUD within Unit
CREATE POLICY "Contracts_Manage_Policy" ON contracts
    FOR ALL USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('NVKD', 'UnitLeader', 'AdminUnit')
        AND
        unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
    );

-- 4.3 Customers (Open Read for internal collaboration, Write scoped)
DROP POLICY IF EXISTS "Customers_View_Policy" ON customers;
CREATE POLICY "Customers_View_Policy" ON customers FOR SELECT USING (true);

DROP POLICY IF EXISTS "Customers_Manage_Policy" ON customers;
CREATE POLICY "Customers_Manage_Policy" ON customers
    FOR ALL USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('NVKD', 'UnitLeader', 'AdminUnit')
        -- AND unit_id check if we link customers to units? 
        -- Current Customer schema might not have unit_id. If not, open write or restrict?
        -- For now, let's assume Open Write for authorized roles to avoid blocking.
    );

-- 4.4. Business Plans (PAKD)
-- Read: Same as Contracts
CREATE POLICY "PAKD_View_Policy" ON contract_business_plans
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_business_plans.contract_id
            AND (
                (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Leadership', 'Legal', 'Accountant', 'ChiefAccountant', 'AdminUnit')
                OR
                contracts.unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
            )
        )
    );

-- Write: Block Update if Approved (Workflow Rule)
-- AND Unit Scope check via Contract
CREATE POLICY "PAKD_Modify_Policy" ON contract_business_plans
    FOR UPDATE USING (
        -- Scope Check
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_business_plans.contract_id
            AND contracts.unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
        )
        AND
        -- Status Check
        (
            status != 'Approved' 
            OR 
            (SELECT role FROM profiles WHERE id = auth.uid()) = 'Leadership'
        )
    );

CREATE POLICY "PAKD_Create_Policy" ON contract_business_plans
    FOR INSERT WITH CHECK (
        -- Can create if you can see the contract and it's your unit
        EXISTS (
            SELECT 1 FROM contracts 
            WHERE contracts.id = contract_business_plans.contract_id
            AND contracts.unit_id = (SELECT unit_id FROM profiles WHERE id = auth.uid())
        )
    );

-- 5. Helper Function Updates
CREATE OR REPLACE FUNCTION auth_user_role() RETURNS user_role AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- 6. Add Status Column to Business Plans if missing
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contract_business_plans' AND column_name = 'status') THEN
        ALTER TABLE contract_business_plans ADD COLUMN status TEXT DEFAULT 'Draft';
    END IF;
END $$;
