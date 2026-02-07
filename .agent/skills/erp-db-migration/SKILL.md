---
name: erp-db-migration
description: Generate and apply Supabase database migrations for CIC ERP. Creates SQL with proper RLS policies, indexes, triggers, and follows the project's naming conventions.
---

# ERP Database Migration Skill

## When to use
When adding new tables, columns, indexes, RLS policies, or RPC functions to the CIC ERP Supabase database.

## Migration naming
Format: `YYYYMMDDHHMMSS_description.sql`
Directory: `supabase/migrations/`

## Workflow
1. Determine the change type (new table, alter table, add RLS, add RPC)
2. Generate SQL following templates below
3. Apply via Supabase MCP `apply_migration` tool
4. Verify with `list_tables` or `execute_sql`
5. Run `get_advisors` security check after DDL changes

## Templates

### New Table
```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.<table_name> (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  -- columns here
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;

-- Read policy (authenticated users)
CREATE POLICY "<table_name>_select" ON public.<table_name>
  FOR SELECT TO authenticated USING (true);

-- Insert policy
CREATE POLICY "<table_name>_insert" ON public.<table_name>
  FOR INSERT TO authenticated WITH CHECK (true);

-- Update policy
CREATE POLICY "<table_name>_update" ON public.<table_name>
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_<table_name>_created_at ON public.<table_name>(created_at);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.<table_name>
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Add Column
```sql
ALTER TABLE public.<table_name>
  ADD COLUMN IF NOT EXISTS <col> <type> <default>;
```

### RPC Function
```sql
CREATE OR REPLACE FUNCTION public.<func_name>(<params>)
RETURNS <return_type>
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- logic
END;
$$;
```

## Existing tables reference
contracts, employees, units, customers, products, payments, contract_documents, profiles, user_permissions, contract_reviews, business_plans, audit_logs

## Important rules
- Always use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Always enable RLS on new tables
- Always add indexes on foreign keys and frequently queried columns
- Use `SECURITY DEFINER` + `SET search_path = public` for RPC functions
- Run security advisors after applying migrations
