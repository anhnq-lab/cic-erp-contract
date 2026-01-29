-- Migration: 20260129170000_refactor_personnel_and_seed.sql
-- FIXED: 
-- 1. Uses TEXT IDs to match existing schema.
-- 2. Handles Foreign Key constraints correctly (Drop old FK -> Delete Data -> Add new FK).

-- 1. Optimize RLS Helper Functions (Return TEXT to match Schema)
DROP FUNCTION IF EXISTS auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS auth_user_unit_id() CASCADE;

CREATE OR REPLACE FUNCTION auth_user_role() 
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_unit_id() 
RETURNS text AS $$
  -- Returns TEXT because contracts.unit_id and units.id are TEXT columns ('u1', etc.)
  SELECT unit_id::text FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 2. Refactor Sales People -> Employees
DO $$
BEGIN
    -- Rename Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_people') THEN
            ALTER TABLE sales_people RENAME TO employees;
        ELSE
            CREATE TABLE employees (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                name text NOT NULL,
                unit_id text REFERENCES units(id),
                email text,
                phone text,
                position text,
                department text,
                target numeric,
                date_joined date
            );
        END IF;
    END IF;

    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department') THEN
        ALTER TABLE employees ADD COLUMN department text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role_code') THEN
        ALTER TABLE employees ADD COLUMN role_code text; 
    END IF;
    
    -- Rename FK Column in Contracts
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'salesperson_id') THEN
        ALTER TABLE contracts RENAME COLUMN salesperson_id TO employee_id;
    END IF;

    -- FIX FK Constraint: Drop old constraint if exists (salesperson_id matches)
    -- This prevents the "violates foreign key constraint" error
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contracts_salesperson_id_fkey') THEN
        ALTER TABLE contracts DROP CONSTRAINT contracts_salesperson_id_fkey;
    END IF;

    -- Add new constraint if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contracts_employee_id_fkey') THEN
        ALTER TABLE contracts ADD CONSTRAINT contracts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id);
    END IF;

END $$;


-- 3. Fix Units Table Target Column Type
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'target' AND data_type = 'jsonb') THEN
        ALTER TABLE units DROP COLUMN target;
        ALTER TABLE units ADD COLUMN target numeric DEFAULT 0;
    END IF;
END $$;


-- 4. Re-create RLS Policies (Using Optimized Functions)
DROP POLICY IF EXISTS "Contracts_View_Policy" ON contracts;
CREATE POLICY "Contracts_View_Policy" ON contracts
    FOR SELECT USING (
        auth_user_role() IN ('Leadership', 'Legal', 'Accountant', 'ChiefAccountant', 'AdminUnit')
        OR
        unit_id = auth_user_unit_id() -- Now comparison is TEXT = TEXT
    );

DROP POLICY IF EXISTS "Contracts_Manage_Policy" ON contracts;
CREATE POLICY "Contracts_Manage_Policy" ON contracts
    FOR ALL USING (
        auth_user_role() IN ('NVKD', 'UnitLeader', 'AdminUnit')
        AND
        unit_id = auth_user_unit_id()
    );

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


-- 5. Seed Data (Re-seed cleanly)
-- MUST DELETE CONTRACTS FIRST to satisfy Foreign Keys
DELETE FROM contracts WHERE id LIKE 'c_mock_%'; -- Only delete mocks to be safe, or DELETE FROM contracts; if dev
DELETE FROM employees; 

