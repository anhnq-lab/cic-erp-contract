-- Add columns for parallel approval workflow
-- Legal and Finance can approve independently

-- Add approval tracking columns to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS legal_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS finance_approved BOOLEAN DEFAULT FALSE;

-- Add new status value for Both_Approved state
-- Note: Existing statuses: Draft, Pending, Active, Expired, Terminated, Reviewing, Completed, Pending_Legal, Pending_Finance, Finance_Approved, Pending_Sign

-- Update status CHECK constraint if exists (PostgreSQL)
-- First check what values are valid, then add 'Pending_Review' and 'Both_Approved'

COMMENT ON COLUMN contracts.legal_approved IS 'Whether Legal has approved this contract (for parallel approval workflow)';
COMMENT ON COLUMN contracts.finance_approved IS 'Whether Finance has approved this contract (for parallel approval workflow)';

-- Create index for workflow queries
CREATE INDEX IF NOT EXISTS idx_contracts_parallel_approval 
ON contracts (status, legal_approved, finance_approved) 
WHERE status = 'Pending_Review';
