-- Cleanup legacy failed webhook events with missing attempt_count/last_error
-- Migration: 20260205152000_cleanup_legacy_failed_webhook_events.sql
-- Date: 2026-02-05
--
-- Why:
-- - Legacy failed events may have attempt_count = 0 or null and last_error = null
-- - This makes it impossible to track retry attempts and debug failures
-- - One-time cleanup to set proper defaults for existing failed rows
--
-- Notes:
-- - Only affects rows with status = 'failed' that have missing attempt_count or last_error
-- - Sets attempt_count to 1 (assumes first failure)
-- - Sets last_error to a placeholder message if null

UPDATE public.stripe_webhook_events
SET 
  attempt_count = COALESCE(attempt_count, 1),
  last_error = COALESCE(last_error, 'Legacy failure before attempt tracking')
WHERE status = 'failed'
  AND (attempt_count IS NULL OR attempt_count = 0 OR last_error IS NULL);

COMMENT ON COLUMN public.stripe_webhook_events.attempt_count IS 'Number of times Stripe has attempted to deliver this event (for retry limiting). Legacy rows set to 1.';
COMMENT ON COLUMN public.stripe_webhook_events.last_error IS 'Last error message encountered during processing (for debugging). Legacy rows set to placeholder message.';
