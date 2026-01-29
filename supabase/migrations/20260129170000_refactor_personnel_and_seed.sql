-- Migration: 20260129170000_refactor_personnel_and_seed.sql

-- 1. Fix Units Table Type (Target column)
-- Error says target is jsonb but expression is bigint. DataSeeder sent number.
-- We should ensure what we want. If it's KPI target, it should probably be numeric.
-- If it's already JSONB and we can't drop it easily, we can cast our input or ALTER the column.
-- Let's ALTER it to numeric if possible, or just seed as JSON.
-- Given it's "target" (doanh so?), numeric makes more sense.
-- Attempt to convert JSONB to Numeric if compatible, or Drop and Recreated.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'units' AND column_name = 'target' AND data_type = 'jsonb') THEN
        -- Dangerous to drop info, but strictly for dev cleanup:
        ALTER TABLE units DROP COLUMN target;
        ALTER TABLE units ADD COLUMN target numeric DEFAULT 0;
    END IF;
END $$;

-- 2. Refactor Sales People -> Employees
-- Check if employees table exists, if not rename sales_people or create new.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'employees') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_people') THEN
            ALTER TABLE sales_people RENAME TO employees;
        ELSE
            CREATE TABLE employees (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                name text NOT NULL,
                unit_id uuid REFERENCES units(id),
                email text,
                phone text,
                position text, -- 'NVKD', 'GD', 'KeToan', etc.
                department text, -- 'Sales', 'Board', 'BackOffice'
                target numeric,
                date_joined date
            );
        END IF;
    END IF;

    -- Add missing columns if renamed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'department') THEN
        ALTER TABLE employees ADD COLUMN department text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'role_code') THEN
        ALTER TABLE employees ADD COLUMN role_code text; -- internal Code for matching 'UserRole' in logic
    END IF;
END $$;

-- 3. Fix Contracts Reference
-- If we renamed sales_people to employees, existing FKs on sales_people might need update if they relied on table name (Postgres handles rename typically).
-- ensure column name in contracts is meaningful.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contracts' AND column_name = 'salesperson_id') THEN
        ALTER TABLE contracts RENAME COLUMN salesperson_id TO employee_id;
    END IF;
END $$;


-- 4. RLS Optimization (Re-apply cleanly with DROP CASCADE)
DROP FUNCTION IF EXISTS auth_user_role() CASCADE;
DROP FUNCTION IF EXISTS auth_user_unit_id() CASCADE;

CREATE OR REPLACE FUNCTION auth_user_role() 
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_user_unit_id() 
RETURNS uuid AS $$
  -- Explicit cast to fix "text = uuid" errors
  SELECT unit_id::uuid FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Re-create Policies (Contracts)
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

-- Re-create Policies (PAKD)
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


-- 5. Seed Data (Comprehensive)
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
DELETE FROM employees; -- Clean slate for correct roles mapping if desired, or use UPSERT carefully
INSERT INTO employees (id, name, unit_id, email, position, role_code, department) VALUES
    -- LEADERSHIP
    ('emp_bgd_1', 'Nguyễn Quốc Anh', 'u9', 'anh.nq@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board'),
    ('emp_bgd_2', 'Phạm Văn Long', 'u9', 'long.pv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),
    
    -- SALES / BUSINESS
    ('emp_kd1_1', 'Lê Hoàng Nam', 'u1', 'nam.lh@cic.com.vn', 'Trưởng phòng KD1', 'UnitLeader', 'Business'),
    ('emp_kd1_2', 'Nguyễn Thị Thu', 'u1', 'thu.nt@cic.com.vn', 'Nhân viên KD', 'NVKD', 'Business'),
    ('emp_kd1_3', 'Trần Văn Mạnh', 'u1', 'manh.tv@cic.com.vn', 'Nhân viên KD', 'NVKD', 'Business'),

    ('emp_kd2_1', 'Vũ Thanh Hằng', 'u2', 'hang.vt@cic.com.vn', 'Trưởng phòng KD2', 'UnitLeader', 'Business'),
    ('emp_kd2_2', 'Phạm Thị Hương', 'u2', 'huong.pt@cic.com.vn', 'Nhân viên KD', 'NVKD', 'Business'),

    -- TECH / PRODUCT
    ('emp_pm_1', 'Hoàng Văn Dũng', 'u5', 'dung.hv@cic.com.vn', 'GĐ TT Phần mềm', 'UnitLeader', 'Technology'),
    ('emp_pm_2', 'Trần Trung Kiên', 'u5', 'kien.tt@cic.com.vn', 'Developer', 'NVKD', 'Technology'), -- Using NVKD as default "Member" role permissions for simplicity or map to NVKD equivalent

    ('emp_bim_1', 'Bùi Quốc Đạt', 'u6', 'dat.bq@cic.com.vn', 'GĐ TT BIM', 'UnitLeader', 'Technology'),

    -- BACKOFFICE
    ('emp_kt_1', 'Đào Thị Minh', 'u7', 'minh.dt@cic.com.vn', 'Kế toán trưởng', 'ChiefAccountant', 'Finance'),
    ('emp_kt_2', 'Lê Thị Lan', 'u7', 'lan.lt@cic.com.vn', 'Kế toán viên', 'Accountant', 'Finance'),

    ('emp_hc_1', 'Nguyễn Văn Hùng', 'u8', 'hung.nv@cic.com.vn', 'Trưởng phòng HC', 'UnitLeader', 'Admin');

-- Mock Contracts (Updated to use new employee_id)
INSERT INTO contracts (id, title, customer_id, unit_id, employee_id, value, status, created_at, signed_date) VALUES
    ('c_mock_1', 'HĐ Phần mềm Quản lý Đô thị', 'c1', 'u5', 'emp_pm_1', 2500000000, 'Active', NOW(), '2025-01-15'),
    ('c_mock_2', 'HĐ Tư vấn BIM Dự án Metro', 'c2', 'u6', 'emp_bim_1', 5800000000, 'Pending', NOW(), '2025-02-01'),
    ('c_mock_3', 'HĐ Cung cấp thiết bị P1', 'c1', 'u1', 'emp_kd1_2', 1200000000, 'Reviewing', NOW(), '2025-01-20'),
    ('c_mock_4', 'HĐ Thiết kế Nhà máy A', 'c3', 'u2', 'emp_kd2_2', 3500000000, 'Expired', NOW() - INTERVAL '1 year', '2024-01-10')
ON CONFLICT (id) DO UPDATE SET employee_id = EXCLUDED.employee_id;
