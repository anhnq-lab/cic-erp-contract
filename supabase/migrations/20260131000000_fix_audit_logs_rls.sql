-- Fix duplicate audit logs by ensuring only ONE trigger exists on contracts
-- Drop ALL existing audit triggers and recreate a single one

-- Drop all possible audit triggers on contracts
DROP TRIGGER IF EXISTS audit_contracts_trigger ON contracts;
DROP TRIGGER IF EXISTS contracts_audit_trigger ON contracts;
DROP TRIGGER IF EXISTS audit_log_trigger ON contracts;
DROP TRIGGER IF EXISTS log_contract_changes ON contracts;
DROP TRIGGER IF EXISTS track_contract_changes ON contracts;

-- Recreate the single audit trigger
CREATE TRIGGER audit_contracts_trigger
AFTER INSERT OR UPDATE OR DELETE ON contracts
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- Also cleanup duplicates in audit_logs table (keep only oldest entry for each duplicate)
-- This query identifies duplicates and keeps the first one
DELETE FROM audit_logs a
USING audit_logs b
WHERE a.id > b.id
  AND a.table_name = b.table_name
  AND a.record_id = b.record_id
  AND a.action = b.action
  AND a.created_at = b.created_at;
