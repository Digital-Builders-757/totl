-- =====================================================
-- Fix query_stats Security Definer Issue
-- =====================================================
-- Date: 2025-12-02
-- Purpose: Remove SECURITY DEFINER from query_stats view
-- Issue: View uses SECURITY DEFINER which bypasses RLS policies
-- Solution: Drop and recreate without SECURITY DEFINER, using invoker permissions

-- Ensure pg_stat_statements extension exists (no-op if already installed)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

BEGIN;

-- Drop the existing view (may have been created with SECURITY DEFINER)
DROP VIEW IF EXISTS public.query_stats CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This ensures the view uses the querying user's permissions (invoker rights)
-- Users will only see their own query statistics for security
CREATE VIEW public.query_stats AS
SELECT
  s.query,
  s.calls,
  s.total_exec_time,
  s.mean_exec_time,
  s.max_exec_time,
  s.min_exec_time
FROM pg_stat_statements AS s
JOIN pg_roles AS r ON r.oid = s.userid
WHERE r.rolname = current_user
ORDER BY s.total_exec_time DESC
LIMIT 100;

-- Add comment explaining the security model (single string literal - no concatenation)
COMMENT ON VIEW public.query_stats IS 'Query statistics view showing queries executed by the current user. Uses invoker permissions (not SECURITY DEFINER); visibility limited by the querying role.';

-- Grant appropriate permissions
-- Only authenticated users can view query stats
GRANT SELECT ON public.query_stats TO authenticated;
REVOKE SELECT ON public.query_stats FROM anon;

COMMIT;

-- =====================================================
-- Verification Query (run separately to verify fix)
-- =====================================================
-- Run this in Supabase SQL Editor to verify the view is NOT SECURITY DEFINER:
-- 
-- SELECT 
--   viewname,
--   definition
-- FROM pg_views
-- WHERE schemaname = 'public'
--   AND viewname = 'query_stats';
--
-- The view should NOT have SECURITY DEFINER in its definition
-- You should see the SELECT with the JOIN to pg_roles and no SECURITY DEFINER clause

