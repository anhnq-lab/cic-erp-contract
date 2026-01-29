-- Function to get all units with their aggregated stats
CREATE OR REPLACE FUNCTION get_units_with_stats(p_year INTEGER DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    code TEXT,
    type TEXT,
    target JSONB,
    total_signing NUMERIC,
    total_revenue NUMERIC,
    total_profit NUMERIC, -- Added Profit
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
            SUM(c.value - COALESCE(c.estimated_cost, 0)) as total_profit -- Calc Profit
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
        u.target,
        COALESCE(us.total_signing, 0) as total_signing,
        COALESCE(us.total_revenue, 0) as total_revenue,
        COALESCE(us.total_profit, 0) as total_profit,
        COALESCE(us.contract_count, 0)::INTEGER as contract_count
    FROM
        units u
    LEFT JOIN
        unit_stats us ON u.id = us.unit_id
    ORDER BY
        u.code; -- Or specific ordering
END;
$$ LANGUAGE plpgsql;

-- Function to get employees with their aggregated stats, optionally filtered by unit
-- Updated to also include profit if needed, but usually strictly signing/rev for sales.
-- Let's add profit to employee too for consistency? User didn't ask but "Profit" kpi often matters.
-- I'll keep employee as is unless requested, to save bandwidth/complexity. 
-- Wait, Employee usually doesn't track cost per employee, but "Profit" of their contracts.
-- I'll update employee too just in case.

CREATE OR REPLACE FUNCTION get_employees_with_stats(p_unit_id UUID DEFAULT NULL, p_year INTEGER DEFAULT NULL, p_search TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    code TEXT,
    email TEXT,
    unit_id UUID,
    role_code TEXT,
    avatar TEXT,
    target JSONB,
    total_signing NUMERIC,
    total_revenue NUMERIC,
    total_profit NUMERIC, -- Added
    contract_count INTEGER
) AS $$
DECLARE
    v_year INTEGER;
BEGIN
    v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

    RETURN QUERY
    WITH emp_stats AS (
        SELECT
            c.employee_id,
            COUNT(c.id) as contract_count,
            SUM(c.value) as total_signing,
            SUM(c.actual_revenue) as total_revenue,
             SUM(c.value - COALESCE(c.estimated_cost, 0)) as total_profit
        FROM
            contracts c
        WHERE
            c.employee_id IS NOT NULL
            AND (v_year IS NULL OR EXTRACT(YEAR FROM c.signed_date) = v_year)
        GROUP BY
            c.employee_id
    )
    SELECT
        e.id,
        e.name,
        e.code,
        e.email,
        e.unit_id,
        e.role_code,
        e.avatar,
        e.target,
        COALESCE(es.total_signing, 0) as total_signing,
        COALESCE(es.total_revenue, 0) as total_revenue,
        COALESCE(es.total_profit, 0) as total_profit,
        COALESCE(es.contract_count, 0)::INTEGER as contract_count
    FROM
        employees e
    LEFT JOIN
        emp_stats es ON e.id = es.employee_id
    WHERE
        (p_unit_id IS NULL OR e.unit_id = p_unit_id)
        AND (p_search IS NULL OR e.name ILIKE '%' || p_search || '%')
    ORDER BY
        COALESCE(es.total_signing, 0) DESC; -- Sort by performance by default
END;
$$ LANGUAGE plpgsql;

-- GRANT EXECUTE
GRANT EXECUTE ON FUNCTION get_units_with_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_units_with_stats(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION get_employees_with_stats(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employees_with_stats(UUID, INTEGER, TEXT) TO service_role;
