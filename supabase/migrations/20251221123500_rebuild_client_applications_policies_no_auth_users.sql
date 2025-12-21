-- =====================================================
-- TOTL Agency - Rebuild client_applications RLS policies (purge any auth.users references)
-- =====================================================
-- Date (UTC): 2025-12-21
-- Purpose:
-- - Some environments may contain out-of-band / legacy RLS policies on public.client_applications.
-- - We drop ALL existing policies on client_applications, then recreate a minimal, law-aligned set:
--   - AUTH REQUIRED: authenticated users can insert/select only their own rows via user_id = auth.uid()
--   - Admins can view/update all rows via profiles.role = 'admin'
-- - This guarantees there are NO RLS references to auth.users (fixes 42501 permission denied for table users).

BEGIN;

-- Align grants with AUTH REQUIRED decision.
REVOKE INSERT ON public.client_applications FROM anon;
REVOKE SELECT ON public.client_applications FROM anon;
GRANT INSERT ON public.client_applications TO authenticated;
GRANT SELECT ON public.client_applications TO authenticated;

-- Drop ALL existing policies on this table (covers legacy/manual policy drift).
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'client_applications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.client_applications', pol.policyname);
  END LOOP;
END$$;

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

-- Admins can view all applications (needed for /admin/client-applications).
CREATE POLICY "Allow admins to view applications"
  ON public.client_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'::public.user_role
    )
  );

-- Admins can update applications (notes/status) (needed for approval workflow).
CREATE POLICY "Allow admins to update applications"
  ON public.client_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'::public.user_role
    )
  );

COMMIT;


