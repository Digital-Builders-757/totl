-- Fix: regexp_match with capture group (\.\d+)? returns only the decimal portion in [1],
-- not the full number. Integer compensations produced NULL; decimals produced only the
-- fractional part (e.g. 0.50 instead of 1500.50). Use non-capturing group (?:\.[0-9]+)?
-- so [1] returns the full match when no capture groups exist.

DROP INDEX IF EXISTS gigs_compensation_numeric_idx;

ALTER TABLE public.gigs
DROP COLUMN IF EXISTS compensation_numeric;

ALTER TABLE public.gigs
ADD COLUMN compensation_numeric NUMERIC GENERATED ALWAYS AS (
  CASE
    WHEN (regexp_match(compensation, '[0-9][0-9,]*(?:\.[0-9]+)?'))[1] IS NOT NULL
    THEN (
      regexp_replace(
        (regexp_match(compensation, '[0-9][0-9,]*(?:\.[0-9]+)?'))[1],
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
