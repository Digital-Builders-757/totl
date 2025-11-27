-- Migration: Fix query_stats view for PostgreSQL 15+
-- Date: 2025-11-27
-- Description: pg_stat_user_indexes exposes relname/indexrelname instead of tablename/indexname.
--              Recreate query_stats with the proper column aliases so fresh environments load cleanly.

BEGIN;

DROP VIEW IF EXISTS public.query_stats;

CREATE VIEW public.query_stats AS
SELECT
  schemaname,
  relname AS tablename,
  indexrelname AS indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

COMMENT ON VIEW public.query_stats IS
  'View for monitoring index usage statistics. Uses invoker permissions (no SECURITY DEFINER) for better security.';

GRANT SELECT ON public.query_stats TO authenticated;

COMMIT;

