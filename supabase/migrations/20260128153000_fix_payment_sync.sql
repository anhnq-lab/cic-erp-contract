-- 1. FIX DATA: Update paid_amount to amount if status is 'Tiền về'/'Paid' but paid_amount is 0
UPDATE payments
SET paid_amount = amount
WHERE status IN ('Tiền về', 'Paid') 
  AND (paid_amount IS NULL OR paid_amount = 0);

-- 2. FUNCTION: Calculate Totals and Update Contract
CREATE OR REPLACE FUNCTION update_contract_financials()
RETURNS TRIGGER AS $$
DECLARE
    target_contract_id UUID;
    total_rev NUMERIC(15, 2);
    total_exp NUMERIC(15, 2);
    total_invoiced NUMERIC(15, 2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_contract_id := OLD.contract_id;
    ELSE
        target_contract_id := NEW.contract_id;
    END IF;

    -- Calculate Revenue (Sum of paid_amount for Revenue payments)
    SELECT COALESCE(SUM(paid_amount), 0)
    INTO total_rev
    FROM payments
    WHERE contract_id = target_contract_id
    AND (payment_type IS NULL OR payment_type = 'Revenue');

    -- Calculate Cost (Sum of paid_amount for Expense payments)
    SELECT COALESCE(SUM(paid_amount), 0)
    INTO total_exp
    FROM payments
    WHERE contract_id = target_contract_id
    AND payment_type = 'Expense';

    -- Update Contract
    UPDATE contracts
    SET 
        actual_revenue = total_rev,
        actual_cost = total_exp
    WHERE id = target_contract_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. TRIGGER: Attach to payments table
DROP TRIGGER IF EXISTS trigger_update_contract_financials ON payments;

CREATE TRIGGER trigger_update_contract_financials
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_contract_financials();

-- 4. SYNC: Recalculate all contracts right now
WITH contract_stats AS (
    SELECT 
        contract_id,
        SUM(CASE WHEN (payment_type IS NULL OR payment_type = 'Revenue') THEN paid_amount ELSE 0 END) as rev,
        SUM(CASE WHEN payment_type = 'Expense' THEN paid_amount ELSE 0 END) as exp
    FROM payments
    GROUP BY contract_id
)
UPDATE contracts c
SET 
  actual_revenue = cs.rev,
  actual_cost = cs.exp
FROM contract_stats cs
WHERE c.id = cs.contract_id;
