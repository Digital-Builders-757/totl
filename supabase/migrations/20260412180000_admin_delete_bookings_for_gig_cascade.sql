-- =====================================================
-- TOTL Agency - Admin DELETE on bookings (gig cascade)
-- =====================================================
-- Date (UTC): 2026-04-12
-- Problem:
--   Deleting a gig cascades to bookings (ON DELETE CASCADE), but public.bookings
--   had no DELETE policy — RLS can block those cascaded deletes even for admins.
-- Fix:
--   Allow DELETE on bookings when the caller is an admin (uses totl_user_is_admin()
--   from migration 20260411220101_fix_admin_gigs_rls_and_helpers.sql).

BEGIN;

DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;

CREATE POLICY "Admins can delete bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (public.totl_user_is_admin());

COMMIT;
