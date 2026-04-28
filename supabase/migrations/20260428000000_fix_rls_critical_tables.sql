-- ============================================================
-- MIGRATION: Vá RLS cho 14 bảng đang bị tắt
-- Ngày: 2026-04-28 | Lý do: Security audit Phase 0
-- Áp dụng bởi: Claude Agent (plans/260427-optimization-roadmap)
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. CONTRACTS — Xóa 2 policy nguy hiểm cho anon, bật RLS
--    anon_read_contracts:  cho phép chưa đăng nhập đọc toàn bộ hợp đồng
--    anon_write_contracts: cho phép chưa đăng nhập xóa/sửa toàn bộ hợp đồng
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "anon_read_contracts"  ON contracts;
DROP POLICY IF EXISTS "anon_write_contracts" ON contracts;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 2. CONTRACT_RELATIONS — Bật RLS (policy authenticated đã có)
-- ─────────────────────────────────────────────
ALTER TABLE contract_relations ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 3. CONTRACT_TAGS — Bật RLS (policy user_id đã đúng)
-- ─────────────────────────────────────────────
ALTER TABLE contract_tags ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 4. AI_PERMISSIONS — Bật RLS (policy đã đúng)
-- ─────────────────────────────────────────────
ALTER TABLE ai_permissions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 5. TASK_PERSONAL_TAGS — Bật RLS (policy user_id đã đúng)
-- ─────────────────────────────────────────────
ALTER TABLE task_personal_tags ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 6. TASKS — Bật RLS + thêm policy
--    created_by là TEXT nên dùng auth.uid()::text
-- ─────────────────────────────────────────────
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_authenticated"
  ON tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "tasks_insert_authenticated"
  ON tasks FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "tasks_update_authenticated"
  ON tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "tasks_delete_admin_or_owner"
  ON tasks FOR DELETE TO authenticated
  USING (is_admin_or_leadership() OR created_by = auth.uid()::text);

-- ─────────────────────────────────────────────
-- 7. TASK_COMMENTS — Bật RLS + policy (user_id là TEXT)
-- ─────────────────────────────────────────────
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_comments_select_authenticated"
  ON task_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_comments_insert_authenticated"
  ON task_comments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "task_comments_update_own"
  ON task_comments FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "task_comments_delete_own_or_admin"
  ON task_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text OR is_admin_or_leadership());

-- ─────────────────────────────────────────────
-- 8. TASK_LINKS — Bật RLS + policy cơ bản
-- ─────────────────────────────────────────────
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_links_select_authenticated"
  ON task_links FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_links_insert_authenticated"
  ON task_links FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "task_links_delete_authenticated"
  ON task_links FOR DELETE TO authenticated USING (true);

-- ─────────────────────────────────────────────
-- 9. TASK_STATUSES — Lookup table: read-all, admin-write
-- ─────────────────────────────────────────────
ALTER TABLE task_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_statuses_select_authenticated"
  ON task_statuses FOR SELECT TO authenticated USING (true);

CREATE POLICY "task_statuses_admin_full"
  ON task_statuses FOR ALL TO authenticated
  USING (is_admin_or_leadership())
  WITH CHECK (is_admin_or_leadership());

-- ─────────────────────────────────────────────
-- 10. DISCUSSIONS — Bật RLS + policy (user_id là TEXT)
-- ─────────────────────────────────────────────
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discussions_select_authenticated"
  ON discussions FOR SELECT TO authenticated USING (true);

CREATE POLICY "discussions_insert_authenticated"
  ON discussions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "discussions_update_own"
  ON discussions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "discussions_delete_own_or_admin"
  ON discussions FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text OR is_admin_or_leadership());

-- ─────────────────────────────────────────────
-- 11. AI_AGENT_TASKS — Bật RLS
-- ─────────────────────────────────────────────
ALTER TABLE ai_agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_agent_tasks_select_authenticated"
  ON ai_agent_tasks FOR SELECT TO authenticated USING (true);

CREATE POLICY "ai_agent_tasks_admin_write"
  ON ai_agent_tasks FOR ALL TO authenticated
  USING (is_admin_or_leadership())
  WITH CHECK (is_admin_or_leadership());

-- ─────────────────────────────────────────────
-- 12. AGENT_TASK_ACTIVITIES — Bật RLS (user_id là TEXT)
-- ─────────────────────────────────────────────
ALTER TABLE agent_task_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_task_activities_select_authenticated"
  ON agent_task_activities FOR SELECT TO authenticated USING (true);

CREATE POLICY "agent_task_activities_own_or_admin"
  ON agent_task_activities FOR ALL TO authenticated
  USING (user_id = auth.uid()::text OR is_admin_or_leadership())
  WITH CHECK (user_id = auth.uid()::text OR is_admin_or_leadership());

-- ─────────────────────────────────────────────
-- 13. ENTITY_REGISTRY — Lookup + search index
-- ─────────────────────────────────────────────
ALTER TABLE entity_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entity_registry_select_authenticated"
  ON entity_registry FOR SELECT TO authenticated USING (true);

CREATE POLICY "entity_registry_admin_write"
  ON entity_registry FOR ALL TO authenticated
  USING (is_admin_or_leadership())
  WITH CHECK (is_admin_or_leadership());

-- ─────────────────────────────────────────────
-- 14. LEAVE_POLICIES — Quy định nghỉ phép
-- ─────────────────────────────────────────────
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_policies_select_authenticated"
  ON leave_policies FOR SELECT TO authenticated USING (true);

CREATE POLICY "leave_policies_admin_write"
  ON leave_policies FOR ALL TO authenticated
  USING (is_admin_or_leadership())
  WITH CHECK (is_admin_or_leadership());
