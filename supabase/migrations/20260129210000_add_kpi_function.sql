-- Function to calculate KPI Stats for Employee or Unit
CREATE OR REPLACE FUNCTION get_kpi_stats(
  p_entity_id TEXT,
  p_type TEXT, -- 'employee' or 'unit'
  p_year INT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with admin privileges to access all contracts
AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_result JSONB;
BEGIN
  -- Default to current year if null
  IF p_year IS NULL THEN
    p_year := date_part('year', CURRENT_DATE)::INT;
  END IF;

  v_start_date := make_date(p_year, 1, 1);
  v_end_date := make_date(p_year, 12, 31);

  IF p_type = 'employee' THEN
    SELECT jsonb_build_object(
      'contractCount', COUNT(*),
      'totalSigning', COALESCE(SUM(value), 0),
      'totalRevenue', COALESCE(SUM(actual_revenue), 0)
    ) INTO v_result
    FROM contracts
    WHERE employee_id = p_entity_id::uuid
      AND signed_date BETWEEN v_start_date AND v_end_date;

  ELSIF p_type = 'unit' THEN
    SELECT jsonb_build_object(
      'contractCount', COUNT(*),
      'totalSigning', COALESCE(SUM(value), 0),
      'totalRevenue', COALESCE(SUM(actual_revenue), 0)
    ) INTO v_result
    FROM contracts
    WHERE unit_id = p_entity_id -- unit_id is text/slug
      AND signed_date BETWEEN v_start_date AND v_end_date;
  
  ELSE
    RAISE EXCEPTION 'Invalid type. Must be employee or unit';
  END IF;

  RETURN v_result;
END;
$$;
