-- Migration: Upgrade units table schema
-- 1. Add 'functions' column for "Chức năng nhiệm vụ"
-- 2. Convert 'target' from numeric to JSONB for full KPI Plan

-- 1. Add functions column
ALTER TABLE units ADD COLUMN IF NOT EXISTS "functions" TEXT;

-- 2. Convert target column
-- First, rename the old column to keep data safe temporarily
ALTER TABLE units RENAME COLUMN target TO target_old;

-- Create new JSONB column
ALTER TABLE units ADD COLUMN target JSONB DEFAULT '{"signing": 0, "revenue": 0, "adminProfit": 0, "revProfit": 0, "cash": 0}'::jsonb;

-- Migrate data: Use the old numeric value as 'signing' target (assuming that was the main metric)
UPDATE units 
SET target = jsonb_build_object(
    'signing', COALESCE(target_old, 0),
    'revenue', 0,
    'adminProfit', 0,
    'revProfit', 0,
    'cash', 0
);

-- Drop the old column
ALTER TABLE units DROP COLUMN target_old;

-- 3. Update RLS (Ensure new columns are accessible - usually handled by 'select *' policies but good to verify)
-- Existing policies are FOR ALL or SELECT *, so should be fine.
