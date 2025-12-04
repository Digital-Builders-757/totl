-- =====================================================
-- TOTL Agency - Add ON DELETE CASCADE Constraints
-- =====================================================
-- Date: 2024-12-04
-- Purpose: Ensure all foreign keys cascade on delete to maintain data integrity
--          when users are deleted from auth.users or profiles
--
-- IMPORTANT NOTES:
-- 1. This alters existing constraints - run in a maintenance window
-- 2. RLS policies are not affected by these changes
-- 3. Deletes initiated by service_role (admin dashboard, server) will cascade
-- 4. Auth schema tables (identities, sessions, etc.) are Supabase-managed
--    and may have restrictions - test carefully before applying auth schema changes
-- =====================================================

BEGIN;

-- =====================================================
-- 1. PUBLIC SCHEMA - From auth.users to public.profiles
-- =====================================================

-- Ensure profiles.id cascades when auth.users is deleted
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey,
  ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- =====================================================
-- 2. PUBLIC SCHEMA - From public.profiles to child tables
-- =====================================================

-- talent_profiles.user_id -> profiles.id
ALTER TABLE public.talent_profiles
  DROP CONSTRAINT IF EXISTS talent_profiles_user_id_fkey,
  ADD CONSTRAINT talent_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- client_profiles.user_id -> profiles.id
ALTER TABLE public.client_profiles
  DROP CONSTRAINT IF EXISTS client_profiles_user_id_fkey,
  ADD CONSTRAINT client_profiles_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- applications.talent_id -> profiles.id
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_talent_id_fkey,
  ADD CONSTRAINT applications_talent_id_fkey
    FOREIGN KEY (talent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- bookings.talent_id -> profiles.id
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_talent_id_fkey,
  ADD CONSTRAINT bookings_talent_id_fkey
    FOREIGN KEY (talent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- portfolio_items.talent_id -> profiles.id
ALTER TABLE public.portfolio_items
  DROP CONSTRAINT IF EXISTS portfolio_items_talent_id_fkey,
  ADD CONSTRAINT portfolio_items_talent_id_fkey
    FOREIGN KEY (talent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- gigs.client_id -> profiles.id
ALTER TABLE public.gigs
  DROP CONSTRAINT IF EXISTS gigs_client_id_fkey,
  ADD CONSTRAINT gigs_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =====================================================
-- 3. PUBLIC SCHEMA - Direct references to auth.users
-- =====================================================

-- gig_notifications.user_id -> auth.users.id
ALTER TABLE public.gig_notifications
  DROP CONSTRAINT IF EXISTS gig_notifications_user_id_fkey,
  ADD CONSTRAINT gig_notifications_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- content_flags.reporter_id -> profiles.id (already has CASCADE, but ensure it's set)
-- Only apply if content_flags table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_flags'
  ) THEN
    ALTER TABLE public.content_flags
      DROP CONSTRAINT IF EXISTS content_flags_reporter_id_fkey,
      ADD CONSTRAINT content_flags_reporter_id_fkey
        FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.content_flags
      DROP CONSTRAINT IF EXISTS content_flags_assigned_admin_id_fkey,
      ADD CONSTRAINT content_flags_assigned_admin_id_fkey
        FOREIGN KEY (assigned_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- 4. AUTH SCHEMA - Supabase-managed tables
-- =====================================================
-- WARNING: These tables are managed by Supabase Auth.
-- Modifying their constraints may cause issues or be reverted by Supabase updates.
-- Test thoroughly before applying in production.
-- Consider if these are necessary - Supabase may handle cascading internally.

-- identities.user_id -> users.id
-- ALTER TABLE auth.identities
--   DROP CONSTRAINT IF EXISTS identities_user_id_fkey,
--   ADD CONSTRAINT identities_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- sessions.user_id -> users.id
-- ALTER TABLE auth.sessions
--   DROP CONSTRAINT IF EXISTS sessions_user_id_fkey,
--   ADD CONSTRAINT sessions_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- refresh_tokens.session_id -> sessions.id
-- ALTER TABLE auth.refresh_tokens
--   DROP CONSTRAINT IF EXISTS refresh_tokens_session_id_fkey,
--   ADD CONSTRAINT refresh_tokens_session_id_fkey
--     FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;

-- mfa_factors.user_id -> users.id
-- ALTER TABLE auth.mfa_factors
--   DROP CONSTRAINT IF EXISTS mfa_factors_user_id_fkey,
--   ADD CONSTRAINT mfa_factors_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- mfa_challenges.factor_id -> mfa_factors.id
-- ALTER TABLE auth.mfa_challenges
--   DROP CONSTRAINT IF EXISTS mfa_challenges_auth_factor_id_fkey,
--   ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey
--     FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;

-- one_time_tokens.user_id -> users.id
-- ALTER TABLE auth.one_time_tokens
--   DROP CONSTRAINT IF EXISTS one_time_tokens_user_id_fkey,
--   ADD CONSTRAINT one_time_tokens_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- flow_state.user_id -> users.id
-- ALTER TABLE auth.flow_state
--   DROP CONSTRAINT IF EXISTS flow_state_user_id_fkey,
--   ADD CONSTRAINT flow_state_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- oauth_authorizations.user_id -> users.id
-- ALTER TABLE auth.oauth_authorizations
--   DROP CONSTRAINT IF EXISTS oauth_authorizations_user_id_fkey,
--   ADD CONSTRAINT oauth_authorizations_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- oauth_consents.user_id -> users.id
-- ALTER TABLE auth.oauth_consents
--   DROP CONSTRAINT IF EXISTS oauth_consents_user_id_fkey,
--   ADD CONSTRAINT oauth_consents_user_id_fkey
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (run after migration)
-- =====================================================
-- Verify all constraints have CASCADE:
--
-- SELECT
--   tc.table_schema,
--   tc.table_name,
--   tc.constraint_name,
--   rc.delete_rule
-- FROM information_schema.table_constraints tc
-- JOIN information_schema.referential_constraints rc
--   ON tc.constraint_name = rc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND (
--     tc.table_schema = 'public' AND (
--       tc.table_name IN ('profiles', 'talent_profiles', 'client_profiles', 
--                         'applications', 'bookings', 'portfolio_items', 
--                         'gigs', 'gig_notifications')
--     )
--   )
-- ORDER BY tc.table_schema, tc.table_name;

