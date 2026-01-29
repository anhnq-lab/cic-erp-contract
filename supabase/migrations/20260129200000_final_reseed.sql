-- CRITICAL FIX: Re-seed all data with correct Types and FKs
-- 1. Disable triggers/FKs temporarily if needed (or just delete in order)
-- 2. Ensure Units exist
-- 3. Populate Employees (Board, BackOffice, Units)

BEGIN;

-- 1. DELETE existing employees (Contract links might block this, so we handle contracts first if needed. 
-- For now, allow CASCADE if set, otherwise un-link contracts)
UPDATE contracts SET salesperson_id = NULL, unit_id = NULL; 
DELETE FROM employees;
-- Ensure Units are correct (upsert)
INSERT INTO units (id, name, code, type) VALUES
('bim', 'Trung tâm BIM', 'BIM', 'Center'),
('css', 'Trung tâm CSS', 'CSS', 'Center'),
('dcs', 'Trung tâm DCS', 'DCS', 'Center'),
('hcm', 'Chi nhánh HCM', 'HCM', 'Branch'),
('pmxd', 'Trung tâm PMXD', 'PMXD', 'Center'),
('stc', 'Trung tâm STC', 'STC', 'Center'),
('tvda', 'Trung tâm TVDA', 'TVDA', 'Center'),
('tvtk', 'Trung tâm TVTK', 'TVTK', 'Center'),
('hcns', 'Phòng HCNS', 'HCNS', 'Company'),
('tckt', 'Phòng TCKT', 'TCKT', 'Company')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Seed BOARD OF DIRECTORS
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Hoàng Hà', 'hoangha@cic.com.vn', 'hcns', 'Leadership', 'Tổng Giám đốc', true, '{"signing":0, "revenue":0}'),
(gen_random_uuid(), 'Trần Lâm Hùng', 'hungtl@cic.com.vn', 'hcns', 'Leadership', 'Phó Tổng Giám đốc', true, '{"signing":0, "revenue":0}'),
(gen_random_uuid(), 'Nguyễn Quốc Anh', 'anhnq@cic.com.vn', 'hcns', 'Leadership', 'Quản trị viên', false, '{"signing":0, "revenue":0}');

-- 3. Seed BACKOFFICE
INSERT INTO employees (id, name, email, unit_id, role_code, position, target) VALUES
(gen_random_uuid(), 'Nguyễn Thị Thu', 'thu.nguyen@cic.com.vn', 'hcns', 'Support', 'Trưởng phòng HCNS', '{"signing":0, "revenue":0}'),
(gen_random_uuid(), 'Phạm Tuấn Anh', 'tuananh@cic.com.vn', 'tckt', 'ChiefAccountant', 'Kế toán trưởng', '{"signing":0, "revenue":0}');

-- 4. Seed UNITS (Director + 2 Sales each)
-- BIM
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Nguyễn Thành Luân', 'luannt@cic.com.vn', 'bim', 'UnitLeader', 'Giám đốc TT BIM', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'BIM Sales 1', 'bim.sales1@cic.com.vn', 'bim', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'BIM Sales 2', 'bim.sales2@cic.com.vn', 'bim', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');

-- CSS
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Nguyễn Văn Mạnh', 'manhnv@cic.com.vn', 'css', 'UnitLeader', 'Giám đốc TT CSS', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'CSS Sales 1', 'css.sales1@cic.com.vn', 'css', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'CSS Sales 2', 'css.sales2@cic.com.vn', 'css', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');

-- DCS
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Lê Xuân Hoàng', 'hoanglx@cic.com.vn', 'dcs', 'UnitLeader', 'Giám đốc TT DCS', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'DCS Sales 1', 'dcs.sales1@cic.com.vn', 'dcs', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'DCS Sales 2', 'dcs.sales2@cic.com.vn', 'dcs', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');

-- HCM
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Phạm Minh Toàn', 'toanpm@cic.com.vn', 'hcm', 'UnitLeader', 'Giám đốc CN HCM', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'HCM Sales 1', 'hcm.sales1@cic.com.vn', 'hcm', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'HCM Sales 2', 'hcm.sales2@cic.com.vn', 'hcm', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');

-- PMXD
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Đặng Đức Nam', 'namdd@cic.com.vn', 'pmxd', 'UnitLeader', 'Giám đốc TT PMXD', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'PMXD Sales 1', 'pmxd.sales1@cic.com.vn', 'pmxd', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'PMXD Sales 2', 'pmxd.sales2@cic.com.vn', 'pmxd', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');

-- STC
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Vũ Anh Tuấn', 'tuanva@cic.com.vn', 'stc', 'UnitLeader', 'Giám đốc TT STC', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'STC Sales 1', 'stc.sales1@cic.com.vn', 'stc', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'STC Sales 2', 'stc.sales2@cic.com.vn', 'stc', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');

-- TVDA
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Nguyễn Văn A', 'anv@cic.com.vn', 'tvda', 'UnitLeader', 'Giám đốc TT TVDA', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'TVDA Sales 1', 'tvda.sales1@cic.com.vn', 'tvda', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'TVDA Sales 2', 'tvda.sales2@cic.com.vn', 'tvda', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');

-- TVTK
INSERT INTO employees (id, name, email, unit_id, role_code, position, is_director, target) VALUES
(gen_random_uuid(), 'Trần Văn B', 'btv@cic.com.vn', 'tvtk', 'UnitLeader', 'Giám đốc TT TVTK', true, '{"signing":5000000000, "revenue":3000000000}'),
(gen_random_uuid(), 'TVTK Sales 1', 'tvtk.sales1@cic.com.vn', 'tvtk', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}'),
(gen_random_uuid(), 'TVTK Sales 2', 'tvtk.sales2@cic.com.vn', 'tvtk', 'NVKD', 'Chuyên viên KD', false, '{"signing":2000000000, "revenue":1000000000}');


-- 5. Fix RLS just in case (Redundant but safe)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Full Access" ON employees;
CREATE POLICY "Public Full Access" ON employees FOR ALL USING (true) WITH CHECK (true);

COMMIT;
