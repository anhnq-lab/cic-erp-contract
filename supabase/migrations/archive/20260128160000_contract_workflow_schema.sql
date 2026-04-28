-- 1. ENUMS (Safe creation)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('NVKD', 'AdminUnit', 'UnitLeader', 'Accountant', 'ChiefAccountant', 'Legal', 'Leadership');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE plan_status AS ENUM ('Draft', 'Pending_Unit', 'Pending_Finance', 'Pending_Board', 'Approved', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_action AS ENUM ('Approve', 'Reject', 'RequestChange', 'Submit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_role AS ENUM ('Unit', 'Finance', 'Legal', 'Board');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILES (Extending Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role user_role DEFAULT 'NVKD',
    unit_id TEXT REFERENCES units(id) ON DELETE SET NULL, 
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 3. BUSINESS PLANS (PAKD)
CREATE TABLE IF NOT EXISTS contract_business_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id TEXT REFERENCES contracts(id) ON DELETE CASCADE, -- Changed to TEXT
    version INT DEFAULT 1,
    status plan_status DEFAULT 'Draft',
    
    financials JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES auth.users(id), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    notes TEXT
);

-- RLS for Business Plans
ALTER TABLE contract_business_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users" ON contract_business_plans;
CREATE POLICY "Enable read access for all users" ON contract_business_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON contract_business_plans;
CREATE POLICY "Enable insert for authenticated users" ON contract_business_plans FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for users" ON contract_business_plans;
CREATE POLICY "Enable update for users" ON contract_business_plans FOR UPDATE USING (true); 

-- 4. REVIEWS (Approval History)
CREATE TABLE IF NOT EXISTS contract_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contract_id TEXT REFERENCES contracts(id) ON DELETE CASCADE, -- Changed to TEXT
    plan_id UUID REFERENCES contract_business_plans(id),
    reviewer_id UUID REFERENCES auth.users(id), 
    
    role review_role NOT NULL, 
    action review_action NOT NULL,
    comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for Reviews
ALTER TABLE contract_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all users_reviews" ON contract_reviews;
CREATE POLICY "Enable read access for all users_reviews" ON contract_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users_reviews" ON contract_reviews;
CREATE POLICY "Enable insert for authenticated users_reviews" ON contract_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. AUTOMATION Trigger for Profile Updates
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'NVKD');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
