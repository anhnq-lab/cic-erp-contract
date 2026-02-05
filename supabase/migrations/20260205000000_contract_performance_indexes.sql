-- Contract Module Performance Indexes
-- Migration: Add indexes for common query patterns

-- Index for status filter (very common)
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- Index for unit filtering
CREATE INDEX IF NOT EXISTS idx_contracts_unit_id ON public.contracts(unit_id);

-- Index for customer lookup
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON public.contracts(customer_id);

-- Index for employee/salesperson lookup
CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON public.contracts(employee_id);

-- Index for date range queries (year filter, sorting)
CREATE INDEX IF NOT EXISTS idx_contracts_signed_date ON public.contracts(signed_date DESC);

-- Composite index for common list query pattern
CREATE INDEX IF NOT EXISTS idx_contracts_list_query 
ON public.contracts(status, unit_id, signed_date DESC);

-- Index for text search optimization
CREATE INDEX IF NOT EXISTS idx_contracts_title_trgm 
ON public.contracts USING gin(title gin_trgm_ops);

-- Enable pg_trgm extension if not exists (for text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add comment for documentation
COMMENT ON INDEX idx_contracts_list_query IS 'Composite index for contract list queries with status, unit, and date filters';
