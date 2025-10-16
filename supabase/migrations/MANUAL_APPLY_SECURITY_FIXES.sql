-- =====================================================
-- MANUAL MIGRATION: Supabase Security Fixes
-- =====================================================
-- Copy and paste this entire file into Supabase Dashboard → SQL Editor
-- Then click "Run" to apply all security fixes
-- =====================================================

-- =====================================================
-- 1. Fix Function Search Path Mutable Warnings
-- =====================================================

-- Fix: update_bookings_updated_at
DROP FUNCTION IF EXISTS public.update_bookings_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_bookings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_bookings_updated_at();

-- Fix: update_portfolio_items_updated_at
DROP FUNCTION IF EXISTS public.update_portfolio_items_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_portfolio_items_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_portfolio_items_updated_at ON public.portfolio_items;
CREATE TRIGGER update_portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_portfolio_items_updated_at();

-- Fix: handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'talent'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix: set_updated_at
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers for all tables using this function
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.talent_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.talent_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.client_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.gigs;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.applications;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Fix: refresh_admin_dashboard_cache
DROP FUNCTION IF EXISTS public.refresh_admin_dashboard_cache() CASCADE;
CREATE OR REPLACE FUNCTION public.refresh_admin_dashboard_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_cache;
END;
$$;

-- Fix: update_modified_column
DROP FUNCTION IF EXISTS public.update_modified_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: analyze_tables
DROP FUNCTION IF EXISTS public.analyze_tables() CASCADE;
CREATE OR REPLACE FUNCTION public.analyze_tables()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  ANALYZE public.profiles;
  ANALYZE public.talent_profiles;
  ANALYZE public.client_profiles;
  ANALYZE public.gigs;
  ANALYZE public.applications;
  ANALYZE public.bookings;
  ANALYZE public.portfolio_items;
END;
$$;

-- Fix: get_slow_queries
DROP FUNCTION IF EXISTS public.get_slow_queries() CASCADE;
CREATE OR REPLACE FUNCTION public.get_slow_queries()
RETURNS TABLE (
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pg_stat_statements.query::text,
    pg_stat_statements.calls,
    pg_stat_statements.total_exec_time as total_time,
    pg_stat_statements.mean_exec_time as mean_time
  FROM pg_stat_statements
  ORDER BY pg_stat_statements.total_exec_time DESC
  LIMIT 20;
END;
$$;

-- =====================================================
-- 2. Secure Materialized View - admin_dashboard_cache
-- =====================================================

-- Drop and recreate the materialized view
DROP MATERIALIZED VIEW IF EXISTS public.admin_dashboard_cache CASCADE;

CREATE MATERIALIZED VIEW public.admin_dashboard_cache AS
SELECT
  (SELECT COUNT(*) FROM public.profiles) as total_users,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'talent') as total_talent,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'client') as total_clients,
  (SELECT COUNT(*) FROM public.gigs) as total_gigs,
  (SELECT COUNT(*) FROM public.gigs WHERE status = 'active') as active_gigs,
  (SELECT COUNT(*) FROM public.applications) as total_applications,
  (SELECT COUNT(*) FROM public.bookings) as total_bookings,
  NOW() as last_updated;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX admin_dashboard_cache_unique_idx ON public.admin_dashboard_cache (last_updated);

-- Revoke all public access
REVOKE ALL ON public.admin_dashboard_cache FROM anon;
REVOKE ALL ON public.admin_dashboard_cache FROM authenticated;
REVOKE ALL ON public.admin_dashboard_cache FROM public;

-- Set owner
ALTER MATERIALIZED VIEW public.admin_dashboard_cache OWNER TO postgres;

-- Add comment
COMMENT ON MATERIALIZED VIEW public.admin_dashboard_cache IS 
  'Admin dashboard statistics cache. Access restricted to service_role only. ' ||
  'Client access should be through authenticated API routes with admin role verification.';

-- =====================================================
-- 3. Create Secure Admin Dashboard Access Function
-- =====================================================

DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats() CASCADE;
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
  total_users bigint,
  total_talent bigint,
  total_clients bigint,
  total_gigs bigint,
  active_gigs bigint,
  total_applications bigint,
  total_bookings bigint,
  last_updated timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the current user's role
  SELECT p.role INTO user_role
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Only allow admin users to access this data
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Return the cached dashboard data
  RETURN QUERY
  SELECT * FROM public.admin_dashboard_cache;
END;
$$;

-- Grant execute permission only to authenticated users
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_admin_dashboard_stats() FROM anon;

COMMENT ON FUNCTION public.get_admin_dashboard_stats() IS 
  'Safely retrieves admin dashboard statistics with role verification. ' ||
  'Only users with admin role can execute this function.';

-- =====================================================
-- 4. Move pg_trgm Extension (Optional - if needed)
-- =====================================================
-- NOTE: Only run this if you're using pg_trgm extension
-- This requires superuser privileges

-- Uncomment the following lines if you want to move pg_trgm:

-- CREATE SCHEMA IF NOT EXISTS extensions;
-- DROP EXTENSION IF EXISTS pg_trgm CASCADE;
-- CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;
-- GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- After running the migration, run these to verify:

-- 1. Check that functions have search_path set
-- SELECT
--   n.nspname as schema,
--   p.proname as function_name,
--   CASE 
--     WHEN proconfig IS NOT NULL AND array_to_string(proconfig, ',') LIKE '%search_path%' 
--     THEN '✅ Set'
--     ELSE '❌ Not Set'
--   END as search_path_status
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.prokind = 'f'
-- ORDER BY p.proname;

-- 2. Verify materialized view is populated
-- SELECT * FROM public.admin_dashboard_cache;

-- 3. Test secure access function (as admin user)
-- SELECT * FROM public.get_admin_dashboard_stats();

-- =====================================================
-- SUCCESS! 
-- =====================================================
-- All automated security fixes have been applied.
-- 
-- Remember to also complete the manual dashboard fixes:
-- 1. Reduce OTP expiry (Dashboard → Auth → Settings)
-- 2. Enable leaked password protection (Dashboard → Auth → Settings)
-- 3. Upgrade Postgres version (Dashboard → Settings → Infrastructure)
-- =====================================================

