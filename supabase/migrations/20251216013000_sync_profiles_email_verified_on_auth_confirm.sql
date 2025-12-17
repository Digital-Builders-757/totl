-- =====================================================
-- Sync profiles.email_verified when auth.users.email_confirmed_at changes
-- =====================================================
-- Date: 2025-12-16
-- Purpose:
--   - Backfill any existing mismatches between auth.users.email_confirmed_at and profiles.email_verified
--   - Keep profiles.email_verified automatically in sync going forward (no dependency on /auth/callback)

BEGIN;

-- 1) One-time backfill for existing users (idempotent)
UPDATE public.profiles p
SET email_verified = (u.email_confirmed_at IS NOT NULL)
FROM auth.users u
WHERE u.id = p.id
  AND p.email_verified IS DISTINCT FROM (u.email_confirmed_at IS NOT NULL);

-- 2) Trigger function: sync on confirmation changes (idempotent; only updates when value differs)
CREATE OR REPLACE FUNCTION public.sync_profiles_email_verified_from_auth_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE public.profiles
  SET email_verified = (NEW.email_confirmed_at IS NOT NULL)
  WHERE id = NEW.id
    AND email_verified IS DISTINCT FROM (NEW.email_confirmed_at IS NOT NULL);

  RETURN NEW;
END;
$$;

-- 3) Trigger: fires when email_confirmed_at changes
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.sync_profiles_email_verified_from_auth_users();

COMMIT;