-- Units
INSERT INTO units (id, code, name, type, target) VALUES
    ('u1', 'KD01', 'Phòng Kinh doanh 1', 'Business', 50000000000),
    ('u2', 'KD02', 'Phòng Kinh doanh 2', 'Business', 45000000000),
    ('u3', 'DA01', 'Ban Dự án 1', 'Engineering', 0),
    ('u4', 'DA02', 'Ban Dự án 2', 'Engineering', 0),
    ('u5', 'PM', 'TT Phần mềm', 'Business', 20000000000),
    ('u6', 'BIM', 'TT BIM', 'Business', 15000000000),
    ('u7', 'KT', 'Phòng Kế toán', 'BackOffice', 0),
    ('u8', 'HC', 'Phòng Hành chính', 'BackOffice', 0),
    ('u9', 'BGD', 'Ban Giám đốc', 'Board', 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, target = EXCLUDED.target;


-- Employees (Seed all roles)
INSERT INTO employees (id, name, unit_id, email, position, role_code, department) VALUES
    -- LEADERSHIP (Unit 9)
    (gen_random_uuid(), 'Nguyễn Quốc Anh', 'u9', 'anh.nq@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid(), 'Phạm Văn Long', 'u9', 'long.pv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),
    
    -- SALES KD1 (Unit 1)
    (gen_random_uuid(), 'Lê Hoàng Nam', 'u1', 'nam.lh@cic.com.vn', 'Trưởng phòng KD1', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Nguyễn Thị Thu', 'u1', 'thu.nt@cic.com.vn', 'Nhân viên KD', 'NVKD', 'Business'),
    
    -- SALES KD2 (Unit 2)
    (gen_random_uuid(), 'Vũ Thanh Hằng', 'u2', 'hang.vt@cic.com.vn', 'Trưởng phòng KD2', 'UnitLeader', 'Business'),
    
    -- TECH (Unit 5, 6)
    (gen_random_uuid(), 'Hoàng Văn Dũng', 'u5', 'dung.hv@cic.com.vn', 'GĐ TT Phần mềm', 'UnitLeader', 'Technology'),
    (gen_random_uuid(), 'Bùi Quốc Đạt', 'u6', 'dat.bq@cic.com.vn', 'GĐ TT BIM', 'UnitLeader', 'Technology'),
    
    -- FINANCE (Unit 7)
    (gen_random_uuid(), 'Đào Thị Minh', 'u7', 'minh.dt@cic.com.vn', 'Kế toán trưởng', 'ChiefAccountant', 'Finance');

-- NOTE: contracts seeder
DO $$
DECLARE
    emp_pm_id uuid;
    emp_bim_id uuid;
    emp_kd1_id uuid;
BEGIN
    SELECT id INTO emp_pm_id FROM employees WHERE email = 'dung.hv@cic.com.vn' LIMIT 1;
    SELECT id INTO emp_bim_id FROM employees WHERE email = 'dat.bq@cic.com.vn' LIMIT 1;
    SELECT id INTO emp_kd1_id FROM employees WHERE email = 'thu.nt@cic.com.vn' LIMIT 1;

    -- Mock Contracts
    INSERT INTO contracts (id, title, customer_id, unit_id, employee_id, value, status, created_at, signed_date) VALUES
    ('c_mock_1', 'HĐ Phần mềm Quản lý Đô thị', 'c1', 'u5', emp_pm_id, 2500000000, 'Active', NOW(), '2025-01-15')
    ON CONFLICT (id) DO UPDATE SET employee_id = EXCLUDED.employee_id;

    INSERT INTO contracts (id, title, customer_id, unit_id, employee_id, value, status, created_at, signed_date) VALUES
    ('c_mock_2', 'HĐ Tư vấn BIM Dự án Metro', 'c2', 'u6', emp_bim_id, 5800000000, 'Pending', NOW(), '2025-02-01')
    ON CONFLICT (id) DO UPDATE SET employee_id = EXCLUDED.employee_id;

    INSERT INTO contracts (id, title, customer_id, unit_id, employee_id, value, status, created_at, signed_date) VALUES
    ('c_mock_3', 'HĐ Cung cấp thiết bị P1', 'c1', 'u1', emp_kd1_id, 1200000000, 'Reviewing', NOW(), '2025-01-20')
    ON CONFLICT (id) DO UPDATE SET employee_id = EXCLUDED.employee_id;

END $$;
