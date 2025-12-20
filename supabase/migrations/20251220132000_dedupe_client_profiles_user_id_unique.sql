-- =====================================================
-- TOTL Agency - Deduplicate client_profiles.user_id uniqueness guard
-- =====================================================
-- Date (UTC): 2025-12-20
-- Purpose:
-- - Remove redundant UNIQUE constraints on public.client_profiles(user_id).
-- - Keep the canonical constraint name: client_profiles_user_id_key
-- - Drop legacy/alternate naming: client_profiles_user_id_uniq
--
-- Why:
-- - Duplicate UNIQUE constraints create extra indexes/overhead and confusing drift.
-- - ON CONFLICT(user_id) only needs one UNIQUE guard.
--
BEGIN;

ALTER TABLE public.client_profiles
  DROP CONSTRAINT IF EXISTS client_profiles_user_id_uniq;

COMMIT;

