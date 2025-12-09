-- Fix RLS policies for client_applications table
-- Allow authenticated users to insert their own client applications
-- This fixes the issue where authenticated users get RLS errors when submitting Career Builder applications
--
-- Date: 2025-12-09
-- Purpose: Allow authenticated users (non-admins) to insert client applications matching their email

-- Ensure RLS is enabled
ALTER TABLE public.client_applications ENABLE ROW LEVEL SECURITY;

-- Ensure proper grants exist
GRANT INSERT ON public.client_applications TO authenticated;
GRANT INSERT ON public.client_applications TO anon;
GRANT SELECT ON public.client_applications TO authenticated;
GRANT SELECT ON public.client_applications TO anon;

-- Drop the existing "Public can insert client applications" policy if it exists
-- We'll replace it with separate policies for authenticated and anonymous users
DROP POLICY IF EXISTS "Public can insert client applications" ON public.client_applications;
DROP POLICY IF EXISTS "Allow anonymous users to insert applications" ON public.client_applications;
DROP POLICY IF EXISTS "Authenticated users can insert own client applications" ON public.client_applications;
DROP POLICY IF EXISTS "Authenticated users can view own client applications" ON public.client_applications;

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

