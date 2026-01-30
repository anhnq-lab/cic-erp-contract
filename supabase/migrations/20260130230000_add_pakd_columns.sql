-- Add missing columns for PAKD enhancement
-- admin_costs: JSON for storing administrative costs breakdown
-- payment_phases: JSON for storing payment schedules (revenue + expense)

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS admin_costs JSONB DEFAULT '{}';

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS payment_phases JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN contracts.admin_costs IS 'Administrative costs: transferFee, contractorTax, importFee, expertHiring, documentProcessing';
COMMENT ON COLUMN contracts.payment_phases IS 'Payment schedules: array of {id, name, dueDate, amount, type: Revenue|Expense}';
