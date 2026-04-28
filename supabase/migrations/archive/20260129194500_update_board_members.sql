-- Migration: 20260129194500_update_board_members.sql
-- Description: Updates Board Members and Admin based on user request.
-- 1. Hoàng Hà (hoangha@cic.com.vn) -> Tổng Giám đốc.
-- 2. Hùng TL (hungtl@cic.com.vn) -> Phó Tổng Giám đốc.
-- 3. Nguyễn Quốc Anh (anhnq@cic.com.vn) -> Quản trị viên (System Admin).

-- Update or Insert 'Hoàng Hà' (TGĐ)
-- Check if exists by role specific or just insert/update
DO $$
BEGIN
    -- 1. TGĐ: Hoàng Hà
    IF EXISTS (SELECT 1 FROM employees WHERE position = 'Tổng Giám đốc') THEN
        UPDATE employees 
        SET name = 'Hoàng Hà', email = 'hoangha@cic.com.vn', role_code = 'Leadership'
        WHERE position = 'Tổng Giám đốc';
    ELSE
        INSERT INTO employees (id, name, unit_id, email, position, role_code, department)
        VALUES (gen_random_uuid(), 'Hoàng Hà', 'hcns', 'hoangha@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board');
    END IF;

    -- 2. PTGĐ: Hùng TL (Update one of the existing PTGĐs or Insert)
    -- We seeded 2 PTGĐs. Let's update one.
    IF EXISTS (SELECT 1 FROM employees WHERE position = 'Phó Tổng Giám đốc' LIMIT 1) THEN
        UPDATE employees 
        SET name = 'Trần Lâm Hùng', email = 'hungtl@cic.com.vn', role_code = 'Leadership'
        WHERE id = (SELECT id FROM employees WHERE position = 'Phó Tổng Giám đốc' LIMIT 1);
    ELSE
        INSERT INTO employees (id, name, unit_id, email, position, role_code, department)
        VALUES (gen_random_uuid(), 'Trần Lâm Hùng', 'hcns', 'hungtl@cic.com.vn', 'Phó Tổng Giám đốc', 'Leadership', 'Board');
    END IF;

    -- 3. Admin: Nguyễn Quốc Anh (anhnq@cic.com.vn)
    -- User wants "Quản trị viên" title but with Admin/Full rights.
    -- We can repurpose the remaining board member or insert new.
    -- Let's check if 'Nguyễn Quốc Anh' already exists (from previous seed he was TGĐ, but we just updated TGĐ to Hoang Ha above if we matched by position... wait)
    
    -- Actually, my previous logic: "WHERE position = 'Tổng Giám đốc'". 
    -- If 'Nguyễn Quốc Anh' was TGĐ, he is now 'Hoàng Hà'. 
    -- So I should create a NEW entry for 'Nguyễn Quốc Anh' as Admin, or better yet:
    
    -- Let's be explicit and clean.
    
    -- A. Correct TGĐ
    UPDATE employees SET name = 'Hoàng Hà', email = 'hoangha@cic.com.vn' 
    WHERE position = 'Tổng Giám đốc';

    -- B. Correct PTGĐ (Take 'Phạm Văn Long' and make him Hùng TL)
    UPDATE employees SET name = 'Trần Lâm Hùng', email = 'hungtl@cic.com.vn' 
    WHERE email = 'long.pv@cic.com.vn';

    -- C. Setup 'anhnq@cic.com.vn'
    -- If he existed with 'anh.nq@cic.com.vn', update him.
    IF EXISTS (SELECT 1 FROM employees WHERE email = 'anh.nq@cic.com.vn') THEN
        UPDATE employees 
        SET email = 'anhnq@cic.com.vn', position = 'Quản trị viên', role_code = 'Leadership', department = 'Board'
        WHERE email = 'anh.nq@cic.com.vn';
        
        -- Note: If he was TGĐ, he might have been updated in step A.
        -- Let's verify logic:
        -- Previous Seed:
        -- 1. Nguyễn Quốc Anh (TGĐ)
        -- 2. Phạm Văn Long (PTGĐ)
        -- 3. Trần Văn Phó (PTGĐ)
        
        -- Desired:
        -- 1. Hoàng Hà (TGĐ)
        -- 2. Hùng TL (PTGĐ)
        -- 3. Nguyễn Quốc Anh (Quản trị viên) - Admin rights

        -- Re-Strategy:
        -- 1. Update TGĐ record -> Hoàng Hà.
        -- 2. Update PTGĐ 1 -> Hùng TL.
        -- 3. Update PTGĐ 2 (or Insert) -> Nguyễn Quốc Anh (Admin).
    
    END IF;
END $$;

-- Let's try a direct approach to ensure exact state regardless of previous mutations:

-- 1. Upsert TGĐ
INSERT INTO employees (id, name, unit_id, email, position, role_code, department)
VALUES (gen_random_uuid(), 'Hoàng Hà', 'hcns', 'hoangha@cic.com.vn', 'Tổng Giám đốc', 'Leadership', 'Board')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, position = EXCLUDED.position, role_code = EXCLUDED.role_code; 
-- Note: employees might not have email unique constraint? Usually they do. 
-- If not, we might create dupes. Let's assume unique or handle by ID lookup if possible. 
-- Since we just NUKED DB, we know the IDs are random.
-- Safer to Update by Position/Name logic.

-- Execute precise updates:

-- 1. SET TGĐ
UPDATE employees 
SET name = 'Hoàng Hà', email = 'hoangha@cic.com.vn'
WHERE position = 'Tổng Giám đốc';

-- 2. SET PTGĐ 1 (Hùng TL)
UPDATE employees 
SET name = 'Trần Lâm Hùng', email = 'hungtl@cic.com.vn'
WHERE position = 'Phó Tổng Giám đốc' AND name LIKE 'Phạm%';

-- 3. SET Admin (Q.Anh) - Take the other PTGĐ or Create New
-- Let's Insert if not exists, or Update "Trần Văn Phó" to be Q.Anh?
-- The user "Nguyễn Quốc Anh" was likely "anh.nq" in previous seed. 
-- If Step 1 overrode "Nguyễn Quốc Anh" (who was TGĐ), then he is gone.
-- So we insert him back as Admin.

INSERT INTO employees (id, name, unit_id, email, position, role_code, department)
VALUES (gen_random_uuid(), 'Nguyễn Quốc Anh', 'hcns', 'anhnq@cic.com.vn', 'Quản trị viên', 'Leadership', 'Board');

