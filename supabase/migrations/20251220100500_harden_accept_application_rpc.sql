-- =====================================================
-- TOTL Agency - Harden accept_application_and_create_booking RPC
-- =====================================================
-- Date (UTC): 2025-12-20
-- Purpose:
-- - SECURITY DEFINER hardening: tighten search_path to `public, pg_temp`
-- - Contract enforcement: prevent invalid terminal transition `rejected → accepted`
--
-- NOTE:
-- - This migration intentionally *replaces* the function created in:
--   `20251220095000_accept_application_atomic_rpc.sql`
-- - We never edit existing migrations; we layer a new one.

BEGIN;

CREATE OR REPLACE FUNCTION public.accept_application_and_create_booking(
  application_id uuid,
  booking_date timestamptz DEFAULT NULL,
  booking_compensation numeric DEFAULT NULL,
  booking_notes text DEFAULT NULL
)
RETURNS TABLE (
  booking_id uuid,
  application_status public.application_status,
  did_accept boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_actor_id uuid;
  v_app_id uuid;
  v_gig_id uuid;
  v_talent_id uuid;
  v_client_id uuid;
  v_current_status public.application_status;
  v_booking_id uuid;
  v_effective_date timestamptz;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized' USING errcode = '28000';
  END IF;

  -- Lock the application row for the duration of this txn to avoid races.
  SELECT
    a.id,
    a.gig_id,
    a.talent_id,
    a.status,
    g.client_id
  INTO
    v_app_id,
    v_gig_id,
    v_talent_id,
    v_current_status,
    v_client_id
  FROM public.applications a
  JOIN public.gigs g ON g.id = a.gig_id
  WHERE a.id = application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING errcode = 'P0002';
  END IF;

  IF v_client_id <> v_actor_id THEN
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  -- VERIFIED transition guard:
  -- Forbidden: rejected → accepted (terminal)
  IF v_current_status = 'rejected'::public.application_status THEN
    RAISE EXCEPTION 'Cannot accept a rejected application' USING errcode = 'P0001';
  END IF;

  -- Allowed: accepted → accepted (idempotent retry; did_accept=false)
  did_accept := (v_current_status <> 'accepted'::public.application_status);

  -- Default booking date: 7 days from now (matches existing app behavior).
  v_effective_date := COALESCE(booking_date, (CURRENT_TIMESTAMP + INTERVAL '7 days'));

  -- Insert booking if missing; on retries, reuse the existing booking.
  INSERT INTO public.bookings (
    gig_id,
    talent_id,
    status,
    date,
    compensation,
    notes
  )
  VALUES (
    v_gig_id,
    v_talent_id,
    'confirmed'::public.booking_status,
    v_effective_date,
    booking_compensation,
    booking_notes
  )
  ON CONFLICT (gig_id, talent_id) DO NOTHING
  RETURNING id INTO v_booking_id;

  IF v_booking_id IS NULL THEN
    SELECT b.id
    INTO v_booking_id
    FROM public.bookings b
    WHERE b.gig_id = v_gig_id
      AND b.talent_id = v_talent_id;
  END IF;

  IF v_booking_id IS NULL THEN
    RAISE EXCEPTION 'Booking missing after upsert' USING errcode = 'P0001';
  END IF;

  UPDATE public.applications
  SET status = 'accepted'::public.application_status
  WHERE id = v_app_id;

  booking_id := v_booking_id;
  application_status := 'accepted'::public.application_status;
  RETURN NEXT;
END;
$$;

-- Preserve posture: least privilege execution
REVOKE ALL ON FUNCTION public.accept_application_and_create_booking(uuid, timestamptz, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_application_and_create_booking(uuid, timestamptz, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_application_and_create_booking(uuid, timestamptz, numeric, text) TO service_role;

COMMIT;

