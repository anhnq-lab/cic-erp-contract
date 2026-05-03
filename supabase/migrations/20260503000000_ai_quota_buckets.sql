-- Migration: 20260503000000_ai_quota_buckets.sql
-- Purpose: AI rate limiting per user (Phase 5 Task 5.1)
-- Tracks request counts and cost per time bucket (minute/hour/day)
-- ─────────────────────────────────────────────────────────────────

-- ── 1. Quota buckets table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_quota_buckets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_type  TEXT        NOT NULL CHECK (bucket_type IN ('minute', 'hour', 'day')),
  bucket_key   TEXT        NOT NULL,          -- e.g. '2026-05-03-14-30' for minute
  count        INTEGER     NOT NULL DEFAULT 0,
  cost_usd     NUMERIC(10, 4) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, bucket_type, bucket_key)
);

CREATE INDEX IF NOT EXISTS idx_ai_quota_user_bucket
  ON ai_quota_buckets (user_id, bucket_type, bucket_key);

-- RLS: Users can only read their own quota; writes via SECURITY DEFINER RPC only
ALTER TABLE ai_quota_buckets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quota"
  ON ai_quota_buckets FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- ── 2. Cleanup function (called by pg_cron daily) ─────────────────
CREATE OR REPLACE FUNCTION cleanup_old_quota_buckets()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM ai_quota_buckets
  WHERE created_at < NOW() - INTERVAL '7 days';
$$;

-- Schedule daily cleanup at 02:00 UTC (requires pg_cron extension)
-- Uncomment when pg_cron is enabled on the project:
-- SELECT cron.schedule('cleanup-ai-quota', '0 2 * * *', 'SELECT cleanup_old_quota_buckets()');

-- ── 3. check_and_increment_ai_quota RPC ──────────────────────────
-- Returns:
--   allowed     BOOLEAN  — whether the request should proceed
--   reason      TEXT     — human-readable rejection reason (null if allowed)
--   current_count INT    — current count in the most-restrictive bucket
--   limit_count   INT    — limit that was hit (null if allowed)
CREATE OR REPLACE FUNCTION check_and_increment_ai_quota(
  p_user_id       UUID,
  p_estimated_cost NUMERIC DEFAULT 0
)
RETURNS TABLE (
  allowed       BOOLEAN,
  reason        TEXT,
  current_count INTEGER,
  limit_count   INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_minute_count INTEGER;
  v_hour_count   INTEGER;
  v_day_cost     NUMERIC;
  v_role         TEXT;

  -- Default limits (standard users)
  v_minute_limit  INTEGER := 20;
  v_hour_limit    INTEGER := 200;
  v_day_cost_limit NUMERIC := 5.0;  -- USD

  -- Bucket keys
  v_min_key  TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD-HH24-MI');
  v_hour_key TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD-HH24');
  v_day_key  TEXT := to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
BEGIN
  -- Look up user role for elevated limits
  SELECT role INTO v_role
  FROM profiles
  WHERE id = p_user_id
  LIMIT 1;

  -- Elevated limits for Admin / Leadership
  IF v_role IN ('Admin', 'Leadership', 'GD') THEN
    v_minute_limit   := 60;
    v_hour_limit     := 1000;
    v_day_cost_limit := 50.0;
  END IF;

  -- Read current bucket values
  SELECT count INTO v_minute_count
  FROM ai_quota_buckets
  WHERE user_id = p_user_id AND bucket_type = 'minute' AND bucket_key = v_min_key;

  SELECT count INTO v_hour_count
  FROM ai_quota_buckets
  WHERE user_id = p_user_id AND bucket_type = 'hour' AND bucket_key = v_hour_key;

  SELECT cost_usd INTO v_day_cost
  FROM ai_quota_buckets
  WHERE user_id = p_user_id AND bucket_type = 'day' AND bucket_key = v_day_key;

  -- ── Check limits ──────────────────────────────────────────────
  IF COALESCE(v_minute_count, 0) >= v_minute_limit THEN
    RETURN QUERY SELECT
      false,
      'Vượt quota phút: ' || v_minute_limit || ' request/phút. Vui lòng thử lại sau.'::TEXT,
      COALESCE(v_minute_count, 0),
      v_minute_limit;
    RETURN;
  END IF;

  IF COALESCE(v_hour_count, 0) >= v_hour_limit THEN
    RETURN QUERY SELECT
      false,
      'Vượt quota giờ: ' || v_hour_limit || ' request/giờ.'::TEXT,
      COALESCE(v_hour_count, 0),
      v_hour_limit;
    RETURN;
  END IF;

  IF COALESCE(v_day_cost, 0) + p_estimated_cost > v_day_cost_limit THEN
    RETURN QUERY SELECT
      false,
      'Vượt quota chi phí ngày: $' || v_day_cost_limit || '/ngày.'::TEXT,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- ── Increment buckets (upsert) ────────────────────────────────
  INSERT INTO ai_quota_buckets (user_id, bucket_type, bucket_key, count, cost_usd)
    VALUES (p_user_id, 'minute', v_min_key, 1, 0)
    ON CONFLICT (user_id, bucket_type, bucket_key)
    DO UPDATE SET count = ai_quota_buckets.count + 1;

  INSERT INTO ai_quota_buckets (user_id, bucket_type, bucket_key, count, cost_usd)
    VALUES (p_user_id, 'hour', v_hour_key, 1, 0)
    ON CONFLICT (user_id, bucket_type, bucket_key)
    DO UPDATE SET count = ai_quota_buckets.count + 1;

  INSERT INTO ai_quota_buckets (user_id, bucket_type, bucket_key, count, cost_usd)
    VALUES (p_user_id, 'day', v_day_key, 0, p_estimated_cost)
    ON CONFLICT (user_id, bucket_type, bucket_key)
    DO UPDATE SET cost_usd = ai_quota_buckets.cost_usd + p_estimated_cost;

  RETURN QUERY SELECT true, NULL::TEXT, NULL::INTEGER, NULL::INTEGER;
END;
$$;

-- Grant execute to authenticated users (RPC is SECURITY DEFINER so it runs as owner)
GRANT EXECUTE ON FUNCTION check_and_increment_ai_quota(UUID, NUMERIC) TO authenticated;

COMMENT ON TABLE ai_quota_buckets IS
  'AI request quota tracking per user. Buckets: minute (20 req), hour (200 req), day ($5 USD). '
  'Elevated limits for Admin/Leadership roles. Auto-cleanup after 7 days.';

COMMENT ON FUNCTION check_and_increment_ai_quota IS
  'Atomically check and increment AI quota buckets. '
  'Returns allowed=true if within limits, false with reason if exceeded. '
  'Call before every AI gateway request.';
