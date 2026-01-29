-- Migration: 20260129180000_enhance_personnel.sql
-- Description: Refines organization structure:
-- 1. Adds "Ban Pháp chế" (Legal).
-- 2. Removes "Phòng Kinh doanh" (Sales Dept) -> Sales staff now belong to Centers (TT PM, TT BIM).
-- 3. Adds Vice Directors and full Center leadership.

-- 1. Add New Units & Cleanup Old Units
-- Insert Legal Dept
INSERT INTO units (id, code, name, type, target) VALUES
    ('u10', 'PC', 'Ban Pháp chế', 'BackOffice', 0)
ON CONFLICT (id) DO NOTHING;

-- Move Contracts from Old Sales Units (u1, u2) to Centers (u5, u6) to allow deletion
-- Mapping: u1 (KD1) -> u5 (Software), u2 (KD2) -> u6 (BIM) for demo purposes
UPDATE contracts SET unit_id = 'u5' WHERE unit_id = 'u1';
UPDATE contracts SET unit_id = 'u6' WHERE unit_id = 'u2';

-- Delete Old Sales Units
DELETE FROM units WHERE id IN ('u1', 'u2');


-- 2. Wipe & Re-seed Employees (Full Roster)
-- Unlink contracts first (set employee_id null temporarily)
UPDATE contracts SET employee_id = NULL;
DELETE FROM employees;

INSERT INTO employees (id, name, unit_id, email, position, role_code, department) VALUES
    -- === BAN GIÁM ĐỐC (Board) ===
    (gen_random_uuid(), 'Nguyễn Quốc Anh', 'u9', 'anh.nq@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board'),
    (gen_random_uuid(), 'Phạm Văn Long', 'u9', 'long.pv@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board'),

    -- === BAN PHÁP CHẾ (Legal) ===
    (gen_random_uuid(), 'Lê Thị Luật', 'u10', 'luat.lt@cic.com.vn', 'Trưởng ban Pháp chế', 'Legal', 'Legal'),

    -- === TT PHẦN MỀM (u5) ===
    (gen_random_uuid(), 'Hoàng Văn Dũng', 'u5', 'dung.hv@cic.com.vn', 'GĐ TT Phần mềm', 'UnitLeader', 'Technology'), -- Unit Leader / Center Director
    (gen_random_uuid(), 'Nguyễn Thị Sale A', 'u5', 'sale.a@cic.com.vn', 'Chuyên viên Kinh doanh', 'NVKD', 'Technology'),
    (gen_random_uuid(), 'Trần Văn Dev', 'u5', 'dev.tv@cic.com.vn', 'Kỹ thuật viên', 'NVKD', 'Technology'), -- Using NVKD for basic staff access

    -- === TT BIM (u6) ===
    (gen_random_uuid(), 'Bùi Quốc Đạt', 'u6', 'dat.bq@cic.com.vn', 'GĐ TT BIM', 'UnitLeader', 'Technology'),
    (gen_random_uuid(), 'Phạm Văn Sale B', 'u6', 'sale.b@cic.com.vn', 'Chuyên viên Kinh doanh', 'NVKD', 'Technology'),

    -- === TÀI CHÍNH - KẾ TOÁN (u7) ===
    (gen_random_uuid(), 'Đào Thị Minh', 'u7', 'minh.dt@cic.com.vn', 'Kế toán trưởng', 'ChiefAccountant', 'Finance'),
    (gen_random_uuid(), 'Lê Thị Thu', 'u7', 'thu.lt@cic.com.vn', 'Kế toán viên', 'Accountant', 'Finance'),

    -- === HÀNH CHÍNH (u8) ===
    (gen_random_uuid(), 'Nguyễn Văn Hùng', 'u8', 'hung.nv@cic.com.vn', 'Trưởng phòng HC', 'UnitLeader', 'Admin');


-- 3. Re-link Contracts to New Employees
DO $$
DECLARE
    emp_pm_leads uuid;
    emp_bim_leads uuid;
    emp_sale_a uuid;
BEGIN
    -- Look up IDs
    SELECT id INTO emp_pm_leads FROM employees WHERE email = 'dung.hv@cic.com.vn' LIMIT 1;
    SELECT id INTO emp_bim_leads FROM employees WHERE email = 'dat.bq@cic.com.vn' LIMIT 1;
    SELECT id INTO emp_sale_a FROM employees WHERE email = 'sale.a@cic.com.vn' LIMIT 1;

    -- Update Contracts
    -- Contracts in u5 (Software)
    UPDATE contracts SET employee_id = emp_pm_leads 
    WHERE unit_id = 'u5' AND title LIKE '%Quản lý Đô thị%';

    -- Contracts in u6 (BIM)
    UPDATE contracts SET employee_id = emp_bim_leads 
    WHERE unit_id = 'u6';

    -- Remaining u5 contracts to Sales A
    UPDATE contracts SET employee_id = emp_sale_a 
    WHERE unit_id = 'u5' AND employee_id IS NULL;

END $$;
