-- Fix RLS policies for client_applications table
-- Allow authenticated users to insert their own client applications
-- This fixes the issue where authenticated users get RLS errors when submitting Career Builder applications
--
-- Date: 2025-12-09
-- Purpose: Allow authenticated users (non-admins) to insert client applications matching their email

-- Step 1: Verify table exists and RLS is enabled
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'client_applications'
    ) THEN
        RAISE EXCEPTION 'Table client_applications does not exist. Please create it first.';
    END IF;

    -- Enable RLS if not already enabled
    ALTER TABLE public.client_applications ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'RLS enabled on client_applications table';
END $$;

-- Step 2: Ensure proper grants exist
GRANT INSERT ON public.client_applications TO authenticated;
GRANT INSERT ON public.client_applications TO anon;
GRANT SELECT ON public.client_applications TO authenticated;
GRANT SELECT ON public.client_applications TO anon;

-- Step 3: Drop existing policies if they exist (safe to run multiple times)
DROP POLICY IF EXISTS "Public can insert client applications" ON public.client_applications;
DROP POLICY IF EXISTS "Allow anonymous users to insert applications" ON public.client_applications;
DROP POLICY IF EXISTS "Authenticated users can insert own client applications" ON public.client_applications;
DROP POLICY IF EXISTS "Authenticated users can view own client applications" ON public.client_applications;

-- Step 4: Create new policies

-- Allow authenticated users to insert client applications if the email matches their account
-- This policy allows authenticated users (non-admins) to submit Career Builder applications
CREATE POLICY "Authenticated users can insert own client applications" 
    ON public.client_applications
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        -- Allow if email matches authenticated user's email (case-insensitive)
        -- Handle NULL cases safely
        auth.uid() IS NOT NULL 
        AND email IS NOT NULL
        AND LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    );

-- Allow anonymous/public users to insert client applications (for non-authenticated signups)
CREATE POLICY "Public can insert client applications" 
    ON public.client_applications
    FOR INSERT 
    TO anon
    WITH CHECK (true);

-- Allow authenticated users to view their own client applications (by email match)
CREATE POLICY "Authenticated users can view own client applications" 
    ON public.client_applications
    FOR SELECT 
    TO authenticated
    USING (
        -- Allow if email matches authenticated user's email (case-insensitive)
        -- Handle NULL cases safely
        auth.uid() IS NOT NULL 
        AND email IS NOT NULL
        AND LOWER(TRIM(email)) = LOWER(TRIM((SELECT email FROM auth.users WHERE id = auth.uid())))
    );

-- Note: Admin policies remain unchanged - admins can still view and manage all client applications
-- The "Admins can manage client applications" policy uses FOR ALL which includes INSERT, UPDATE, DELETE
-- PostgreSQL evaluates policies with OR logic, so authenticated users can insert via the new policy above
-- even if they're not admins

-- Step 5: Verify policies were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'client_applications';
    
    RAISE NOTICE 'Total RLS policies on client_applications: %', policy_count;
    
    IF policy_count < 3 THEN
        RAISE WARNING 'Expected at least 3 policies, but found %. Please check manually.', policy_count;
    END IF;
END $$;

