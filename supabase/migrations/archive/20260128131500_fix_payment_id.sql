-- Fix: Set default value for payments.id to gen_random_uuid()
-- This prevents "null value in column id" error when inserting/creating payments without an explicit ID.

ALTER TABLE payments ALTER COLUMN id SET DEFAULT gen_random_uuid();
