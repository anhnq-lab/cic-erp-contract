-- Migration: 20260129193000_fix_org_structure_nuclear.sql
-- Description: NUCLEAR FIX for Organization Structure.
-- Solves "violates foreign key constraint sales_people_unit_id_fkey" error.
-- 1. Drops legacy constraints preventing deletion.
-- 2. Wipes data in correct order (Employees -> Units).
-- 3. Re-seeds full structure.
-- 4. Restores valid constraints.

-- ==========================================
-- 1. NUCLEAR CLEANUP (Fixes FK Errors)
-- ==========================================

-- Drop ALL potential FK constraints on unit_id to allow clean deletion
ALTER TABLE employees DROP CONSTRAINT IF EXISTS sales_people_unit_id_fkey;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_unit_id_fkey;

-- Unlink Contracts first
UPDATE contracts SET employee_id = NULL;

-- DELETE Employees (Children) FIRST
DELETE FROM employees;

-- DELETE Old Fake Units (Parents) NEXT
DELETE FROM units WHERE id LIKE 'u%';

-- ==========================================
-- 2. INSERT CORRECT STRUCTURE
-- ==========================================

-- Insert Correct Units
INSERT INTO units (id, code, name, type, target) VALUES
    ('bim', 'BIM', 'Trung tâm BIM', 'Business', 25000000000),
    ('css', 'CSS', 'Trung tâm CSS', 'Business', 40000000000),
    ('dcs', 'DCS', 'Trung tâm DCS', 'Business', 45000000000),
    ('hcm', 'HCM', 'Chi nhánh TP.HCM', 'Branch', 30000000000),
    ('pmxd', 'PMXD', 'Trung tâm PMXD', 'Business', 30000000000),
    ('stc', 'STC', 'Trung tâm STC', 'Business', 35000000000),
    ('tvda', 'TVDA', 'Trung tâm TVDA', 'Business', 25000000000),
    ('tvtk', 'TVTK', 'Trung tâm TVTK', 'Business', 20000000000),
    ('hcns', 'HCNS', 'Phòng Tổng hợp', 'BackOffice', 0),    -- Integrated Admin/HR/Legal
    ('tckt', 'TCKT', 'Phòng Tài chính Kế toán', 'BackOffice', 0)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type;

-- Remap contracts to new Unit IDs (Catch-all for safety)
UPDATE contracts SET unit_id = 'pmxd' WHERE unit_id = 'u5';
UPDATE contracts SET unit_id = 'bim' WHERE unit_id = 'u6';
UPDATE contracts SET unit_id = 'hcm' WHERE unit_id = 'u12';
UPDATE contracts SET unit_id = 'tvda' WHERE unit_id = 'u11';
UPDATE contracts SET unit_id = 'stc' WHERE unit_id IN ('u1', 'u2', 'u8', 'u10', 'u9', 'u7');


-- ==========================================
-- 3. EMPLOYEES SEEDING (Full Roster)
-- ==========================================

INSERT INTO employees (id, name, unit_id, email, position, role_code, department) VALUES
    -- === BAN LÃNH ĐẠO ===
    (gen_random_uuid(), 'Nguyễn Quốc Anh', 'hcns', 'anh.nq@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid(), 'Phạm Văn Long', 'hcns', 'long.pv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid(), 'Trần Văn Phó', 'hcns', 'pho.tv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),

    -- === BACK OFFICE ===
    (gen_random_uuid(), 'Nguyễn Văn Hùng', 'hcns', 'hung.nv@cic.com.vn', 'Trưởng phòng HCNS', 'UnitLeader', 'Admin'),
    (gen_random_uuid(), 'Lê Thị Luật', 'hcns', 'luat.lt@cic.com.vn', 'Chuyên viên Pháp chế', 'Legal', 'Legal'),
    (gen_random_uuid(), 'Đào Thị Minh', 'tckt', 'minh.dt@cic.com.vn', 'Kế toán trưởng', 'ChiefAccountant', 'Finance'),
    (gen_random_uuid(), 'Hoàng Thị Thu', 'tckt', 'thu.ht@cic.com.vn', 'Kế toán viên', 'Accountant', 'Finance'),

    -- === 1. Trung tâm BIM ===
    (gen_random_uuid(), 'Bùi Quốc Đạt', 'bim', 'dat.bq@cic.com.vn', 'Giám đốc TT BIM', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Nguyễn Văn Sale BIM1', 'bim', 'sale.bim1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Lê Thị Sale BIM2', 'bim', 'sale.bim2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),

    -- === 2. Trung tâm CSS ===
    (gen_random_uuid(), 'Vũ Văn CSS', 'css', 'vu.css@cic.com.vn', 'Giám đốc TT CSS', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Trần Sale CSS1', 'css', 'sale.css1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Phạm Sale CSS2', 'css', 'sale.css2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),

    -- === 3. Trung tâm DCS ===
    (gen_random_uuid(), 'Hoàng DCS', 'dcs', 'hoang.dcs@cic.com.vn', 'Giám đốc TT DCS', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Mai Sale DCS1', 'dcs', 'sale.dcs1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Đặng Sale DCS2', 'dcs', 'sale.dcs2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),

    -- === 4. Chi nhánh HCM ===
    (gen_random_uuid(), 'Lê Văn Nam', 'hcm', 'nam.lv@cic.com.vn', 'Giám đốc CN HCM', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Ngô Sale HCM1', 'hcm', 'sale.hcm1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Trương Sale HCM2', 'hcm', 'sale.hcm2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),

    -- === 5. Trung tâm PMXD ===
    (gen_random_uuid(), 'Hoàng Văn Dũng', 'pmxd', 'dung.hv@cic.com.vn', 'Giám đốc TT PMXD', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Vũ Sale PM1', 'pmxd', 'sale.pm1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Đỗ Sale PM2', 'pmxd', 'sale.pm2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),

    -- === 6. Trung tâm STC ===
    (gen_random_uuid(), 'Trần Văn STC', 'stc', 'tran.stc@cic.com.vn', 'Giám đốc TT STC', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Lý Sale STC1', 'stc', 'sale.stc1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Hồ Sale STC2', 'stc', 'sale.stc2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),

    -- === 7. Trung tâm TVDA ===
    (gen_random_uuid(), 'Nguyễn TVDA', 'tvda', 'nguyen.tvda@cic.com.vn', 'Giám đốc TT TVDA', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Phan Sale TVDA1', 'tvda', 'sale.tvda1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Bùi Sale TVDA2', 'tvda', 'sale.tvda2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),

    -- === 8. Trung tâm TVTK ===
    (gen_random_uuid(), 'Lê TVTK', 'tvtk', 'le.tvtk@cic.com.vn', 'Giám đốc TT TVTK', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Đặng Sale TVTK1', 'tvtk', 'sale.tvtk1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Võ Sale TVTK2', 'tvtk', 'sale.tvtk2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business');


-- ==========================================
-- 4. CLEANUP & RESTORE CONSTRAINTS
-- ==========================================

-- Assign random contracts to new staff to ensure visibility
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

-- Restore FK with correct name
ALTER TABLE employees 
    ADD CONSTRAINT employees_unit_id_fkey 
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
