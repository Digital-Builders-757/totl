-- =====================================================
-- TOTL Agency - Client Application Decision + Promotion RPCs (VERIFIED primitive)
-- =====================================================
-- Date (UTC): 2025-12-20
-- Purpose:
-- - Provide DB-enforced atomic + idempotent admin decision primitives for Career Builder applications.
-- - Make promotion "can't lie": one transaction updates:
--   - client_applications.status/admin_notes
--   - profiles.role/account_type
--   - client_profiles provisioning (idempotent upsert)
--
-- VERIFIED rules implemented:
-- - Allowed: pending -> approved (promote) ; approved -> approved (idempotent no-op)
-- - Forbidden (terminal guards):
--   - rejected -> approved (P0001)
--   - approved -> rejected (P0001)
-- - Caller must be authenticated AND an admin (profiles.role='admin') (42501 on violation)
-- - Hardened SECURITY DEFINER posture: search_path = public, pg_temp
--
-- NOTE:
-- - We intentionally avoid scanning auth.users by email; the authoritative target is
--   client_applications.user_id (contracted in generated types).
--
BEGIN;

-- -----------------------------------------------------
-- 1) Schema guards required for idempotent upserts
-- -----------------------------------------------------

-- Ensure client_applications has an explicit user_id link (needed for promotion targeting).
-- This is additive and makes local resets consistent with production types.
ALTER TABLE public.client_applications
  ADD COLUMN IF NOT EXISTS user_id uuid;

DO $$
BEGIN
  -- Add the FK only if missing (idempotent migration).
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_applications_user_id_fkey'
      AND conrelid = 'public.client_applications'::regclass
  ) THEN
    ALTER TABLE public.client_applications
      ADD CONSTRAINT client_applications_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- Ensure client_profiles supports ON CONFLICT(user_id) upsert deterministically.
-- (Auth bootstrap contract already enforces this; we keep a defensive idempotent guard.)
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
END$$;

-- -----------------------------------------------------
-- 2) Approve + promote (atomic + idempotent)
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_client_application_and_promote(
  p_application_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS TABLE (
  application_id uuid,
  user_id uuid,
  application_status text,
  did_decide boolean,
  did_promote boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid;
  v_is_admin boolean;
  v_status text;
  v_user_id uuid;
  v_first_name text;
  v_last_name text;
  v_email text;
  v_company_name text;
  v_industry text;
  v_website text;
  v_phone text;
  v_contact_name text;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    -- 28000 = invalid authorization specification
    RAISE EXCEPTION 'Unauthorized' USING errcode = '28000';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor_id
      AND p.role = 'admin'::public.user_role
  )
  INTO v_is_admin;

  IF NOT v_is_admin THEN
    -- 42501 = insufficient_privilege
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  -- Lock the application row to prevent double decisions racing.
  SELECT
    ca.status,
    ca.user_id,
    ca.first_name,
    ca.last_name,
    ca.email,
    ca.company_name,
    ca.industry,
    ca.website,
    ca.phone
  INTO
    v_status,
    v_user_id,
    v_first_name,
    v_last_name,
    v_email,
    v_company_name,
    v_industry,
    v_website,
    v_phone
  FROM public.client_applications ca
  WHERE ca.id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- P0002 = no_data_found
    RAISE EXCEPTION 'Application not found' USING errcode = 'P0002';
  END IF;

  IF v_user_id IS NULL THEN
    -- Defensive: production should always have user_id for app-driven submissions.
    RAISE EXCEPTION 'Application missing user_id' USING errcode = 'P0001';
  END IF;

  -- Terminal guard: rejected -> approved is forbidden
  IF v_status = 'rejected' THEN
    RAISE EXCEPTION 'Cannot approve a rejected application' USING errcode = 'P0001';
  END IF;

  -- Idempotent retry: approved -> approved (no-op; no new side effects)
  IF v_status = 'approved' THEN
    application_id := p_application_id;
    user_id := v_user_id;
    application_status := v_status;
    did_decide := false;
    did_promote := false;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Only pending -> approved is supported.
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot approve application in status %', v_status USING errcode = 'P0001';
  END IF;

  -- Decision write
  UPDATE public.client_applications
  SET
    status = 'approved',
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_application_id;

  -- Promotion write
  UPDATE public.profiles
  SET
    role = 'client'::public.user_role,
    account_type = 'client'::public.account_type_enum,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_user_id;

  -- Provision client_profiles (idempotent)
  v_contact_name := NULLIF(TRIM(COALESCE(v_first_name, '') || ' ' || COALESCE(v_last_name, '')), '');

  INSERT INTO public.client_profiles (
    user_id,
    company_name,
    industry,
    website,
    contact_name,
    contact_email,
    contact_phone
  )
  VALUES (
    v_user_id,
    COALESCE(v_company_name, ''),
    v_industry,
    v_website,
    v_contact_name,
    v_email,
    v_phone
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    company_name = EXCLUDED.company_name,
    industry = EXCLUDED.industry,
    website = EXCLUDED.website,
    contact_name = EXCLUDED.contact_name,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    updated_at = CURRENT_TIMESTAMP;

  application_id := p_application_id;
  user_id := v_user_id;
  application_status := 'approved';
  did_decide := true;
  did_promote := true;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_client_application_and_promote(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_client_application_and_promote(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_client_application_and_promote(uuid, text) TO service_role;

-- -----------------------------------------------------
-- 3) Reject (atomic decision + terminal guard)
-- -----------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_client_application(
  p_application_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS TABLE (
  application_id uuid,
  user_id uuid,
  application_status text,
  did_decide boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid;
  v_is_admin boolean;
  v_status text;
  v_user_id uuid;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '28000';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor_id
      AND p.role = 'admin'::public.user_role
  )
  INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  SELECT ca.status, ca.user_id
  INTO v_status, v_user_id
  FROM public.client_applications ca
  WHERE ca.id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING errcode = 'P0002';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application missing user_id' USING errcode = 'P0001';
  END IF;

  -- Terminal guard: approved -> rejected is forbidden
  IF v_status = 'approved' THEN
    RAISE EXCEPTION 'Cannot reject an approved application' USING errcode = 'P0001';
  END IF;

  -- Idempotent retry: rejected -> rejected (no-op; no new side effects)
  IF v_status = 'rejected' THEN
    application_id := p_application_id;
    user_id := v_user_id;
    application_status := v_status;
    did_decide := false;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Only pending -> rejected is supported.
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot reject application in status %', v_status USING errcode = 'P0001';
  END IF;

  UPDATE public.client_applications
  SET
    status = 'rejected',
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_application_id;

  application_id := p_application_id;
  user_id := v_user_id;
  application_status := 'rejected';
  did_decide := true;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.reject_client_application(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reject_client_application(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_client_application(uuid, text) TO service_role;

COMMIT;

