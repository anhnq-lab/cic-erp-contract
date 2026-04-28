-- Migration: 20260129183000_finalize_organization.sql
-- Description: Finalizes organization structure per user request:
-- 1. Legal belongs to Admin/HR (No separate Legal Unit).
-- 2. Full Leadership for ALL Centers & Branches.
-- 3. Each Center/Branch has 2 Sales Staff.

-- ==========================================
-- 1. UNITS SETUP
-- ==========================================

-- Standardize Unit Names and Add Missing Ones
INSERT INTO units (id, code, name, type, target) VALUES
    ('u5', 'PM', 'Trung tâm Phần mềm', 'Business', 30000000000),
    ('u6', 'BIM', 'Trung tâm BIM', 'Business', 20000000000),
    ('u11', 'HT', 'Trung tâm Hạ tầng', 'Engineering', 15000000000),
    ('u12', 'CNHCM', 'Chi nhánh TP.HCM', 'Business', 25000000000),
    ('u8', 'HCNS', 'Phòng Hành chính - Nhân sự', 'BackOffice', 0) -- Renamed/Ensured
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Remove temporary u10 (Legal) if created previously, moving contacts if any
-- (In development we just wipe, but let's be safe)
UPDATE employees SET unit_id = 'u8' WHERE unit_id = 'u10'; 
DELETE FROM units WHERE id = 'u10'; 


-- ==========================================
-- 2. EMPLOYEES SEEDING (Full Roster)
-- ==========================================

-- Clear existing to ensure clean slate (Nuclear option for dev)
UPDATE contracts SET employee_id = NULL;
DELETE FROM employees;

INSERT INTO employees (id, name, unit_id, email, position, role_code, department) VALUES
    -- === BOARD OF DIRECTORS (u9) ===
    (gen_random_uuid(), 'Nguyễn Quốc Anh', 'u9', 'anh.nq@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid(), 'Phạm Văn Long', 'u9', 'long.pv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),

    -- === ADMIN / HR / LEGAL (u8) ===
    (gen_random_uuid(), 'Nguyễn Văn Hùng', 'u8', 'hung.nv@cic.com.vn', 'Trưởng phòng HCNS', 'UnitLeader', 'Admin'),
    (gen_random_uuid(), 'Lê Thị Luật', 'u8', 'luat.lt@cic.com.vn', 'Chuyên viên Pháp chế', 'Legal', 'Legal'), -- Legal in HR

    -- === FINANCE (u7) ===
    (gen_random_uuid(), 'Đào Thị Minh', 'u7', 'minh.dt@cic.com.vn', 'Kế toán trưởng', 'ChiefAccountant', 'Finance'),

    -- === TT PHẦN MỀM (u5) ===
    (gen_random_uuid(), 'Hoàng Văn Dũng', 'u5', 'dung.hv@cic.com.vn', 'Giám đốc TTPM', 'UnitLeader', 'Technology'),
    (gen_random_uuid(), 'Trần Thị Sale PM1', 'u5', 'sale.pm1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Technology'),
    (gen_random_uuid(), 'Lê Văn Sale PM2', 'u5', 'sale.pm2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Technology'),

    -- === TT BIM (u6) ===
    (gen_random_uuid(), 'Bùi Quốc Đạt', 'u6', 'dat.bq@cic.com.vn', 'Giám đốc TTBIM', 'UnitLeader', 'Technology'),
    (gen_random_uuid(), 'Phạm Thị Sale BIM1', 'u6', 'sale.bim1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Technology'),
    (gen_random_uuid(), 'Vũ Văn Sale BIM2', 'u6', 'sale.bim2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Technology'),

    -- === TT HẠ TẦNG (u11) ===
    (gen_random_uuid(), 'Trần Văn Tầng', 'u11', 'tang.tv@cic.com.vn', 'Giám đốc TTHT', 'UnitLeader', 'Engineering'),
    (gen_random_uuid(), 'Ngô Thị Sale HT1', 'u11', 'sale.ht1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Engineering'),
    (gen_random_uuid(), 'Đặng Văn Sale HT2', 'u11', 'sale.ht2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Engineering'),

    -- === CHI NHÁNH HCM (u12) ===
    (gen_random_uuid(), 'Lê Văn Nam', 'u12', 'nam.lv@cic.com.vn', 'Giám đốc CN HCM', 'UnitLeader', 'Business'),
    (gen_random_uuid(), 'Hoàng Thị Sale HCM1', 'u12', 'sale.hcm1@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business'),
    (gen_random_uuid(), 'Trương Văn Sale HCM2', 'u12', 'sale.hcm2@cic.com.vn', 'Chuyên viên KD', 'NVKD', 'Business');


-- ==========================================
-- 3. LINK CONTRACTS
-- ==========================================
DO $$
DECLARE
    emp_pm_lead uuid;
    emp_bim_lead uuid;
BEGIN
    SELECT id INTO emp_pm_lead FROM employees WHERE email = 'dung.hv@cic.com.vn' LIMIT 1;
    SELECT id INTO emp_bim_lead FROM employees WHERE email = 'dat.bq@cic.com.vn' LIMIT 1;

    -- Link PM contracts
    UPDATE contracts SET employee_id = emp_pm_lead 
    WHERE unit_id = 'u5' OR title LIKE '%Phần mềm%';

    -- Link BIM contracts
    UPDATE contracts SET employee_id = emp_bim_lead 
    WHERE unit_id = 'u6' OR title LIKE '%BIM%';

END $$;
