-- =====================================================================
-- Migration: fix_rls_company_wide_roles
-- Date: 2026-05-04
--
-- Vấn đề: is_admin_or_leadership() chỉ check Admin + Leadership,
-- thiếu 3 roles có quyền xem toàn công ty theo PHANQUYENHETHONG.md:
--   Accountant, ChiefAccountant, Legal
--
-- Roles xem TOÀN CÔNG TY: Admin, Leadership, Accountant, ChiefAccountant, Legal
-- Roles xem ĐƠN VỊ MÌNH:  NVKD, AdminUnit, UnitLeader
-- =====================================================================

CREATE OR REPLACE FUNCTION is_admin_or_leadership()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT role IN ('Admin', 'Leadership', 'Accountant', 'ChiefAccountant', 'Legal')
      FROM profiles
      WHERE id = auth.uid()
    ),
    FALSE
  );
$$;

-- Alias rõ nghĩa hơn cho code mới
CREATE OR REPLACE FUNCTION has_company_wide_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin_or_leadership();
$$;

COMMENT ON FUNCTION is_admin_or_leadership() IS
  'Returns TRUE for roles with company-wide data access: Admin, Leadership, Accountant, ChiefAccountant, Legal. NVKD / AdminUnit / UnitLeader are scoped to their own unit_id.';

COMMENT ON FUNCTION has_company_wide_access() IS
  'Alias for is_admin_or_leadership(). Prefer this name in new code.';
