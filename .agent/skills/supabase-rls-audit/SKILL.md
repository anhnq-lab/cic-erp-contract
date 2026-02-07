---
name: supabase-rls-audit
description: Audit Row Level Security policies on all CIC ERP Supabase tables. Detect missing policies, overly permissive rules, and suggest fixes.
---

# Supabase RLS Audit Skill

## When to use
- After creating new tables or migrations
- During security reviews
- Before deploying to production
- When `get_advisors` returns security warnings

## Audit workflow
```
- [ ] Step 1: List all tables in public schema
- [ ] Step 2: Check RLS enabled status
- [ ] Step 3: Review existing policies
- [ ] Step 4: Run Supabase security advisors
- [ ] Step 5: Generate fix recommendations
- [ ] Step 6: Apply fixes
```

## Step 1-3: Audit query
Run this via `execute_sql`:
```sql
SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COALESCE(
    json_agg(
      json_build_object(
        'policy', p.policyname,
        'cmd', p.cmd,
        'permissive', p.permissive,
        'roles', p.roles,
        'qual', p.qual,
        'with_check', p.with_check
      )
    ) FILTER (WHERE p.policyname IS NOT NULL),
    '[]'
  ) AS policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
```

## Step 4: Security advisors
Use MCP tool: `get_advisors` with type `security`

## Severity levels

| Issue | Severity | Action |
|---|---|---|
| RLS not enabled | 🔴 Critical | Enable immediately |
| No SELECT policy | 🟡 Warning | Add authenticated read policy |
| No INSERT/UPDATE policy | 🟡 Warning | Add role-based write policy |
| `USING (true)` on sensitive tables | 🟡 Warning | Restrict by unit_id or user_id |
| No DELETE policy | 🟢 Info | Consider adding if needed |

## Fix templates

### Enable RLS
```sql
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;
```

### Authenticated read-only
```sql
CREATE POLICY "<table>_select" ON public.<table>
  FOR SELECT TO authenticated USING (true);
```

### Unit-scoped access
```sql
CREATE POLICY "<table>_unit_access" ON public.<table>
  FOR ALL TO authenticated
  USING (unit_id IN (
    SELECT id FROM units WHERE id = (
      SELECT unit_id FROM profiles WHERE id = auth.uid()
    )
  ));
```

### Admin full access
```sql
CREATE POLICY "<table>_admin_full" ON public.<table>
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Admin')
  );
```

## CIC ERP sensitive tables
These tables MUST have restrictive RLS:
- `profiles` — user data
- `user_permissions` — RBAC permissions
- `audit_logs` — audit trail (read-only for non-admin)
- `payments` — financial data
- `contracts` — business data

## Report format
Output the audit as a markdown table:
```
| Table | RLS | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|-----|--------|--------|--------|--------|--------|
| contracts | ✅ | ✅ | ✅ | ✅ | ❌ | ⚠️ Missing DELETE |
| payments | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| new_table | ❌ | - | - | - | - | 🔴 RLS disabled! |
```
