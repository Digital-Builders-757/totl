-- =====================================================
-- TOTL Agency - Lock Career Builder applications behind auth + fix D3 RLS
-- =====================================================
-- Date (UTC): 2025-12-21
-- Purpose:
-- - Career Builder application is AUTH REQUIRED (no anonymous submissions).
-- - Remove client_applications policies that reference auth.users (caused 42501 permission denied).
-- - Enforce ownership via client_applications.user_id = auth.uid() for authenticated users.
-- - Keep admin policies intact (admins can still review/approve).

BEGIN;

-- Align grants with AUTH REQUIRED decision.
REVOKE INSERT ON public.client_applications FROM anon;
REVOKE SELECT ON public.client_applications FROM anon;

-- Drop legacy/buggy policies (some exist across historical migrations; drop is idempotent).
DROP POLICY IF EXISTS "Public can insert client applications" ON public.client_applications;
DROP POLICY IF EXISTS "Allow anonymous users to insert applications" ON public.client_applications;
DROP POLICY IF EXISTS "Authenticated users can insert own client applications" ON public.client_applications;
DROP POLICY IF EXISTS "Authenticated users can view own client applications" ON public.client_applications;

-- Authenticated users can insert their own application row (ownership by user_id).
CREATE POLICY "Authenticated users can insert own client applications"
  ON public.client_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Authenticated users can view their own applications (ownership by user_id).
CREATE POLICY "Authenticated users can view own client applications"
  ON public.client_applications
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMIT;


