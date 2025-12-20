-- Add Stripe webhook event ledger + DB locks for subscription fields
-- Migration: 20251220033929_add_stripe_webhook_events_ledger.sql
-- Date: 2025-12-20
--
-- Why:
-- - Provide provable idempotency for Stripe webhooks via a DB-backed event ledger (unique event_id).
-- - Provide an operations/debugging trail for “Stripe delivered but user not upgraded”.
-- - Prevent authenticated users from mutating Stripe/subscription entitlement fields in `public.profiles`.
--
-- Notes:
-- - The webhook handler uses the Supabase service role (server-only) and is allowed to write these fields.
-- - RLS is enabled on the ledger table; no user-facing policies are added.

-- 1) Stripe webhook event ledger
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  type text NOT NULL,
  stripe_created bigint NOT NULL,
  livemode boolean,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'processing',
  error text,
  customer_id text,
  subscription_id text,
  checkout_session_id text
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.stripe_webhook_events
  ADD CONSTRAINT stripe_webhook_events_event_id_key UNIQUE (event_id);

ALTER TABLE public.stripe_webhook_events
  ADD CONSTRAINT stripe_webhook_events_status_check
  CHECK (status IN ('processing','processed','failed','ignored'));

-- Monotonic/out-of-order checks per customer
CREATE INDEX IF NOT EXISTS stripe_webhook_events_customer_created_idx
  ON public.stripe_webhook_events (customer_id, stripe_created DESC)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS stripe_webhook_events_status_idx
  ON public.stripe_webhook_events (status);

COMMENT ON TABLE public.stripe_webhook_events IS 'Stripe webhook processing ledger (idempotency + debugging).';
COMMENT ON COLUMN public.stripe_webhook_events.event_id IS 'Stripe event.id (unique idempotency key).';
COMMENT ON COLUMN public.stripe_webhook_events.type IS 'Stripe event.type.';
COMMENT ON COLUMN public.stripe_webhook_events.stripe_created IS 'Stripe event.created (unix seconds).';
COMMENT ON COLUMN public.stripe_webhook_events.received_at IS 'When TOTL received the webhook.';
COMMENT ON COLUMN public.stripe_webhook_events.processed_at IS 'When TOTL finished processing this event.';
COMMENT ON COLUMN public.stripe_webhook_events.status IS 'processing | processed | failed | ignored.';
COMMENT ON COLUMN public.stripe_webhook_events.error IS 'Failure/ignore reason.';
COMMENT ON COLUMN public.stripe_webhook_events.customer_id IS 'Stripe customer id (if available).';
COMMENT ON COLUMN public.stripe_webhook_events.subscription_id IS 'Stripe subscription id (if available).';
COMMENT ON COLUMN public.stripe_webhook_events.checkout_session_id IS 'Stripe checkout session id (if available).';

-- 2) DB lock: prevent user-level updates to Stripe/subscription fields on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_stripe_fields_user_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Allow the server-side service role (webhooks/admin server actions).
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block any attempt to mutate system-managed Stripe/subscription fields.
  IF (NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id)
    OR (NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id)
    OR (NEW.subscription_status IS DISTINCT FROM OLD.subscription_status)
    OR (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan)
    OR (NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end)
  THEN
    RAISE EXCEPTION 'Stripe/subscription fields are system-managed and cannot be modified by users';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_stripe_fields_lock ON public.profiles;

CREATE TRIGGER profiles_stripe_fields_lock
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_stripe_fields_user_update();

COMMENT ON FUNCTION public.prevent_profile_stripe_fields_user_update() IS 'Blocks user-level updates to Stripe/subscription entitlement fields in public.profiles.';
