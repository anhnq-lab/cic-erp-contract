-- Migration: Fix get_units_with_stats to return actual target from database
-- Bug: Previous version hardcoded target values (signing=0, adminProfit=0)
-- instead of returning actual JSONB stored in units.target column

-- Drop existing function first to allow return type change
DROP FUNCTION IF EXISTS get_units_with_stats(INTEGER);

CREATE OR REPLACE FUNCTION get_units_with_stats(p_year INTEGER DEFAULT NULL)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    code TEXT,
    type TEXT,
    target JSONB,
    functions TEXT,
    total_signing NUMERIC,
    total_revenue NUMERIC,
    total_profit NUMERIC,
    contract_count INTEGER
) AS $$
DECLARE
    v_year INTEGER;
BEGIN
    v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

    RETURN QUERY
    WITH unit_stats AS (
        SELECT
            c.unit_id,
            COUNT(c.id) as contract_count,
            SUM(c.value) as total_signing,
            SUM(c.actual_revenue) as total_revenue,
            SUM(c.value - COALESCE(c.estimated_cost, 0)) as total_profit
        FROM
            contracts c
        WHERE
            c.unit_id IS NOT NULL
            AND (v_year IS NULL OR EXTRACT(YEAR FROM c.signed_date) = v_year)
        GROUP BY
            c.unit_id
    )
    SELECT
        u.id,
        u.name,
        u.code,
        u.type,
        -- FIX: Return actual target JSONB from database instead of hardcoded values
        COALESCE(u.target, '{"signing": 0, "revenue": 0, "adminProfit": 0, "revProfit": 0, "cash": 0}'::jsonb) as target,
        u.functions,
        COALESCE(us.total_signing, 0) as total_signing,
        COALESCE(us.total_revenue, 0) as total_revenue,
        COALESCE(us.total_profit, 0) as total_profit,
        COALESCE(us.contract_count, 0)::INTEGER as contract_count
    FROM
        units u
    LEFT JOIN
        unit_stats us ON u.id = us.unit_id
    ORDER BY
        u.code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set search path for security
ALTER FUNCTION get_units_with_stats(INTEGER) SET search_path = public;
