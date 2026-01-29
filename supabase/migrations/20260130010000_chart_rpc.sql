-- Migration: Dashboard Chart RPC
-- Date: 2026-01-30 01:00
-- Purpose: Provide monthly time-series data for Dashboard Charts without fetching all rows

CREATE OR REPLACE FUNCTION get_dashboard_chart_data(
    p_unit_id TEXT DEFAULT 'all',
    p_year TEXT DEFAULT 'all'
)
RETURNS TABLE (
    month INT,
    revenue NUMERIC,
    profit NUMERIC,
    signing NUMERIC
) AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_year INT;
BEGIN
    -- Determine Year (Default to current if 'all')
    IF p_year = 'all' OR p_year IS NULL THEN
        v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
    ELSE
        v_year := p_year::INT;
    END IF;

    v_start_date := (v_year || '-01-01')::DATE;
    v_end_date := (v_year || '-12-31')::DATE;

    RETURN QUERY
    SELECT
        EXTRACT(MONTH FROM signed_date)::INT as month,
        SUM(safe_numeric(actual_revenue)) as revenue,
        SUM(safe_numeric(value) - safe_numeric(estimated_cost)) as profit,
        SUM(safe_numeric(value)) as signing
    FROM contracts
    WHERE
        -- Unit Filter
        (LOWER(p_unit_id) = 'all' OR unit_id = p_unit_id)
        AND
        -- Date Filter (Use signed_date for charting)
        (signed_date >= v_start_date AND signed_date <= v_end_date)
    GROUP BY
        EXTRACT(MONTH FROM signed_date)
    ORDER BY
        month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_dashboard_chart_data(TEXT, TEXT) TO authenticated;
