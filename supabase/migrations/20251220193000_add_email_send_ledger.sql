-- Add email send ledger for durable throttle + one-click-one-send enforcement
-- Migration: 20251220193000_add_email_send_ledger.sql
-- Date: 2025-12-20
--
-- Why:
-- - Provide provable, DB-backed idempotency for public-callable email sends (verification + password reset).
-- - Ensure "one click → one send" across multi-instance/serverless by using an atomic unique claim key.
-- - Provide an ops/debug trail without creating a new user-facing data surface.
--
-- Notes:
-- - Route handlers use the Supabase service role (server-only) to write ledger rows.
-- - RLS is enabled; no user-facing policies are added.

CREATE TABLE IF NOT EXISTS public.email_send_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  purpose text NOT NULL,
  recipient_email text NOT NULL,
  user_id uuid,
  idempotency_key text NOT NULL,
  cooldown_bucket timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'claimed',
  provider_message_id text,
  meta jsonb
);

ALTER TABLE public.email_send_ledger ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_send_ledger
  ADD CONSTRAINT email_send_ledger_purpose_check
  CHECK (purpose IN ('verify_email','password_reset'));

ALTER TABLE public.email_send_ledger
  ADD CONSTRAINT email_send_ledger_status_check
  CHECK (status IN ('claimed','sent','failed'));

-- Heart of enforcement: at most one claim per (purpose + normalized email + cooldown bucket)
ALTER TABLE public.email_send_ledger
  ADD CONSTRAINT email_send_ledger_idempotency_key_key UNIQUE (idempotency_key);

CREATE INDEX IF NOT EXISTS email_send_ledger_lookup_idx
  ON public.email_send_ledger (purpose, recipient_email, cooldown_bucket DESC);

COMMENT ON TABLE public.email_send_ledger IS 'Email send ledger (durable throttle + idempotency) for public email routes.';
COMMENT ON COLUMN public.email_send_ledger.purpose IS 'verify_email | password_reset.';
COMMENT ON COLUMN public.email_send_ledger.recipient_email IS 'Normalized (lowercased) recipient email address.';
COMMENT ON COLUMN public.email_send_ledger.idempotency_key IS 'Unique claim key: purpose:recipient_email:cooldown_bucket_iso.';
COMMENT ON COLUMN public.email_send_ledger.cooldown_bucket IS 'Rounded bucket timestamp (cooldown window marker).';

