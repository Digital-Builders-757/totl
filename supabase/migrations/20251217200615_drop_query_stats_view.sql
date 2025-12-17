-- =====================================================
-- Drop query_stats view (security advisor remediation)
-- =====================================================
-- Date: 2025-12-17
-- Purpose: Remove public.query_stats entirely (not needed) and eliminate
--          any risk of SECURITY DEFINER / owner-context access.
-- Notes:
-- - Intentionally NO CASCADE: if anything depends on this view, the migration
--   should fail loudly so we can remove/replace that dependency explicitly.

BEGIN;

-- Remove the view if it exists
DROP VIEW IF EXISTS public.query_stats;

COMMIT;
