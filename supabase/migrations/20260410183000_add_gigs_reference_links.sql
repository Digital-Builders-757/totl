-- Reference / inspiration links on opportunities (reels, campaigns, etc.)
-- Validated in app (Zod) and enforced with CHECK + immutable validator for defense in depth.

ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS reference_links jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.gigs.reference_links IS
  'JSON array of {url, label, kind, sort_order}; max 15 entries; http(s) URLs; see lib/gig-reference-links.ts';

CREATE OR REPLACE FUNCTION public.validate_gig_reference_links(links jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  elem jsonb;
  url text;
  label text;
  kind text;
BEGIN
  IF links IS NULL THEN
    RETURN true;
  END IF;

  IF jsonb_typeof(links) <> 'array' THEN
    RETURN false;
  END IF;

  IF jsonb_array_length(links) > 15 THEN
    RETURN false;
  END IF;

  FOR elem IN SELECT * FROM jsonb_array_elements(links) LOOP
    IF jsonb_typeof(elem) <> 'object' THEN
      RETURN false;
    END IF;

    IF NOT (elem ? 'url' AND elem ? 'label' AND elem ? 'kind' AND elem ? 'sort_order') THEN
      RETURN false;
    END IF;

    IF jsonb_typeof(elem->'url') <> 'string'
      OR jsonb_typeof(elem->'label') <> 'string'
      OR jsonb_typeof(elem->'kind') <> 'string'
      OR jsonb_typeof(elem->'sort_order') <> 'number' THEN
      RETURN false;
    END IF;

    url := elem->>'url';
    label := elem->>'label';
    kind := elem->>'kind';

    IF length(url) > 2048 OR length(label) > 120 OR length(kind) > 40 THEN
      RETURN false;
    END IF;

    IF url !~* '^https?://' THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

ALTER TABLE public.gigs
  DROP CONSTRAINT IF EXISTS gigs_reference_links_valid;

ALTER TABLE public.gigs
  ADD CONSTRAINT gigs_reference_links_valid
  CHECK (public.validate_gig_reference_links(reference_links));
