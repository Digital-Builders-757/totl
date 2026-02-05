-- Add orphaned status and attempt tracking to Stripe webhook events ledger
-- Migration: 20260205151543_add_orphaned_status_and_attempt_tracking_to_webhook_ledger.sql
-- Date: 2026-02-05
--
-- Why:
-- - Track events for customers without matching profiles (orphaned events)
-- - Enable attempt counting to prevent infinite retries
-- - Store customer email for debugging orphaned events
-- - Fix state machine: ensure "processed" is only set after successful business logic
--
-- Notes:
-- - Status 'orphaned' is for events that cannot be resolved to a profile (test events, deleted users, etc.)
-- - attempt_count tracks how many times Stripe has retried this event
-- - customer_email helps debug orphaned events when customer_id lookup fails

-- 1) Add new columns
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS last_error text;

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS customer_email text;

-- 2) Update status constraint to include 'orphaned'
ALTER TABLE public.stripe_webhook_events
  DROP CONSTRAINT IF EXISTS stripe_webhook_events_status_check;

ALTER TABLE public.stripe_webhook_events
  ADD CONSTRAINT stripe_webhook_events_status_check
  CHECK (status IN ('processing', 'processed', 'failed', 'ignored', 'orphaned'));

-- 3) Add index for orphaned events debugging
CREATE INDEX IF NOT EXISTS stripe_webhook_events_orphaned_idx
  ON public.stripe_webhook_events (status, customer_id, received_at DESC)
  WHERE status = 'orphaned';

-- 4) Add index for attempt tracking
CREATE INDEX IF NOT EXISTS stripe_webhook_events_attempt_count_idx
  ON public.stripe_webhook_events (attempt_count, status)
  WHERE attempt_count > 0;

COMMENT ON COLUMN public.stripe_webhook_events.attempt_count IS 'Number of times Stripe has attempted to deliver this event (for retry limiting).';
COMMENT ON COLUMN public.stripe_webhook_events.last_error IS 'Last error message encountered during processing (for debugging).';
COMMENT ON COLUMN public.stripe_webhook_events.customer_email IS 'Customer email from Stripe event (for debugging orphaned events).';
