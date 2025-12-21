-- =====================================================
-- TOTL Agency - Fix approve_client_application_and_promote() (ambiguous user_id)
-- =====================================================
-- Date (UTC): 2025-12-21
-- Purpose:
-- - Fix SQLSTATE 42702: "column reference \"user_id\" is ambiguous" when approving Career Builder applications.
-- - Root cause: RETURNS TABLE exposes `user_id` as a PL/pgSQL variable, which clashes with column references
--   in `ON CONFLICT (user_id)`.
-- - Fix: use `ON CONFLICT ON CONSTRAINT client_profiles_user_id_key` instead of column target.

BEGIN;

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

  -- Lock application row to prevent race conditions.
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
    RAISE EXCEPTION 'Application not found' USING errcode = 'P0002';
  END IF;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Application missing user_id' USING errcode = 'P0001';
  END IF;

  IF v_status = 'rejected' THEN
    RAISE EXCEPTION 'Cannot approve a rejected application' USING errcode = 'P0001';
  END IF;

  IF v_status = 'approved' THEN
    application_id := p_application_id;
    user_id := v_user_id;
    application_status := v_status;
    did_decide := false;
    did_promote := false;
    RETURN NEXT;
    RETURN;
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Cannot approve application in status %', v_status USING errcode = 'P0001';
  END IF;

  UPDATE public.client_applications
  SET
    status = 'approved',
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_application_id;

  UPDATE public.profiles
  SET
    role = 'client'::public.user_role,
    account_type = 'client'::public.account_type_enum,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = v_user_id;

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
  ON CONFLICT ON CONSTRAINT client_profiles_user_id_key DO UPDATE
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

COMMIT;


