# Phase 01: Setup & Identity
Status: 🟡 In Progress
Dependencies: None

## Objective
Establish the connection between the frontend and Supabase. Migrate the fundamental "Units" (Organizational Units) data to the database to verify the pipeline.

## Requirements
### Functional
- [x] Connect App to Supabase via `.env` and `lib/supabase.ts`
- [x] Create `units` table in PostgreSQL
- [x] Create Seeding Tool to upload `MOCK_UNITS` to Supabase
- [ ] Refactor `UnitsAPI` to fetch data from Supabase instead of Mock

### Non-Functional
- [ ] Ensure RLS policies allow public read (initially) and restricted write.

## Implementation Steps
1. [x] Install `@supabase/supabase-js`.
2. [x] Create `lib/supabase.ts`.
3. [x] Generate SQL migration `01_create_units.sql`.
4. [x] Build `DataSeeder.tsx` component.
5. [x] **User Action**: Run SQL in Supabase Dashboard (✅ Done via MCP).
6. [ ] **User Action**: Click Seed button in App.
7. [ ] Refactor `services/api.ts` -> `UnitsAPI` to use real data.

## Files to Create/Modify
- `supabase/migrations/01_create_units.sql`
- `components/admin/DataSeeder.tsx`
- `services/api.ts`
- `App.tsx`
