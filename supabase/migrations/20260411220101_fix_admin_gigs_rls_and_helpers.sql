-- =====================================================
-- TOTL Agency - Harden admin RLS on public.gigs (Sentry TOTLMODELAGENCY-3N)
-- =====================================================
-- Date (UTC): 2026-04-11
-- Problem:
--   Admin server actions (e.g. close gig) could fail with:
--     42501 new row violates row-level security policy for table "gigs"
--   when evaluating legacy policies that subquery public.profiles under RLS.
-- Fix:
--   - Add SECURITY DEFINER helper public.totl_user_is_admin() with fixed search_path.
--   - Replace FOR ALL "Admins can manage all gigs" with explicit SELECT/INSERT/UPDATE/DELETE
--     policies that use the helper for both USING and WITH CHECK on UPDATE.

BEGIN;

CREATE OR REPLACE FUNCTION public.totl_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'::public.user_role
  );
$$;

REVOKE ALL ON FUNCTION public.totl_user_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.totl_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.totl_user_is_admin() TO service_role;

DROP POLICY IF EXISTS "Admins can view all gigs" ON public.gigs;
DROP POLICY IF EXISTS "Admins can manage all gigs" ON public.gigs;

CREATE POLICY "Admins can view all gigs"
ON public.gigs
FOR SELECT
TO authenticated
USING (public.totl_user_is_admin());

CREATE POLICY "Admins can insert gigs"
ON public.gigs
FOR INSERT
TO authenticated
WITH CHECK (public.totl_user_is_admin());

CREATE POLICY "Admins can update gigs"
ON public.gigs
FOR UPDATE
TO authenticated
USING (public.totl_user_is_admin())
WITH CHECK (public.totl_user_is_admin());

CREATE POLICY "Admins can delete gigs"
ON public.gigs
FOR DELETE
TO authenticated
USING (public.totl_user_is_admin());

COMMIT;
