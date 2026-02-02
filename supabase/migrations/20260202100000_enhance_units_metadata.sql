-- Migration: Enhance units table with additional metadata columns
-- Adds: manager_id, logo_url, address, phone, email, description

-- 1. Add manager_id column (TEXT to match employees.id type)
ALTER TABLE units ADD COLUMN IF NOT EXISTS manager_id TEXT REFERENCES employees(id) ON DELETE SET NULL;

-- 2. Add logo_url for unit branding
ALTER TABLE units ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 3. Add contact information
ALTER TABLE units ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS email TEXT;

-- 4. Add description for detailed unit info
ALTER TABLE units ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Add parent_id for organizational hierarchy (org chart feature)
ALTER TABLE units ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES units(id) ON DELETE SET NULL;

-- 6. Add sort_order for display ordering
ALTER TABLE units ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 7. Add is_active flag
ALTER TABLE units ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 8. Add updated_at timestamp
ALTER TABLE units ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create index on parent_id for org chart queries
CREATE INDEX IF NOT EXISTS idx_units_parent_id ON units(parent_id);

-- Create index on manager_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_units_manager_id ON units(manager_id);

COMMENT ON COLUMN units.manager_id IS 'ID of the unit manager (references employees table)';
COMMENT ON COLUMN units.parent_id IS 'Parent unit ID for org chart hierarchy';
COMMENT ON COLUMN units.logo_url IS 'URL to unit logo/avatar image';
