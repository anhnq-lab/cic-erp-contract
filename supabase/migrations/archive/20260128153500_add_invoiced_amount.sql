-- 1. SCHEMA: Add invoiced_amount to contracts
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS invoiced_amount NUMERIC(15, 2) DEFAULT 0;

-- 2. FUNCTION: Update Trigger to calculate Invoiced Amount
CREATE OR REPLACE FUNCTION update_contract_financials()
RETURNS TRIGGER AS $$
DECLARE
    target_contract_id UUID;
    total_rev NUMERIC(15, 2);
    total_exp NUMERIC(15, 2);
    total_inv NUMERIC(15, 2);
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_contract_id := OLD.contract_id;
    ELSE
        target_contract_id := NEW.contract_id;
    END IF;

    -- Calculate Revenue (Paid Amount)
    SELECT COALESCE(SUM(paid_amount), 0)
    INTO total_rev
    FROM payments
    WHERE contract_id = target_contract_id
    AND (payment_type IS NULL OR payment_type = 'Revenue');

    -- Calculate Cost (Paid Amount)
    SELECT COALESCE(SUM(paid_amount), 0)
    INTO total_exp
    FROM payments
    WHERE contract_id = target_contract_id
    AND payment_type = 'Expense';

    -- Calculate Invoiced Amount (Sum of AMOUNT where status is Invoiced/Paid/Overdue)
    -- Exclude 'Chờ xuất HĐ' (Pending Invoice) and 'Pending'
    SELECT COALESCE(SUM(amount), 0)
    INTO total_inv
    FROM payments
    WHERE contract_id = target_contract_id
    AND (payment_type IS NULL OR payment_type = 'Revenue')
    AND status NOT IN ('Chờ xuất HĐ', 'Pending', 'Chờ thu');

    -- Update Contract
    UPDATE contracts
    SET 
        actual_revenue = total_rev,
        actual_cost = total_exp,
        invoiced_amount = total_inv
    WHERE id = target_contract_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. SYNC: Recalculate all contracts right now
WITH contract_stats AS (
    SELECT 
        contract_id,
        SUM(CASE WHEN (payment_type IS NULL OR payment_type = 'Revenue') THEN paid_amount ELSE 0 END) as rev,
        SUM(CASE WHEN payment_type = 'Expense' THEN paid_amount ELSE 0 END) as exp,
        SUM(CASE 
            WHEN (payment_type IS NULL OR payment_type = 'Revenue') 
                 AND status NOT IN ('Chờ xuất HĐ', 'Pending', 'Chờ thu') 
            THEN amount 
            ELSE 0 
        END) as inv
    FROM payments
    GROUP BY contract_id
)
UPDATE contracts c
SET 
  actual_revenue = cs.rev,
  actual_cost = cs.exp,
  invoiced_amount = cs.inv
FROM contract_stats cs
WHERE c.id = cs.contract_id;
