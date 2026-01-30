-- Add 'Admin' to is_global_viewer function
CREATE OR REPLACE FUNCTION is_global_viewer()
RETURNS BOOLEAN AS $$
  SELECT role IN ('Admin', 'Leadership', 'Legal', 'ChiefAccountant', 'Accountant') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;
