-- Fix: compensation_numeric regex could match dot-only or invalid strings (e.g. "Negotiable.", "1.2.3")
-- causing ::numeric cast to fail and block INSERT/UPDATE.
-- New regex: [0-9][0-9,]*(\\.[0-9]+)? requires at least one digit, at most one decimal point.

DROP INDEX IF EXISTS gigs_compensation_numeric_idx;

ALTER TABLE public.gigs
DROP COLUMN IF EXISTS compensation_numeric;

ALTER TABLE public.gigs
ADD COLUMN compensation_numeric NUMERIC GENERATED ALWAYS AS (
  CASE
    WHEN (regexp_match(compensation, '[0-9][0-9,]*(\.[0-9]+)?'))[1] IS NOT NULL
    THEN (
      regexp_replace(
        (regexp_match(compensation, '[0-9][0-9,]*(\.[0-9]+)?'))[1],
        ',',
        '',
        'g'
      )
    )::numeric
    ELSE NULL
  END
) STORED;

CREATE INDEX IF NOT EXISTS gigs_compensation_numeric_idx ON public.gigs (compensation_numeric)
WHERE compensation_numeric IS NOT NULL;

COMMENT ON COLUMN public.gigs.compensation_numeric IS 'Extracted numeric value from compensation text for pay range filtering; NULL when unparseable';
