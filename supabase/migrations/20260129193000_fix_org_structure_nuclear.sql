-- Migration: 20260129193000_fix_org_structure_nuclear.sql
-- Description: NUCLEAR FIX for Organization Structure.
-- 1. Drops ALL constraints to allow free movement.
-- 2. Inserts NEW Units.
-- 3. Moves Contracts to NEW Units.
-- 4. Deletes OLD Units.
-- 5. Seeds Employees.
-- 6. Re-links Contracts.
-- 7. Restores Constraints.

-- ==========================================
-- 1. DROP CONSTRAINTS (The Key Fix)
-- ==========================================

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_unit_id_fkey;
ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_employee_id_fkey;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS sales_people_unit_id_fkey;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_unit_id_fkey;

-- Unlink Contracts from Employees (to allow Employee deletion)
UPDATE contracts SET employee_id = NULL;

-- ==========================================
-- 2. WIPE OLD PERSONNEL
-- ==========================================
DELETE FROM employees;

-- ==========================================
-- 3. SETUP NEW UNITS (Insert First)
-- ==========================================
INSERT INTO units (id, code, name, type, target) VALUES
    ('bim', 'BIM', 'Trung tâm BIM', 'Business', 25000000000),
    ('css', 'CSS', 'Trung tâm CSS', 'Business', 40000000000),
    ('dcs', 'DCS', 'Trung tâm DCS', 'Business', 45000000000),
    ('hcm', 'HCM', 'Chi nhánh TP.HCM', 'Branch', 30000000000),
    ('pmxd', 'PMXD', 'Trung tâm PMXD', 'Business', 30000000000),
    ('stc', 'STC', 'Trung tâm STC', 'Business', 35000000000),
    ('tvda', 'TVDA', 'Trung tâm TVDA', 'Business', 25000000000),
    ('tvtk', 'TVTK', 'Trung tâm TVTK', 'Business', 20000000000),
    ('hcns', 'HCNS', 'Phòng Tổng hợp', 'BackOffice', 0),
    ('tckt', 'TCKT', 'Phòng Tài chính Kế toán', 'BackOffice', 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type;

-- ==========================================
-- 4. MIGRATE CONTRACTS (Move to New Units)
-- ==========================================
-- Map old IDs to New IDs
UPDATE contracts SET unit_id = 'pmxd' WHERE unit_id = 'u5';
UPDATE contracts SET unit_id = 'bim' WHERE unit_id = 'u6';
UPDATE contracts SET unit_id = 'hcm' WHERE unit_id = 'u12';
UPDATE contracts SET unit_id = 'tvda' WHERE unit_id = 'u11';
-- Catch-all for any other legacy/dev IDs -> STC
UPDATE contracts SET unit_id = 'stc' WHERE unit_id NOT IN ('bim', 'css', 'dcs', 'hcm', 'pmxd', 'stc', 'tvda', 'tvtk', 'hcns', 'tckt');

-- ==========================================
-- 5. DELETE OLD UNITS
-- ==========================================
DELETE FROM units WHERE id LIKE 'u%';


-- ==========================================
-- 6. SEED EMPLOYEES (Full Roster)
-- ==========================================
INSERT INTO employees (id, name, unit_id, email, position, role_code, department) VALUES
    -- BOARD
    (gen_random_uuid(), 'Nguyễn Quốc Anh', 'hcns', 'anh.nq@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid(), 'Phạm Văn Long', 'hcns', 'long.pv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid(), 'Trần Văn Phó', 'hcns', 'pho.tv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),

    -- BACKOFFICE
    (gen_random_uuid(), 'Nguyễn Văn Hùng', 'hcns', 'hung.nv@cic.com.vn', 'Trưởng phòng HCNS', 'UnitLeader', 'Admin'),
    (gen_random_uuid(), 'Lê Thị Luật', 'hcns', 'luat.lt@cic.com.vn', 'Chuyên viên Pháp chế', 'Legal', 'Legal'),
    (gen_random_uuid(), 'Đào Thị Minh', 'tckt', 'minh.dt@cic.com.vn', 'Kế toán trưởng', 'ChiefAccountant', 'Finance'),
    (gen_random_uuid(), 'Hoàng Thị Thu', 'tckt', 'thu.ht@cic.com.vn', 'Kế toán viên', 'Accountant', 'Finance'),

    -- BUSINESS UNITS
    -- BIM
    (gen_random_uuid(), 'Bùi Quốc Đạt', 'bim', 'dat.bq@cic.com.vn', 'Giám đốc TT BIM', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Nguyễn Văn Sale BIM1', 'bim', 'sale.bim1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Lê Thị Sale BIM2', 'bim', 'sale.bim2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    -- CSS
    (gen_random_uuid(), 'Vũ Văn CSS', 'css', 'vu.css@cic.com.vn', 'Giám đốc TT CSS', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Trần Sale CSS1', 'css', 'sale.css1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Phạm Sale CSS2', 'css', 'sale.css2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    -- DCS
    (gen_random_uuid(), 'Hoàng DCS', 'dcs', 'hoang.dcs@cic.com.vn', 'Giám đốc TT DCS', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Mai Sale DCS1', 'dcs', 'sale.dcs1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Đặng Sale DCS2', 'dcs', 'sale.dcs2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    -- HCM
    (gen_random_uuid(), 'Lê Văn Nam', 'hcm', 'nam.lv@cic.com.vn', 'Giám đốc CN HCM', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Ngô Sale HCM1', 'hcm', 'sale.hcm1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Trương Sale HCM2', 'hcm', 'sale.hcm2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    -- PMXD
    (gen_random_uuid(), 'Hoàng Văn Dũng', 'pmxd', 'dung.hv@cic.com.vn', 'Giám đốc TT PMXD', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Vũ Sale PM1', 'pmxd', 'sale.pm1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Đỗ Sale PM2', 'pmxd', 'sale.pm2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    -- STC
    (gen_random_uuid(), 'Trần Văn STC', 'stc', 'tran.stc@cic.com.vn', 'Giám đốc TT STC', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Lý Sale STC1', 'stc', 'sale.stc1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Hồ Sale STC2', 'stc', 'sale.stc2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    -- TVDA
    (gen_random_uuid(), 'Nguyễn TVDA', 'tvda', 'nguyen.tvda@cic.com.vn', 'Giám đốc TT TVDA', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Phan Sale TVDA1', 'tvda', 'sale.tvda1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Bùi Sale TVDA2', 'tvda', 'sale.tvda2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    -- TVTK
    (gen_random_uuid(), 'Lê TVTK', 'tvtk', 'le.tvtk@cic.com.vn', 'Giám đốc TT TVTK', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Đặng Sale TVTK1', 'tvtk', 'sale.tvtk1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Võ Sale TVTK2', 'tvtk', 'sale.tvtk2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business');

-- ==========================================
-- 7. RE-LINK CONTRACTS & RESTORE CONSTRAINTS
-- ==========================================
DO $$
DECLARE
    u_record RECORD;
    emp_lead uuid;
BEGIN
    FOR u_record IN SELECT id FROM units WHERE type = 'Business' OR type = 'Branch' LOOP
        SELECT id INTO emp_lead FROM employees WHERE unit_id = u_record.id AND role_code = 'UnitLeader' LIMIT 1;
        IF emp_lead IS NOT NULL THEN
            UPDATE contracts SET employee_id = emp_lead WHERE unit_id = u_record.id;
        END IF;
    END LOOP;
END $$;

ALTER TABLE contracts 
    ADD CONSTRAINT contracts_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

ALTER TABLE contracts 
    ADD CONSTRAINT contracts_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE employees 
    ADD CONSTRAINT employees_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
