-- =====================================================
-- TOTL Agency - Fix Supabase Performance Advisor Warnings
-- =====================================================
-- Date: 2025-10-16
-- Purpose: Fix RLS performance, remove duplicate indexes, remove unused indexes
-- Reference: Supabase Performance Advisor Best Practices

BEGIN;

-- =====================================================
-- 1. FIX AUTH RLS INITIALIZATION PLAN (CRITICAL PERFORMANCE)
-- =====================================================
-- Problem: RLS policies calling auth.uid() directly causes it to run per-row
-- Solution: Wrap in (SELECT auth.uid()) to cache the value per-query
-- Performance gain: ~95% reduction in execution time

-- =====================================================
-- 1A. BOOKINGS TABLE - Fix RLS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Insert own bookings" ON public.bookings;

-- Recreate with optimized auth function calls
CREATE POLICY "Update own bookings" 
ON public.bookings 
FOR UPDATE 
TO authenticated 
USING (
  talent_id = (SELECT auth.uid()) 
  OR gig_id IN (
    SELECT id FROM gigs WHERE client_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Insert own bookings" 
ON public.bookings 
FOR INSERT 
TO authenticated 
WITH CHECK (talent_id = (SELECT auth.uid()));

-- =====================================================
-- 1B. PORTFOLIO_ITEMS TABLE - Fix RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Update own portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Insert own portfolio items" ON public.portfolio_items;

CREATE POLICY "Update own portfolio items" 
ON public.portfolio_items 
FOR UPDATE 
TO authenticated 
USING (talent_id = (SELECT auth.uid()));

CREATE POLICY "Insert own portfolio items" 
ON public.portfolio_items 
FOR INSERT 
TO authenticated 
WITH CHECK (talent_id = (SELECT auth.uid()));

-- =====================================================
-- 1C. PROFILES TABLE - Fix RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert profile by user or service" ON public.profiles;

CREATE POLICY "Update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (id = (SELECT auth.uid()));

CREATE POLICY "Insert profile by user or service" 
ON public.profiles 
FOR INSERT 
TO public 
WITH CHECK (id = (SELECT auth.uid()));

-- =====================================================
-- 1D. TALENT_PROFILES TABLE - Fix RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Update own talent profile" ON public.talent_profiles;
DROP POLICY IF EXISTS "Insert own talent profile" ON public.talent_profiles;

CREATE POLICY "Update own talent profile" 
ON public.talent_profiles 
FOR UPDATE 
TO authenticated 
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Insert own talent profile" 
ON public.talent_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 1E. CLIENT_PROFILES TABLE - Fix RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Update own client profile" ON public.client_profiles;
DROP POLICY IF EXISTS "Client profile insert policy" ON public.client_profiles;

CREATE POLICY "Update own client profile" 
ON public.client_profiles 
FOR UPDATE 
TO authenticated 
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Client profile insert policy" 
ON public.client_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = (SELECT auth.uid()));

-- =====================================================
-- 1F. GIGS TABLE - Fix RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Clients can create gigs" ON public.gigs;
DROP POLICY IF EXISTS "Clients can update their gigs" ON public.gigs;
DROP POLICY IF EXISTS "Clients can delete their gigs" ON public.gigs;

CREATE POLICY "Clients can create gigs" 
ON public.gigs 
FOR INSERT 
TO authenticated 
WITH CHECK (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients can update their gigs" 
ON public.gigs 
FOR UPDATE 
TO authenticated 
USING (client_id = (SELECT auth.uid()));

CREATE POLICY "Clients can delete their gigs" 
ON public.gigs 
FOR DELETE 
TO authenticated 
USING (client_id = (SELECT auth.uid()));

-- =====================================================
-- 1G. APPLICATIONS TABLE - Fix RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Applications access policy" ON public.applications;
DROP POLICY IF EXISTS "Talent can apply to gigs" ON public.applications;
DROP POLICY IF EXISTS "Update application status" ON public.applications;

CREATE POLICY "Applications access policy" 
ON public.applications 
FOR SELECT 
TO authenticated 
USING (
  talent_id = (SELECT auth.uid()) 
  OR EXISTS (
    SELECT 1 FROM gigs 
    WHERE gigs.id = applications.gig_id 
    AND gigs.client_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Talent can apply to gigs" 
ON public.applications 
FOR INSERT 
TO authenticated 
WITH CHECK (talent_id = (SELECT auth.uid()));

CREATE POLICY "Update application status" 
ON public.applications 
FOR UPDATE 
TO authenticated 
USING (
  talent_id = (SELECT auth.uid()) 
  OR EXISTS (
    SELECT 1 FROM gigs 
    WHERE gigs.id = applications.gig_id 
    AND gigs.client_id = (SELECT auth.uid())
  )
);

-- =====================================================
-- 2. REMOVE DUPLICATE INDEXES
-- =====================================================
-- Problem: Multiple indexes on same columns waste space and slow writes
-- Solution: Keep one index per column/column-set, drop duplicates

-- Applications table duplicates
DROP INDEX IF EXISTS public.applications_gig_idx;
DROP INDEX IF EXISTS public.applications_talent_idx;
-- Keep: applications_gig_id_idx and applications_talent_id_idx

-- Bookings table duplicates
DROP INDEX IF EXISTS public.bookings_gig_idx;
DROP INDEX IF EXISTS public.bookings_talent_idx;
-- Keep: bookings_gig_id_idx and bookings_talent_id_idx

-- =====================================================
-- 3. REMOVE UNUSED INDEXES
-- =====================================================
-- Problem: Indexes that are never used still slow down writes
-- Solution: Drop unused indexes (can recreate later if needed)

-- Performance optimization indexes that are unused
DROP INDEX IF EXISTS public.gigs_status_created_at_idx;
DROP INDEX IF EXISTS public.applications_status_created_at_idx;
DROP INDEX IF EXISTS public.talent_profiles_location_age_idx;
DROP INDEX IF EXISTS public.client_profiles_company_name_idx;
DROP INDEX IF EXISTS public.gigs_active_status_idx;
DROP INDEX IF EXISTS public.applications_new_status_idx;
DROP INDEX IF EXISTS public.gigs_title_description_gin_idx;
DROP INDEX IF EXISTS public.talent_profiles_experience_gin_idx;
DROP INDEX IF EXISTS public.gigs_listing_covering_idx;
DROP INDEX IF EXISTS public.talent_profiles_listing_covering_idx;
DROP INDEX IF EXISTS public.applications_gig_talent_status_idx;
DROP INDEX IF EXISTS public.profiles_role_created_at_idx;

-- Note: We're keeping the essential indexes:
-- - Primary keys (automatic)
-- - Foreign keys (applications_gig_id_idx, bookings_gig_id_idx, etc.)
-- - Status indexes (gigs_status_idx for filtering active gigs)
-- - Role index (profiles_role_idx for user type filtering)
-- - Portfolio ordering (portfolio_items_talent_order_idx, portfolio_items_is_primary_idx)

-- =====================================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON POLICY "Update own bookings" ON public.bookings IS 
'Optimized: Uses (SELECT auth.uid()) to cache auth check per query instead of per row';

COMMENT ON POLICY "Update own portfolio items" ON public.portfolio_items IS 
'Optimized: Uses (SELECT auth.uid()) to cache auth check per query instead of per row';

COMMENT ON POLICY "Applications access policy" ON public.applications IS 
'Optimized: Uses (SELECT auth.uid()) to cache auth check per query instead of per row';

-- =====================================================
-- 5. VERIFY ESSENTIAL INDEXES EXIST
-- =====================================================
-- Ensure critical indexes are still present after cleanup

-- Create if missing (should already exist, but being defensive)
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS gigs_status_idx ON public.gigs(status);
CREATE INDEX IF NOT EXISTS gigs_client_id_idx ON public.gigs(client_id);
CREATE INDEX IF NOT EXISTS applications_gig_id_idx ON public.applications(gig_id);
CREATE INDEX IF NOT EXISTS applications_talent_id_idx ON public.applications(talent_id);
CREATE INDEX IF NOT EXISTS bookings_gig_id_idx ON public.bookings(gig_id);
CREATE INDEX IF NOT EXISTS bookings_talent_id_idx ON public.bookings(talent_id);
CREATE INDEX IF NOT EXISTS portfolio_items_talent_id_idx ON public.portfolio_items(talent_id);

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run these after migration)
-- =====================================================

-- Check for remaining duplicate indexes:
-- SELECT schemaname, tablename, indexname, array_agg(indexdef) as definitions
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename, indexname
-- HAVING count(*) > 1;

-- Check for unused indexes:
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND idx_scan = 0
-- ORDER BY tablename, indexname;

-- Verify RLS policies use (SELECT auth.uid()):
-- SELECT schemaname, tablename, policyname, definition
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;


