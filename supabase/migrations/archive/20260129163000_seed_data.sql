-- Migration: 20260129163000_seed_data.sql
-- Description: Seed Units and Personnel for testing.

-- 1. Seed Units
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
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Seed Sales People (Mock Personnel for dropdowns)
-- Note: These are NOT login accounts (auth.users), but reference records for "Phụ trách"
INSERT INTO sales_people (id, name, unit_id, email, position, target) VALUES
    ('sp1', 'Nguyễn Thị Thu', 'u1', 'thu.nt@cic.com.vn', 'NVKD', 10000000000),
    ('sp2', 'Trần Văn Mạnh', 'u1', 'manh.tv@cic.com.vn', 'NVKD', 8000000000),
    ('sp3', 'Lê Hoàng Nam', 'u1', 'nam.lh@cic.com.vn', 'TP Kinh doanh', 15000000000),
    
    ('sp4', 'Phạm Thị Hương', 'u2', 'huong.pt@cic.com.vn', 'NVKD', 9000000000),
    ('sp5', 'Đỗ Minh Tuấn', 'u2', 'tuan.dm@cic.com.vn', 'NVKD', 8500000000),
    ('sp6', 'Vũ Thanh Hằng', 'u2', 'hang.vt@cic.com.vn', 'TP Kinh doanh', 14000000000),

    ('sp7', 'Hoàng Văn Dũng', 'u5', 'dung.hv@cic.com.vn', 'GĐ TT Phần mềm', 5000000000),
    ('sp8', 'Nguyễn Mai Anh', 'u5', 'anh.nm@cic.com.vn', 'NVKD Phần mềm', 4000000000),

    ('sp9', 'Bùi Quốc Đạt', 'u6', 'dat.bq@cic.com.vn', 'GĐ TT BIM', 6000000000)
ON CONFLICT (id) DO UPDATE SET 
    unit_id = EXCLUDED.unit_id,
    target = EXCLUDED.target;

-- 3. Seed Mock Contracts (Samples)
-- Ensuring we have some contracts for these units to test visibility
INSERT INTO contracts (id, title, customer_id, unit_id, salesperson_id, value, status, created_at, signed_date) VALUES
    ('c_mock_1', 'HĐ Phần mềm Quản lý Đô thị', 'c1', 'u5', 'sp7', 2500000000, 'Active', NOW(), '2025-01-15'),
    ('c_mock_2', 'HĐ Tư vấn BIM Dự án Metro', 'c2', 'u6', 'sp9', 5800000000, 'Pending', NOW(), '2025-02-01'),
    ('c_mock_3', 'HĐ Cung cấp thiết bị P1', 'c1', 'u1', 'sp1', 1200000000, 'Reviewing', NOW(), '2025-01-20'),
    ('c_mock_4', 'HĐ Thiết kế Nhà máy A', 'c3', 'u2', 'sp4', 3500000000, 'Expired', NOW() - INTERVAL '1 year', '2024-01-10')
ON CONFLICT (id) DO NOTHING;
