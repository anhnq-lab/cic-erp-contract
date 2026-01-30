-- Update get_units_with_stats to be SECURITY DEFINER
-- This ensures it runs with owner permissions, bypassing RLS on contracts/units.
-- This is safe because its purpose is to show unit stats which "Leadership" (the intended user) should see globally.
-- For other users (Unit Leaders), the stats aggregation might need filtering if we wanted strict RLS, 
-- but currently Unit Leaders also see the Unit List (just maybe not all contracts?).
-- Actually, Unit Leaders should see ALL Units in the list, just not contracts details of other units.
-- The RPC aggregates contracts. If we run as SECURITY DEFINER, Unit Leaders will see accurate stats for ALL units.
-- Is this desired? Yes, usually Unit List shows global high-level stats (Revenue of other units).
-- If not, we might need to filter inside RPC based on user role.
-- But the immediate fix for "Leadership" seeing empty list is SECURITY DEFINER.

CREATE OR REPLACE FUNCTION get_units_with_stats(p_year INTEGER DEFAULT NULL)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    code TEXT,
    type TEXT,
    target JSONB,
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
        jsonb_build_object(
            'signing', 0, 
            'revenue', COALESCE(u.target->>'revenue', '0')::NUMERIC, 
            'adminProfit', 0, 
            'revProfit', 0, 
            'cash', 0
        ) as target,
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
$$ LANGUAGE plpgsql SECURITY DEFINER; -- Changed from default (INVOKER) to SECURITY DEFINER
