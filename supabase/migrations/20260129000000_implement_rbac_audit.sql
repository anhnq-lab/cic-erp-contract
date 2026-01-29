-- 1. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'
    old_data JSONB,
    new_data JSONB,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated" ON audit_logs;
CREATE POLICY "Enable read for authenticated" ON audit_logs FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable insert for authenticated" ON audit_logs;
CREATE POLICY "Enable insert for authenticated" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 2. COST ADJUSTMENTS (For Actual Cost tracking separate from Plan)
CREATE TABLE IF NOT EXISTS cost_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id TEXT REFERENCES contracts(id) ON DELETE CASCADE,
    
    item_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT DEFAULT 'Incurred', -- 'Incurred' (Phát sinh), 'Saving' (Tiết kiệm), 'Correction' (Điều chỉnh)
    
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE cost_adjustments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON cost_adjustments;
CREATE POLICY "Enable read for authenticated users" ON cost_adjustments FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable all for authenticated" ON cost_adjustments;
CREATE POLICY "Enable all for authenticated" ON cost_adjustments FOR ALL USING (auth.role() = 'authenticated');


-- 3. RLS HELPERS
-- Function to get current user's Unit ID
CREATE OR REPLACE FUNCTION get_my_unit_id()
RETURNS TEXT AS $$
  SELECT unit_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is Leadership or Legal or ChiefAccountant (Global View)
CREATE OR REPLACE FUNCTION is_global_viewer()
RETURNS BOOLEAN AS $$
  SELECT role IN ('Leadership', 'Legal', 'ChiefAccountant', 'Accountant', 'AdminUnit') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;


-- 4. UPDATE RLS for CONTRACTS (Enforce Unit Scope)
-- First drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON contracts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contracts;
DROP POLICY IF EXISTS "Enable update for users" ON contracts;
DROP POLICY IF EXISTS "Unit Scope Read" ON contracts;
DROP POLICY IF EXISTS "Unit Scope Insert" ON contracts;
DROP POLICY IF EXISTS "Unit Scope Update" ON contracts;


-- READ: Own Unit OR Global Role
CREATE POLICY "Unit Scope Read" ON contracts FOR SELECT
USING (
  is_global_viewer() 
  OR 
  unit_id::text = get_my_unit_id() -- Robust cast
  OR
  salesperson_id::text = auth.uid()::text -- Robust cast for text-uuid comparison
  OR -- Coordinating Unit (if we had that column, logic here) 
  id IN (SELECT contract_id FROM contract_reviews WHERE reviewer_id = auth.uid()) -- Access if I reviewed it
);

-- INSERT: Only for NVKD, UnitAdmin, Leadership
CREATE POLICY "Unit Scope Insert" ON contracts FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' -- We assume App logic handles role check
);

-- UPDATE: Own Unit (Draft) OR Global Admin
CREATE POLICY "Unit Scope Update" ON contracts FOR UPDATE
USING (
   is_global_viewer() 
   OR 
   unit_id::text = get_my_unit_id()
);


-- 5. UPDATE RLS for PAKD (Business Plans)
DROP POLICY IF EXISTS "Enable read access for all users" ON contract_business_plans;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contract_business_plans;
DROP POLICY IF EXISTS "Enable update for users" ON contract_business_plans;
DROP POLICY IF EXISTS "Unit Scope Read PAKD" ON contract_business_plans;
DROP POLICY IF EXISTS "Unit Scope Write PAKD" ON contract_business_plans;


-- READ
CREATE POLICY "Unit Scope Read PAKD" ON contract_business_plans FOR SELECT
USING (
  is_global_viewer() 
  OR 
  contract_id IN (SELECT id FROM contracts WHERE unit_id::text = get_my_unit_id())
);

-- INSERT/UPDATE
CREATE POLICY "Unit Scope Write PAKD" ON contract_business_plans FOR ALL
USING (
  -- Can write if belonging to Unit or Global
  is_global_viewer() 
  OR 
  contract_id IN (SELECT id FROM contracts WHERE unit_id::text = get_my_unit_id())
);
