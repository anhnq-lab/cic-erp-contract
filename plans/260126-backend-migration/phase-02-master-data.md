# Phase 02: Master Data Migration
Status: ⬜ Pending
Dependencies: Phase 01 (Connection established)

## Objective
Migrate the core reference data (Master Data) from Mock to Supabase. This ensures that when we create Contracts in Phase 3, they reference real Customers and Salespeople.

## Requirements
### Functional
- [ ] Create `customers` table
- [ ] Create `sales_people` table
- [ ] Create `products` table
- [ ] Seed data for all 3 tables
- [ ] Refactor `CustomersAPI`, `PersonnelAPI`, `ProductsAPI`

### Non-Functional
- [ ] Ensure Foreign Keys are correctly set (SalesPerson -> Unit)

## Implementation Steps
1. [ ] Generate SQL migration `02_create_master_data.sql`.
   - Table `customers`
   - Table `sales_people`
   - Table `products`
2. [ ] Update `DataSeeder.tsx` to include buttons for these 3 tables.
3. [ ] **User Action**: Run SQL via MCP or Dashboard.
4. [ ] **User Action**: Seed Data via UI.
5. [ ] Refactor `services/api.ts` to use Supabase.

## Files to Create/Modify
- `supabase/migrations/02_create_master_data.sql`
- `components/admin/DataSeeder.tsx`
- `services/api.ts`
