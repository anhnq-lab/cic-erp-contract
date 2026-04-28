-- Migration: 20260207120000_create_user_permissions.sql
-- Description: Ensure user_permissions table exists with correct schema.
-- Fix: user_id must be TEXT (not UUID) since PermissionManager uses employee IDs.

CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    resource TEXT NOT NULL,
    actions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, resource)
);

-- Enable RLS (DEV mode: allow all authenticated users)
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dev_Allow_All_UserPermissions" ON user_permissions;
CREATE POLICY "Dev_Allow_All_UserPermissions" ON user_permissions
    FOR ALL USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
