-- Cleanup duplicate RLS policies (Performance Advisory)
-- Keeping only the Dev_Allow_All_* policies for DEV mode
-- Applied: 2026-01-30

-- contracts: Remove duplicates, keep Dev_Allow_All_Contracts
DROP POLICY IF EXISTS "Allow All for Contracts" ON contracts;
DROP POLICY IF EXISTS "Allow all access to contracts" ON contracts;

-- customers: Remove duplicates
DROP POLICY IF EXISTS "Allow All for Customers" ON customers;
DROP POLICY IF EXISTS "Allow all access to customers" ON customers;

-- employees: Remove duplicates
DROP POLICY IF EXISTS "Allow All for Employees" ON employees;
DROP POLICY IF EXISTS "Allow all access to sales_people" ON employees;
DROP POLICY IF EXISTS "Public Full Access" ON employees;

-- payments: Remove duplicates
DROP POLICY IF EXISTS "Allow all access to payments" ON payments;

-- units: Remove duplicates, keep Dev_Allow_All_Units
DROP POLICY IF EXISTS "Allow All for Units" ON units;
DROP POLICY IF EXISTS "Allow all access to units" ON units;
DROP POLICY IF EXISTS "Allow public insert/update for seeding" ON units;
