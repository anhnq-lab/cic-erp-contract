-- Migration: Add Audit Triggers
-- Description: Create generic trigger function and apply to core tables

-- 1. Create Generic Trigger Function
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_user_id UUID;
    v_action TEXT;
BEGIN
    -- Attempt to get user_id from auth.uid()
    -- Note: In some triggers contexts auth.uid() might be null if not triggered by API call, 
    -- but for Supabase API interactions it works.
    v_user_id := auth.uid();
    
    IF (TG_OP = 'INSERT') THEN
        v_action := 'INSERT';
        v_new_data := to_jsonb(NEW);
        v_old_data := NULL;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_action := 'UPDATE';
        v_new_data := to_jsonb(NEW);
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'DELETE') THEN
        v_action := 'DELETE';
        v_new_data := NULL;
        v_old_data := to_jsonb(OLD);
    END IF;

    INSERT INTO audit_logs (
        user_id,
        table_name,
        record_id,
        action,
        old_data,
        new_data
    )
    VALUES (
        v_user_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id), -- Handle DELETE case where NEW is null
        v_action,
        v_old_data,
        v_new_data
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Apply Triggers to Contracts
DROP TRIGGER IF EXISTS audit_contracts_trigger ON contracts;
CREATE TRIGGER audit_contracts_trigger
AFTER INSERT OR UPDATE OR DELETE ON contracts
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 3. Apply Triggers to Payments
DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
CREATE TRIGGER audit_payments_trigger
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 4. Apply Triggers to Contract Business Plans (PAKD)
DROP TRIGGER IF EXISTS audit_pakd_trigger ON contract_business_plans;
CREATE TRIGGER audit_pakd_trigger
AFTER INSERT OR UPDATE OR DELETE ON contract_business_plans
FOR EACH ROW EXECUTE FUNCTION process_audit_log();
