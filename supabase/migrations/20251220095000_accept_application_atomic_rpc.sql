-- =====================================================
-- TOTL Agency - Applications Acceptance Atomic RPC
-- =====================================================
-- Date (UTC): 2025-12-20
-- Purpose:
-- 1) Enforce booking idempotency at the DB layer via a unique (gig_id, talent_id) guard.
-- 2) Provide a SECURITY DEFINER RPC that:
--    - verifies the caller owns the gig for the given application
--    - creates (or reuses) the booking exactly once
--    - updates the application status to 'accepted'
--    - returns the booking id (idempotent on retries)
--
-- Why:
-- - bookings RLS currently only allows talent inserts, so client-driven booking creation
--   must happen via a server-only DB primitive that enforces ownership.
-- - Verified contract requirement: acceptance is atomic + idempotent.

BEGIN;

-- -----------------------------------------------------
-- 1) DB idempotency guard: unique booking per (gig_id, talent_id)
-- -----------------------------------------------------
-- Use a unique index + constraint (idempotent migration).
CREATE UNIQUE INDEX IF NOT EXISTS bookings_gig_id_talent_id_unique_idx
  ON public.bookings (gig_id, talent_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_gig_talent_unique'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_gig_talent_unique
      UNIQUE USING INDEX bookings_gig_id_talent_id_unique_idx;
  END IF;
END$$;

-- -----------------------------------------------------
-- 2) Atomic + idempotent acceptance RPC
-- -----------------------------------------------------
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
SET search_path = public, auth
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
    -- 28000 = invalid authorization specification
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
    -- 42501 = insufficient_privilege
    RAISE EXCEPTION 'Forbidden' USING errcode = '42501';
  END IF;

  did_accept := (v_current_status <> 'accepted');

  -- Default booking date: 7 days from now (matches existing app behavior).
  v_effective_date := COALESCE(booking_date, (NOW() + INTERVAL '7 days'));

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

  -- Update the application status. This is part of the same transaction as the booking upsert.
  UPDATE public.applications
  SET status = 'accepted'::public.application_status
  WHERE id = v_app_id;

  booking_id := v_booking_id;
  application_status := 'accepted'::public.application_status;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_application_and_create_booking(uuid, timestamptz, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_application_and_create_booking(uuid, timestamptz, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_application_and_create_booking(uuid, timestamptz, numeric, text) TO service_role;

COMMIT;

