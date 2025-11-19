-- Add admin RLS policies for applications tables
-- This migration restores admin access that was accidentally removed
-- in migration 20251016172507_fix_performance_advisor_warnings.sql
--
-- Date: 2025-11-18
-- Purpose: Allow admins to view and manage all applications

-- =====================================================
-- APPLICATIONS TABLE - Admin Policies
-- =====================================================

-- Admins can view all applications (talent applications to gigs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Admins can view all applications'
  ) THEN
    CREATE POLICY "Admins can view all applications"
      ON public.applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;

-- Admins can manage all applications (INSERT, UPDATE, DELETE)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'applications'
      AND policyname = 'Admins can manage all applications'
  ) THEN
    CREATE POLICY "Admins can manage all applications"
      ON public.applications
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;

-- =====================================================
-- CLIENT_APPLICATIONS TABLE - Verify Admin Policies
-- =====================================================

-- Admins can view all client applications (client signup applications)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_applications'
      AND policyname = 'Admins can view client applications'
  ) THEN
    CREATE POLICY "Admins can view client applications"
      ON public.client_applications
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;

-- Admins can manage all client applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_applications'
      AND policyname = 'Admins can manage client applications'
  ) THEN
    CREATE POLICY "Admins can manage client applications"
      ON public.client_applications
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
      );
  END IF;
END$$;
