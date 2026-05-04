-- External casting calls ingestion scaffold
-- Date: 2026-05-04
-- Why:
-- 1) Create a review-queue table for externally sourced casting opportunities.
-- 2) Support AI-summarized/legal-safe copy before publishing.
-- 3) Keep ingestion idempotent by enforcing unique source_url.

BEGIN;

CREATE TABLE IF NOT EXISTS public.external_casting_calls (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  source_url text UNIQUE,
  studio_name text,
  production_title text,
  role_data jsonb,
  is_editorial boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending_review',
  ai_summary text
);

COMMENT ON TABLE public.external_casting_calls IS
  'Imported external casting opportunities queued for admin review before publication.';
COMMENT ON COLUMN public.external_casting_calls.source_url IS
  'Original source page URL; unique to prevent duplicate ingestion.';
COMMENT ON COLUMN public.external_casting_calls.role_data IS
  'Structured role metadata extracted from source content.';
COMMENT ON COLUMN public.external_casting_calls.ai_summary IS
  'LLM-generated legal-safe summary used for on-platform display.';

CREATE INDEX IF NOT EXISTS external_casting_calls_status_idx
  ON public.external_casting_calls (status);

CREATE INDEX IF NOT EXISTS external_casting_calls_studio_name_idx
  ON public.external_casting_calls (studio_name);

COMMIT;
