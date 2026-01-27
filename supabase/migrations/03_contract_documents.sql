-- Create contract_documents table
CREATE TABLE IF NOT EXISTS contract_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  type TEXT,
  size INTEGER,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  uploaded_by UUID REFERENCES auth.users(id) -- Optional: Track who uploaded
);

-- Enable RLS
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

-- Policies for contract_documents
CREATE POLICY "Enable read access for all users" ON contract_documents
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON contract_documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON contract_documents
  FOR DELETE USING (auth.role() = 'authenticated');

-- STORAGE BUCKET SETUP (Note: This might need to be done in Dashboard if SQL fails)
-- Attempt to insert into storage.buckets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract_docs', 'contract_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow public read access to files (Conceptually private, but for now allow read if they have the URL)
-- Or better: Allow authenticated users to view
CREATE POLICY "Allow authenticated read access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'contract_docs' AND auth.role() = 'authenticated' );

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'contract_docs' AND auth.role() = 'authenticated' );

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'contract_docs' AND auth.role() = 'authenticated' );
