-- PR #3: Auth bootstrap contract (DB trigger + profile guarantees)
--
-- Goals:
-- 1) Make it impossible for signup/login to land in a "user exists but profile missing" limbo.
-- 2) Ensure ALL new auth users deterministically become Talent in the app domain.
-- 3) Prevent privilege escalation via auth metadata (no client/admin roles at signup).
--
-- Contract:
-- - On INSERT into auth.users, we ALWAYS ensure:
--   - public.profiles exists
--   - profiles.role = 'talent'
--   - profiles.account_type = 'talent'
--   - public.talent_profiles exists
-- - Idempotent: safe to run if rows already exist (ON CONFLICT).
--
-- Notes:
-- - Client (Career Builder) access is granted ONLY via the admin approval action in the app layer.
-- - This migration is intentionally defensive against schema drift (adds account_type enum/column if missing).

BEGIN;

-- -----------------------------------------------------------------------------
-- Ensure account_type schema exists (generated types already assume it exists)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'account_type_enum'
  ) THEN
    CREATE TYPE public.account_type_enum AS ENUM ('unassigned', 'talent', 'client');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'account_type'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN account_type public.account_type_enum NOT NULL DEFAULT 'unassigned';
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- Ensure 1:1 uniqueness for role-specific tables (needed for ON CONFLICT)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.talent_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.talent_profiles'::regclass
        AND contype = 'u'
        AND conname = 'talent_profiles_user_id_key'
    ) THEN
      ALTER TABLE public.talent_profiles
        ADD CONSTRAINT talent_profiles_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.client_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conrelid = 'public.client_profiles'::regclass
        AND contype = 'u'
        AND conname = 'client_profiles_user_id_key'
    ) THEN
      ALTER TABLE public.client_profiles
        ADD CONSTRAINT client_profiles_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- Auth bootstrap trigger: always create Talent app identity
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_first_name text;
  user_last_name text;
  display_name text;
  verified boolean;
BEGIN
  -- Extract names from auth metadata with safe defaults
  user_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');

  -- Build display_name deterministically
  IF user_first_name IS NOT NULL AND user_first_name <> '' AND user_last_name IS NOT NULL AND user_last_name <> '' THEN
    display_name := user_first_name || ' ' || user_last_name;
  ELSIF user_first_name IS NOT NULL AND user_first_name <> '' THEN
    display_name := user_first_name;
  ELSIF user_last_name IS NOT NULL AND user_last_name <> '' THEN
    display_name := user_last_name;
  ELSE
    display_name := split_part(NEW.email, '@', 1);
  END IF;

  verified := (NEW.email_confirmed_at IS NOT NULL);

  -- ALWAYS create Talent profiles row (no client/admin at signup)
  INSERT INTO public.profiles (id, role, account_type, display_name, email_verified)
  VALUES (
    NEW.id,
    'talent'::public.user_role,
    'talent'::public.account_type_enum,
    display_name,
    verified
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role = 'talent'::public.user_role,
    account_type = 'talent'::public.account_type_enum,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
    -- never downgrade verification
    email_verified = COALESCE(public.profiles.email_verified, false) OR COALESCE(EXCLUDED.email_verified, false);

  -- ALWAYS create talent_profiles row (idempotent)
  INSERT INTO public.talent_profiles (user_id, first_name, last_name)
  VALUES (NEW.id, user_first_name, user_last_name)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Permissions: function is executed by trigger, but we keep explicit execute grant for tooling.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;

COMMIT;
