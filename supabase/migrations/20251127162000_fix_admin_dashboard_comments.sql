-- Migration: Fix admin dashboard comment concatenation
-- Date: 2025-11-27
-- Description: Postgres COMMENT statements can't use string concatenation.
--              Set the materialized view and helper function comments
--              explicitly so migrations run cleanly in fresh environments.

BEGIN;

COMMENT ON MATERIALIZED VIEW public.admin_dashboard_cache IS
  'Admin dashboard statistics cache. Access restricted to service_role only. Client access should be through authenticated API routes with admin role verification.';

COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS
  'Safely retrieves admin dashboard statistics with role verification. Only users with admin role can execute this function.';

COMMIT;

