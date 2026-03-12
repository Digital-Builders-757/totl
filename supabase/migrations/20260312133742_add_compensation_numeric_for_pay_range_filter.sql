-- Add compensation_numeric for pay range filtering on /gigs browse
-- Extracts the first numeric value from gigs.compensation (e.g. "$3,500" -> 3500)
-- NULL when no parseable number exists (e.g. "TBD", "Negotiable")
-- Enables faceted search by pay range without changing the free-form compensation text

ALTER TABLE public.gigs
ADD COLUMN compensation_numeric NUMERIC GENERATED ALWAYS AS (
  CASE
    WHEN (regexp_match(compensation, '[\d,\.]+'))[1] IS NOT NULL
    THEN (
      regexp_replace(
        (regexp_match(compensation, '[\d,\.]+'))[1],
        ',',
        '',
        'g'
      )
    )::numeric
    ELSE NULL
  END
) STORED;

-- Index for efficient range queries on pay filter
CREATE INDEX IF NOT EXISTS gigs_compensation_numeric_idx ON public.gigs (compensation_numeric)
WHERE compensation_numeric IS NOT NULL;

COMMENT ON COLUMN public.gigs.compensation_numeric IS 'Extracted numeric value from compensation text for pay range filtering; NULL when unparseable';
