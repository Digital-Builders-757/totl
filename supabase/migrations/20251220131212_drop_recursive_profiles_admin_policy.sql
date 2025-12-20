-- =====================================================
-- TOTL Agency - Drop recursive profiles admin policy (fix 42P17)
-- =====================================================
-- Date: 2025-12-20
-- Purpose:
--   Remove the self-referential RLS policy on public.profiles that causes:
--     SQLSTATE 42P17: infinite recursion detected in policy for relation "profiles"
--
-- Notes:
--   - This is a "stop the bleeding" fix (Approach A).
--   - The policy was defined as:
--       EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
--     inside a policy ON profiles, which is recursive.
--   - This migration is idempotent.

BEGIN;

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

COMMIT;


