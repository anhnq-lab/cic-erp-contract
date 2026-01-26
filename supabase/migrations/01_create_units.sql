-- Create units table
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    code TEXT NOT NULL,
    target JSONB DEFAULT '{}'::jsonb,
    last_year_actual JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to everyone (public) for now
CREATE POLICY "Allow public read access" ON public.units FOR SELECT USING (true);

-- Create policy to allow authenticated users (or service role) to insert/update
-- For dev purposes, we allow anon to insert/update if they have the key, 
-- but in production we should restrict this to admins.
CREATE POLICY "Allow public insert/update for seeding" ON public.units FOR ALL USING (true);
