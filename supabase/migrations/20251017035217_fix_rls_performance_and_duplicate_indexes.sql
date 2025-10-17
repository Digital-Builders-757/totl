-- Fix RLS performance issues by optimizing auth function calls
-- Replace auth.<function>() with (select auth.<function>()) for better performance

-- Fix bookings table RLS policies
DROP POLICY IF EXISTS "Update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Insert own bookings" ON public.bookings;

-- Recreate with optimized auth function calls
CREATE POLICY "Update own bookings" ON public.bookings
    FOR UPDATE USING ((select auth.uid()) = talent_id);

CREATE POLICY "Insert own bookings" ON public.bookings
    FOR INSERT WITH CHECK ((select auth.uid()) = talent_id);

-- Fix portfolio_items table RLS policies
DROP POLICY IF EXISTS "Update own portfolio items" ON public.portfolio_items;
DROP POLICY IF EXISTS "Insert own portfolio items" ON public.portfolio_items;

-- Recreate with optimized auth function calls
CREATE POLICY "Update own portfolio items" ON public.portfolio_items
    FOR UPDATE USING ((select auth.uid()) = talent_id);

CREATE POLICY "Insert own portfolio items" ON public.portfolio_items
    FOR INSERT WITH CHECK ((select auth.uid()) = talent_id);

-- Remove duplicate indexes to improve performance
-- Drop duplicate indexes on applications table
DROP INDEX IF EXISTS applications_gig_idx;
DROP INDEX IF EXISTS applications_talent_idx;

-- Drop duplicate indexes on bookings table  
DROP INDEX IF EXISTS bookings_gig_idx;

-- Keep the more descriptive index names:
-- applications_gig_id_idx, applications_talent_id_idx
-- bookings_gig_id_idx
