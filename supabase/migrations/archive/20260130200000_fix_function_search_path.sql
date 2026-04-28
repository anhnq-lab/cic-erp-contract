-- Fix all functions with mutable search_path (Security Advisory)
-- This prevents SQL injection via search_path manipulation
-- Applied: 2026-01-30

ALTER FUNCTION get_my_role() SET search_path = public;
ALTER FUNCTION get_my_unit_id() SET search_path = public;
ALTER FUNCTION auth_user_role() SET search_path = public;
ALTER FUNCTION auth_user_unit_id() SET search_path = public;
ALTER FUNCTION is_global_viewer() SET search_path = public;
ALTER FUNCTION get_kpi_stats(TEXT, TEXT, INT) SET search_path = public;
ALTER FUNCTION get_units_with_stats(INTEGER) SET search_path = public;
ALTER FUNCTION get_employees_with_stats(TEXT, INTEGER, TEXT) SET search_path = public;
ALTER FUNCTION get_customers_with_stats(TEXT, TEXT, TEXT, INTEGER, INTEGER) SET search_path = public;
ALTER FUNCTION get_customers_count(TEXT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION get_contract_stats(TEXT, TEXT) SET search_path = public;
ALTER FUNCTION get_dashboard_chart_data(TEXT, TEXT) SET search_path = public;
ALTER FUNCTION get_payment_stats(TEXT) SET search_path = public;
ALTER FUNCTION update_contract_financials() SET search_path = public;
ALTER FUNCTION process_audit_log() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;
