-- Enable relaxed policies for testing
-- This ensures the Admin (and others) can update/insert without strict checks for now

-- 1. Contract Business Plans
ALTER TABLE contract_business_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Test Policy: Allow ALL for Plans" ON contract_business_plans;
CREATE POLICY "Test Policy: Allow ALL for Plans" 
ON contract_business_plans 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. Contract Reviews
ALTER TABLE contract_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Test Policy: Allow ALL for Reviews" ON contract_reviews;
CREATE POLICY "Test Policy: Allow ALL for Reviews" 
ON contract_reviews 
FOR ALL 
USING (true) 
WITH CHECK (true);
