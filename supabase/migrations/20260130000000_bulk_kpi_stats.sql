-- Migration: Bulk KPI Stats RPCs
-- Date: 2026-01-30
-- Purpose: Offload heavy aggregation from Client to DB for scalable performance

-- 1. Helper: Safe Numeric Cast (Avoids nulls crashing math)
CREATE OR REPLACE FUNCTION safe_numeric(val NUMERIC) RETURNS NUMERIC AS $$
BEGIN
    RETURN COALESCE(val, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. get_contract_stats
-- Aggregates Value, Revenue, Profit for a Unit (or All) in a given Year
DROP FUNCTION IF EXISTS get_contract_stats(TEXT, TEXT);
CREATE OR REPLACE FUNCTION get_contract_stats(
    p_unit_id TEXT DEFAULT 'all',
    p_year TEXT DEFAULT 'all'
)
RETURNS TABLE (
    total_contracts BIGINT,
    total_value NUMERIC,
    total_revenue NUMERIC,
    total_profit NUMERIC,
    pending_count BIGINT,
    active_count BIGINT
) AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Handle Year Filter
    IF p_year = 'all' OR p_year IS NULL THEN
        -- Broad range if no year
        v_start_date := '2000-01-01';
        v_end_date := '2100-12-31';
    ELSE
        v_start_date := (p_year || '-01-01')::DATE;
        v_end_date := (p_year || '-12-31')::DATE;
    END IF;

    RETURN QUERY
    SELECT
        COUNT(id) as total_contracts,
        SUM(safe_numeric(value)) as total_value,
        SUM(safe_numeric(actual_revenue)) as total_revenue,
        SUM(safe_numeric(value) - safe_numeric(estimated_cost)) as total_profit,
        COUNT(id) FILTER (WHERE status IN ('Pending', 'Reviewing')) as pending_count,
        COUNT(id) FILTER (WHERE status = 'Active') as active_count
    FROM contracts
    WHERE
        -- Unit Filter (Handle 'all' and 'All')
        (LOWER(p_unit_id) = 'all' OR unit_id = p_unit_id)
        AND
        -- Date Filter
        (signed_date >= v_start_date AND signed_date <= v_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_payment_stats_by_contract
-- Aggregates payment info for a specific contract or all
DROP FUNCTION IF EXISTS get_payment_stats(TEXT);
CREATE OR REPLACE FUNCTION get_payment_stats(p_contract_id TEXT)
RETURNS TABLE (
    total_amount NUMERIC,
    paid_amount NUMERIC,
    remaining_amount NUMERIC,
    overdue_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(safe_numeric(amount)) as total_amount,
        SUM(safe_numeric(paid_amount)) as paid_amount,
        SUM(safe_numeric(amount) - safe_numeric(paid_amount)) as remaining_amount,
        SUM(safe_numeric(amount) - safe_numeric(paid_amount)) FILTER (WHERE status IN ('Quá hạn', 'Overdue')) as overdue_amount
    FROM payments
    WHERE contract_id = p_contract_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_contract_stats(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_payment_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION safe_numeric(NUMERIC) TO authenticated;
