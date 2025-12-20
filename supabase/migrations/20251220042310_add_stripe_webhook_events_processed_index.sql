-- Add a partial index to speed up the monotonic "latest processed event" lookup
-- Migration: 20251220042310_add_stripe_webhook_events_processed_index.sql
-- Date: 2025-12-20
--
-- Why:
-- The webhook handler queries:
--   WHERE customer_id = ? AND status = 'processed'
--   ORDER BY stripe_created DESC
--   LIMIT 1
--
-- This partial index ensures the query remains fast as the ledger grows.

CREATE INDEX IF NOT EXISTS stripe_webhook_events_customer_processed_created_idx
  ON public.stripe_webhook_events (customer_id, stripe_created DESC)
  WHERE customer_id IS NOT NULL AND status = 'processed';

