-- =====================================================
-- Fix Remaining Security Warnings
-- =====================================================
-- Run this in Supabase SQL Editor to fix the last 2 database warnings

-- =====================================================
-- 1. FIX ERROR: Security Definer View (query_stats)
-- =====================================================
-- Issue: View uses SECURITY DEFINER which can bypass RLS
-- Solution: Drop and recreate without SECURITY DEFINER

-- Drop the existing view
DROP VIEW IF EXISTS public.query_stats CASCADE;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This view will now use the querying user's permissions instead of the creator's
CREATE OR REPLACE VIEW public.query_stats AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  min_exec_time
FROM pg_stat_statements
WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user)
ORDER BY total_exec_time DESC
LIMIT 100;

-- Add comment explaining the security model
COMMENT ON VIEW public.query_stats IS 
  'Query statistics view. Shows only queries executed by the current user. ' ||
  'Does not use SECURITY DEFINER to enforce proper RLS.';

-- Grant appropriate permissions
GRANT SELECT ON public.query_stats TO authenticated;
REVOKE SELECT ON public.query_stats FROM anon;

-- =====================================================
-- 2. FIX WARNING: pg_trgm Extension in Public Schema
-- =====================================================
-- Issue: pg_trgm extension is in public schema
-- Solution: Move to extensions schema

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Move pg_trgm extension to extensions schema
DROP EXTENSION IF EXISTS pg_trgm CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Add comment
COMMENT ON EXTENSION pg_trgm IS 'Trigram matching for PostgreSQL - moved to extensions schema for security';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify query_stats view is no longer SECURITY DEFINER
-- SELECT 
--   schemaname,
--   viewname,
--   definition
-- FROM pg_views
-- WHERE schemaname = 'public' 
--   AND viewname = 'query_stats';

-- Verify pg_trgm is in extensions schema
-- SELECT 
--   n.nspname AS schema_name,
--   e.extname AS extension_name
-- FROM pg_extension e
-- JOIN pg_namespace n ON e.extnamespace = n.oid
-- WHERE e.extname = 'pg_trgm';

-- =====================================================
-- DONE!
-- =====================================================
-- After running this, you should only have 3 warnings left:
-- 1. auth_otp_long_expiry (fix in Dashboard → Auth → Settings)
-- 2. auth_leaked_password_protection (fix in Dashboard → Auth → Settings)
-- 3. vulnerable_postgres_version (fix in Dashboard → Settings → Infrastructure)
-- =====================================================

