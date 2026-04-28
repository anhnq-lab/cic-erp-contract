-- Drive Folder Mappings
-- Tracks mapping between ERP entities and their Google Drive folders
-- Enables: auto folder creation, quick navigation, permission sync

CREATE TABLE IF NOT EXISTS drive_folder_mappings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- What entity this folder belongs to
  entity_type TEXT NOT NULL CHECK (entity_type IN ('root', 'unit', 'contract', 'customer', 'doctype', 'year')),
  entity_id TEXT,                        -- unit_id, contract_id, customer_id, etc.
  folder_type TEXT,                      -- 'PAKD', 'HopDong', 'HoaDon', 'BaoCao', 'Templates'
  
  -- Google Drive info
  drive_folder_id TEXT NOT NULL UNIQUE,  -- Google Drive folder ID
  drive_folder_url TEXT,                 -- Full URL for quick access
  drive_folder_name TEXT,                -- Display name in Drive
  
  -- Hierarchy
  parent_mapping_id UUID REFERENCES drive_folder_mappings(id) ON DELETE SET NULL,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_drive_mappings_entity 
  ON drive_folder_mappings(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_drive_mappings_folder_type 
  ON drive_folder_mappings(entity_type, entity_id, folder_type);

CREATE INDEX IF NOT EXISTS idx_drive_mappings_drive_id 
  ON drive_folder_mappings(drive_folder_id);

-- RLS
ALTER TABLE drive_folder_mappings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read mappings (to navigate to Drive folders)
CREATE POLICY "drive_mappings_select" ON drive_folder_mappings
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can insert/update/delete mappings
CREATE POLICY "drive_mappings_insert" ON drive_folder_mappings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Leadership')
    )
  );

CREATE POLICY "drive_mappings_update" ON drive_folder_mappings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('Admin', 'Leadership')
    )
  );

CREATE POLICY "drive_mappings_delete" ON drive_folder_mappings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'Admin'
    )
  );
