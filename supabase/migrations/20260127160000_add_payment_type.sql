
-- Add payment_type column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'Revenue';

-- Update existing records to have a default value
UPDATE payments SET payment_type = 'Revenue' WHERE payment_type IS NULL;
