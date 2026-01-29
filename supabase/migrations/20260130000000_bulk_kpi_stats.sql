DROP FUNCTION IF EXISTS get_employees_with_stats(TEXT, INTEGER, TEXT);

-- Function to get employees with their aggregated stats
CREATE OR REPLACE FUNCTION get_employees_with_stats(p_unit_id TEXT DEFAULT NULL, p_year INTEGER DEFAULT NULL, p_search TEXT DEFAULT NULL)
RETURNS TABLE (
    id TEXT,
    name TEXT,
    employee_code TEXT, -- Changed from code to employee_code
    email TEXT,
    unit_id TEXT,
    role_code TEXT,
    avatar TEXT,
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
        e.employee_code, -- Correct column name
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
        COALESCE(es.total_signing, 0) DESC; 
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_employees_with_stats(TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_employees_with_stats(TEXT, INTEGER, TEXT) TO service_role;
