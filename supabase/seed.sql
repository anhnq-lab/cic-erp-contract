-- ============================================================
-- CIC ERP Contract — Database Seed / Baseline
-- Generated: 2026-04-28 | Schema snapshot from production
-- Project: jyohocjsnsyfgfsmjfqx
--
-- CÁCH DÙNG:
--   Môi trường dev/staging mới: supabase db reset  (tự động load file này)
--   Regenerate file này:        supabase db dump --schema-only > supabase/seed.sql
--
-- ⚠️  KHÔNG CHẠY FILE NÀY TRỰC TIẾP LÊN PRODUCTION
--     Production đã có đầy đủ schema. File này chỉ dùng cho fresh dev setup.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. EXTENSIONS
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm"            WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto"            WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "unaccent"            WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"           WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "vector"              WITH SCHEMA public;

-- ─────────────────────────────────────────────────────────────
-- 2. CUSTOM ENUM TYPES
-- ─────────────────────────────────────────────────────────────
CREATE TYPE public.comment_type AS ENUM (
  'comment', 'approval', 'system'
);

CREATE TYPE public.dependency_type AS ENUM (
  'blocked_by', 'blocking', 'waiting_on', 'related'
);

CREATE TYPE public.plan_status AS ENUM (
  'Draft', 'Pending_Unit', 'Pending_Finance', 'Pending_Board', 'Approved', 'Rejected'
);

CREATE TYPE public.review_action AS ENUM (
  'Approve', 'Reject', 'RequestChange', 'Submit'
);

CREATE TYPE public.review_role AS ENUM (
  'Unit', 'Finance', 'Legal', 'Board'
);

CREATE TYPE public.task_priority AS ENUM (
  'urgent', 'high', 'medium', 'low', 'none'
);

CREATE TYPE public.task_source_type AS ENUM (
  'manual', 'crm', 'contract', 'marketing', 'ai', 'chat'
);

CREATE TYPE public.user_role AS ENUM (
  'NVKD', 'AdminUnit', 'UnitLeader', 'Accountant',
  'ChiefAccountant', 'Legal', 'Leadership', 'Admin'
);

-- ─────────────────────────────────────────────────────────────
-- 3. FULL SCHEMA
--
-- Phần schema đầy đủ (140+ tables, functions, views, triggers,
-- RLS policies) được quản lý qua Supabase migrations.
--
-- Để regenerate seed.sql với full schema:
--   1. Cài Supabase CLI: brew install supabase/tap/supabase
--   2. Authenticate: supabase login
--   3. Dump: supabase db dump --project-ref jyohocjsnsyfgfsmjfqx \
--              --schema-only > supabase/seed.sql
--
-- TypeScript types cho toàn bộ schema: lib/database.types.ts (8537 lines)
-- Tham khảo schema cho từng table: lib/database.types.ts → Database['public']['Tables']
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 4. DANH SÁCH 140 TABLES (tham khảo, không phải DDL)
-- Trạng thái RLS: tất cả 140 tables đều có RLS = ENABLED (audit 2026-04-28)
-- ─────────────────────────────────────────────────────────────
/*
  agent_configs            agent_memories           agent_task_activities
  agent_task_attachments   agent_tasks              agent_telegram_configs
  ai_agent_skills          ai_agent_tasks           ai_agents
  ai_conversations         ai_knowledge_bases       ai_logs
  ai_messages              ai_models                ai_permissions
  ai_rules                 ai_skills                ai_workflows
  analytics_daily_summaries analytics_events        analytics_sessions
  app_documents            application_evaluations   applications
  attendance_records       attendance_settings       audit_logs
  bim_models               brands                   business_trip_expenses
  business_trip_members    business_trips            candidates
  chat_members             chat_messages             chat_reactions
  chat_rooms               checklists                cms_banners
  cms_categories           cms_core_values           cms_events
  cms_media                cms_menus                 cms_milestones
  cms_nav_items            cms_pages                 cms_partners
  cms_posts                cms_product_domains       cms_products
  cms_services             cms_settings              company_vehicles
  contact_submissions      contract_business_plans   contract_documents
  contract_milestone_triggers contract_relations     contract_reviews
  contract_sequences       contract_tags             contract_task_definitions
  contracts                cost_adjustments          cross_unit_visibility
  customer_contacts        customers                 departments
  discussions              document_chunks           document_registry
  drive_folder_mappings    employee_assets           employee_contracts
  employee_documents       employee_qualifications   employee_salary_history
  employee_targets         employees                 entity_registry
  execution_cost_types     folders                   historical_production
  hr_reviews               insurance_records         internal_requests
  job_openings             kpi_goals                 leave_balances
  leave_policies           leave_requests            leave_types
  lists                    meeting_rooms             notifications
  onboarding_checklist_items onboarding_checklists   onboarding_tasks
  onboarding_templates     openclaw_instances        openclaw_logs
  overtime_requests        payments                  payroll_runs
  payslips                 performance_cycles        performance_reviews
  post_categories          product_categories        product_editions
  product_lines            product_suppliers         products
  profiles                 project_members           projects
  public_holidays          reports                   role_permission_defaults
  room_bookings            salary_components         spaces
  task_activities          task_approval_logs        task_attachments
  task_automation_rules    task_comments             task_dependencies
  task_links               task_personal_tags        task_statuses
  task_templates           task_time_entries         task_watchers
  tasks                    tax_records               telegram_bot_audit
  telegram_otp             time_entries              units
  user_permissions         vehicle_bookings          web_posts
*/
