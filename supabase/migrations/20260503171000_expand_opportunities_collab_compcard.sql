-- Expand opportunities + collaboration + comp card support
-- Date: 2026-05-03
-- Why:
-- 1) Add collaboration notification type for on-platform member requests.
-- 2) Add comp-card-specific fields on talent_profiles.
-- 3) Add invite/referral provenance fields for Career Builder applications.

BEGIN;

ALTER TYPE public.notification_type
  ADD VALUE IF NOT EXISTS 'collaboration_request';

ALTER TABLE public.talent_profiles
  ADD COLUMN IF NOT EXISTS bust text,
  ADD COLUMN IF NOT EXISTS hips text,
  ADD COLUMN IF NOT EXISTS waist text,
  ADD COLUMN IF NOT EXISTS suit text,
  ADD COLUMN IF NOT EXISTS resume_link text;

COMMENT ON COLUMN public.talent_profiles.bust IS 'Comp-card bust measurement (free-form text, e.g. 34).';
COMMENT ON COLUMN public.talent_profiles.hips IS 'Comp-card hips measurement (free-form text, e.g. 36).';
COMMENT ON COLUMN public.talent_profiles.waist IS 'Comp-card waist measurement (free-form text, e.g. 26).';
COMMENT ON COLUMN public.talent_profiles.suit IS 'Comp-card suit size (free-form text, e.g. 4 / 38R).';
COMMENT ON COLUMN public.talent_profiles.resume_link IS 'Optional external resume URL for talent comp card.';

ALTER TABLE public.client_applications
  ADD COLUMN IF NOT EXISTS invited_by_admin_id uuid,
  ADD COLUMN IF NOT EXISTS referral_source text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'client_applications_invited_by_admin_id_fkey'
  ) THEN
    ALTER TABLE public.client_applications
      ADD CONSTRAINT client_applications_invited_by_admin_id_fkey
      FOREIGN KEY (invited_by_admin_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS client_applications_invited_by_admin_id_idx
  ON public.client_applications (invited_by_admin_id);

COMMIT;
