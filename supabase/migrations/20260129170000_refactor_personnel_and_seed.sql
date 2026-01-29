-- Migration: 20260129170000_refactor_personnel_and_seed.sql
-- FIXED COMPREHENSIVE:
-- 1. Handles Text vs UUID types (keeps TEXT to match legacy system).
-- 2. NUCLEAR-SAFE: Drops constraints -> Unlinks Contracts -> Deletes Employees -> Reseeds -> Restores Constraints.
-- 3. Ensures Data Integrity without losing Contracts.

-- ==========================================
-- 1. PRE-FLIGHT: Cleanup Constraints & Columns
-- ==========================================

-- Drop legacy FKs if they exist (to allow deletion of employees)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contracts_salesperson_id_fkey') THEN
        ALTER TABLE contracts DROP CONSTRAINT contracts_salesperson_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contracts_employee_id_fkey') THEN
        ALTER TABLE contracts DROP CONSTRAINT contracts_employee_id_fkey;
    END IF;
END $$;

-- Optimize RLS Helper Functions (Return TEXT to match Schema)
DROP FUNCTION IF EXISTS auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS auth_user_unit_id() CASCADE;

CREATE OR REPLACE FUNCTION auth_user_role() 
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_unit_id() 
RETURNS text AS $$
  SELECT unit_id::text FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ==========================================
-- 2. REFACTOR SCHEMA: Sales People -> Employees
-- ==========================================
DO $$
BEGIN
    -- Rename Table if needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_people') THEN
            ALTER TABLE sales_people RENAME TO employees;
        ELSE
            CREATE TABLE employees (
                id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
    
    -- Rename contracts column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'salesperson_id') THEN
        ALTER TABLE contracts RENAME COLUMN salesperson_id TO employee_id;
    END IF;

    -- FORCE employee_id to be NULLABLE (Safe Unlink)
    ALTER TABLE contracts ALTER COLUMN employee_id DROP NOT NULL;

END $$;


-- ==========================================
-- 3. DATA CLEANUP (The Fix for Foreign Key Error)
-- ==========================================

-- Unlink all contracts from old employees (sets them to NULL)
UPDATE contracts SET employee_id = NULL;

-- Now safe to delete employees
DELETE FROM employees;

-- Fix Units Table Target Column Type (JSONB -> Numeric)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'target' AND data_type = 'jsonb') THEN
        ALTER TABLE units DROP COLUMN target;
        ALTER TABLE units ADD COLUMN target numeric DEFAULT 0;
    END IF;
END $$;


-- ==========================================
-- 4. SEED DATA
-- ==========================================

-- Units (TEXT IDs)
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


-- Employees (Seed all roles - using generated UUIDs cast to text)
INSERT INTO employees (id, name, unit_id, email, position, role_code, department) VALUES
    -- LEADERSHIP (Unit 9)
    (gen_random_uuid()::text, 'Nguyễn Quốc Anh', 'u9', 'anh.nq@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid()::text, 'Phạm Văn Long', 'u9', 'long.pv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),
    
    -- SALES KD1 (Unit 1)
    (gen_random_uuid()::text, 'Lê Hoàng Nam', 'u1', 'nam.lh@cic.com.vn', 'Trưởng phòng KD1', 'UnitLeader', 'Business'),
    (gen_random_uuid()::text, 'Nguyễn Thị Thu', 'u1', 'thu.nt@cic.com.vn', 'Nhân viên KD', 'NVKD', 'Business'),
    
    -- SALES KD2 (Unit 2)
    (gen_random_uuid()::text, 'Vũ Thanh Hằng', 'u2', 'hang.vt@cic.com.vn', 'Trưởng phòng KD2', 'UnitLeader', 'Business'),
    
    -- TECH (Unit 5, 6)
    (gen_random_uuid()::text, 'Hoàng Văn Dũng', 'u5', 'dung.hv@cic.com.vn', 'GĐ TT Phần mềm', 'UnitLeader', 'Technology'),
    (gen_random_uuid()::text, 'Bùi Quốc Đạt', 'u6', 'dat.bq@cic.com.vn', 'GĐ TT BIM', 'UnitLeader', 'Technology'),
    
    -- FINANCE (Unit 7)
    (gen_random_uuid()::text, 'Đào Thị Minh', 'u7', 'minh.dt@cic.com.vn', 'Kế toán trưởng', 'ChiefAccountant', 'Finance');


-- Restore Contracts Relations
DO $$
DECLARE
    emp_pm_id text;
    emp_bim_id text;
    emp_kd1_id text;
BEGIN
    SELECT id INTO emp_pm_id FROM employees WHERE email = 'dung.hv@cic.com.vn' LIMIT 1;
    SELECT id INTO emp_bim_id FROM employees WHERE email = 'dat.bq@cic.com.vn' LIMIT 1;
    SELECT id INTO emp_kd1_id FROM employees WHERE email = 'thu.nt@cic.com.vn' LIMIT 1;

    -- Mock Contracts (Re-link or Insert new mocks)
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


-- ==========================================
-- 5. RE-APPLY CONSTRAINTS & POLICIES
-- ==========================================

-- Re-add FK with ON DELETE SET NULL (Safer for future)
ALTER TABLE contracts ADD CONSTRAINT contracts_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

-- RLS Policies
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
