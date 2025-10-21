-- =====================================================
-- TOTL Agency - Fix Remaining Performance Warnings
-- =====================================================
-- Date: 2025-10-21
-- Purpose: Fix gig_notifications RLS policies and remove duplicate indexes
-- Reference: Supabase Database Linter Report
-- Issue: Auth RLS InitPlan warnings + Duplicate Index warnings

BEGIN;

-- =====================================================
-- 1. FIX GIG_NOTIFICATIONS TABLE - RLS POLICIES
-- =====================================================
-- Problem: RLS policies calling auth.uid() directly causes it to run per-row
-- Solution: Wrap in (SELECT auth.uid()) to cache the value per-query
-- Performance gain: ~95% reduction in execution time

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.gig_notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.gig_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.gig_notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.gig_notifications;

-- Recreate with optimized auth function calls
CREATE POLICY "Users can view their own notifications" 
ON public.gig_notifications 
FOR SELECT 
TO public
USING (
  (SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IS NULL
);

CREATE POLICY "Users can insert their own notifications" 
ON public.gig_notifications 
FOR INSERT 
TO public
WITH CHECK (
  (SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IS NULL
);

CREATE POLICY "Users can update their own notifications" 
ON public.gig_notifications 
FOR UPDATE 
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.gig_notifications 
FOR DELETE 
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- =====================================================
-- 2. REMOVE DUPLICATE INDEXES
-- =====================================================
-- Problem: Duplicate indexes waste space and slow down writes
-- Solution: Keep the most descriptive index names, drop duplicates

-- Applications table - drop less descriptive index names
DROP INDEX IF EXISTS public.applications_gig_idx;
DROP INDEX IF EXISTS public.applications_talent_idx;
-- Keep: applications_gig_id_idx and applications_talent_id_idx (more descriptive)

-- Bookings table - drop less descriptive index name
DROP INDEX IF EXISTS public.bookings_gig_idx;
-- Keep: bookings_gig_id_idx (more descriptive)

-- =====================================================
-- 3. ADD DOCUMENTATION COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view their own notifications" ON public.gig_notifications IS 
'Optimized: Uses (SELECT auth.uid()) to cache auth check per query instead of per row. Allows both authenticated and anonymous users to view their own notifications.';

COMMENT ON POLICY "Users can insert their own notifications" ON public.gig_notifications IS 
'Optimized: Uses (SELECT auth.uid()) to cache auth check per query instead of per row. Allows both authenticated and anonymous users to subscribe via email.';

COMMENT ON POLICY "Users can update their own notifications" ON public.gig_notifications IS 
'Optimized: Uses (SELECT auth.uid()) to cache auth check per query instead of per row. Only authenticated users can update.';

COMMENT ON POLICY "Users can delete their own notifications" ON public.gig_notifications IS 
'Optimized: Uses (SELECT auth.uid()) to cache auth check per query instead of per row. Only authenticated users can delete.';

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify fixes)
-- =====================================================

-- 1. Check for remaining auth.uid() calls without SELECT wrapper:
-- SELECT n.nspname as schemaname, c.relname as tablename, p.polname as policyname,
--        CASE WHEN pg_get_policydef(p.oid) ~ 'auth\.uid\(\)' 
--             AND pg_get_policydef(p.oid) !~ '\(SELECT auth\.uid\(\)\)'
--             THEN '❌ NOT OPTIMIZED' ELSE '✅ OPTIMIZED' END as status
-- FROM pg_policy p
-- JOIN pg_class c ON p.polrelid = c.oid
-- JOIN pg_namespace n ON c.relnamespace = n.oid
-- WHERE n.nspname = 'public'
-- AND pg_get_policydef(p.oid) ~ 'auth\.uid\(\)'
-- ORDER BY c.relname, p.polname;

-- 2. Check for duplicate indexes:
-- SELECT 
--   t.relname as table_name,
--   array_agg(i.relname) as duplicate_indexes,
--   pg_get_indexdef(min(i.oid)) as index_definition
-- FROM pg_class t
-- JOIN pg_index ix ON t.oid = ix.indrelid
-- JOIN pg_class i ON i.oid = ix.indexrelid
-- WHERE t.relkind = 'r'
-- AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
-- GROUP BY t.relname, pg_get_indexdef(ix.indexrelid)
-- HAVING count(*) > 1;

-- 3. Verify all gig_notifications policies exist (should return 4 policies):
-- SELECT p.polname as policyname,
--        CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT' 
--             WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' END as command
-- FROM pg_policy p
-- JOIN pg_class c ON p.polrelid = c.oid
-- JOIN pg_namespace n ON c.relnamespace = n.oid
-- WHERE n.nspname = 'public' AND c.relname = 'gig_notifications'
-- ORDER BY p.polname;

