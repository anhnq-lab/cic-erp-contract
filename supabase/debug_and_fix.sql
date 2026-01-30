-- =============================================
-- CIC ERP: DATABASE DEBUG & FIX SCRIPT
-- Chạy trong Supabase Dashboard > SQL Editor
-- =============================================

-- BƯỚC 1: Kiểm tra data tồn tại
SELECT '=== DATA CHECK ===' as step;
SELECT 'employees' as table_name, COUNT(*) as count FROM employees
UNION ALL
SELECT 'units', COUNT(*) FROM units
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'customers', COUNT(*) FROM customers;

-- BƯỚC 2: Kiểm tra RLS status
SELECT '=== RLS STATUS ===' as step;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('employees', 'units', 'contracts', 'profiles', 'customers', 'payments');

-- BƯỚC 3: Kiểm tra RLS policies
SELECT '=== RLS POLICIES ===' as step;
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================
-- NẾU DATA = 0 hoặc RLS = true NHƯNG KHÔNG CÓ POLICIES
-- CHẠY SCRIPT FIX BÊN DƯỚI
-- =============================================

-- BƯỚC 4: NUCLEAR FIX - Disable RLS hoàn toàn
-- UNCOMMENT các dòng dưới để chạy:

-- ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE units DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contracts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contract_business_plans DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contract_documents DISABLE ROW LEVEL SECURITY;

-- SELECT 'RLS DISABLED SUCCESSFULLY' as result;
