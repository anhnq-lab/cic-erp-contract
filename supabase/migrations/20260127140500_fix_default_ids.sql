-- Enable pgcrypto if not already enabled (usually enabled by default in Supabase but good practice)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set default values for ID columns to gen_random_uuid() to prevent "null value in column id" errors
ALTER TABLE sales_people ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE customers ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE products ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE contracts ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- Units table might use custom IDs, but setting default doesn't hurt if we want to allow auto-gen later
ALTER TABLE units ALTER COLUMN id SET DEFAULT gen_random_uuid();
