-- 1. Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Standardize ID generation (UUID v4)
-- Units (Some are manually seeded, so we default only if missing)
ALTER TABLE units ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Sales People
ALTER TABLE sales_people ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE sales_people ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Customers
ALTER TABLE customers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE customers ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Products
ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE products ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Contracts
ALTER TABLE contracts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contracts ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Payments (Already fixed, but ensuring consistency)
ALTER TABLE payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE payments ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

-- Contract Documents (Ensure consistency)
ALTER TABLE contract_documents ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Add Foreign Key Constraints (Safety)
-- Ensure deleting a Contract deletes its Documents
ALTER TABLE contract_documents 
DROP CONSTRAINT IF EXISTS contract_documents_contract_id_fkey,
ADD CONSTRAINT contract_documents_contract_id_fkey 
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;

-- Ensure deleting a Contract deletes its Payments
ALTER TABLE payments
DROP CONSTRAINT IF EXISTS payments_contract_id_fkey,
ADD CONSTRAINT payments_contract_id_fkey
FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE;
