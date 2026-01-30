-- Add missing indexes for foreign keys (Performance Advisory)
-- This improves JOIN performance significantly
-- Applied: 2026-01-30

-- contracts table
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON contracts(unit_id);
CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_signed_date ON contracts(signed_date);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- payments table
CREATE INDEX IF NOT EXISTS idx_payments_contract_id ON payments(contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- employees table
CREATE INDEX IF NOT EXISTS idx_employees_unit_id ON employees(unit_id);

-- products table
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);

-- profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_unit_id ON profiles(unit_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- contract_business_plans
CREATE INDEX IF NOT EXISTS idx_cbp_contract_id ON contract_business_plans(contract_id);

-- contract_reviews
CREATE INDEX IF NOT EXISTS idx_cr_contract_id ON contract_reviews(contract_id);
CREATE INDEX IF NOT EXISTS idx_cr_plan_id ON contract_reviews(plan_id);

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);

-- cost_adjustments
CREATE INDEX IF NOT EXISTS idx_cost_adj_contract_id ON cost_adjustments(contract_id);
