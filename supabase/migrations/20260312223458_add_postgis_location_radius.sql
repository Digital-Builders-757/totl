-- PostGIS location radius for faceted search
-- Enables "within X miles of [location]" filter on /gigs browse
-- Reference: MVP_STATUS_NOTION.md "Next (P1) - Location radius (PostGIS)"

-- 1. Enable PostGIS (Supabase uses extensions schema)
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- 2. Add lat/lng columns to gigs (nullable; existing rows stay null until backfilled/geocoded)
ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision;

COMMENT ON COLUMN public.gigs.location_lat IS 'Latitude for radius search; null until geocoded';
COMMENT ON COLUMN public.gigs.location_lng IS 'Longitude for radius search; null until geocoded';

-- 3. RPC: gigs within radius (returns full gig rows for browse)
-- center_lat, center_lng: search center (WGS84)
-- radius_meters: max distance in meters (e.g. 50 miles ≈ 80467)
-- Gigs without location_lat/lng are excluded from radius results
CREATE OR REPLACE FUNCTION public.gigs_within_radius(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision,
  p_category text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_pay_min double precision DEFAULT NULL,
  p_pay_max double precision DEFAULT NULL,
  p_date_min date DEFAULT NULL,
  p_limit int DEFAULT 9,
  p_offset int DEFAULT 0,
  p_sort text DEFAULT 'newest'
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  compensation text,
  date date,
  category text,
  image_url text,
  client_id uuid,
  created_at timestamptz,
  compensation_numeric numeric,
  dist_meters double precision
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  WITH center AS (
    SELECT extensions.ST_SetSRID(extensions.ST_MakePoint(center_lng, center_lat), 4326)::extensions.geography AS pt
  ),
  nearby AS (
    SELECT
      g.id,
      g.title,
      g.description,
      g.location,
      g.compensation,
      g.date,
      g.category,
      g.image_url,
      g.client_id,
      g.created_at,
      g.compensation_numeric,
      extensions.ST_Distance(
        extensions.ST_SetSRID(extensions.ST_MakePoint(g.location_lng, g.location_lat), 4326)::extensions.geography,
        (SELECT pt FROM center)
      ) AS dist_meters
    FROM public.gigs g
    CROSS JOIN center
    WHERE g.status = 'active'
      AND g.location_lat IS NOT NULL
      AND g.location_lng IS NOT NULL
      AND extensions.ST_DWithin(
        extensions.ST_SetSRID(extensions.ST_MakePoint(g.location_lng, g.location_lat), 4326)::extensions.geography,
        (SELECT pt FROM center),
        radius_meters
      )
      AND (p_category IS NULL OR p_category = '' OR g.category = p_category)
      AND (p_keyword IS NULL OR p_keyword = '' OR g.title ILIKE '%' || p_keyword || '%' OR g.description ILIKE '%' || p_keyword || '%' OR g.location ILIKE '%' || p_keyword || '%')
      AND (p_pay_min IS NULL OR g.compensation_numeric >= p_pay_min)
      AND (p_pay_max IS NULL OR g.compensation_numeric <= p_pay_max)
      AND (p_date_min IS NULL OR g.date >= p_date_min)
  )
  SELECT
    n.id,
    n.title,
    n.description,
    n.location,
    n.compensation,
    n.date,
    n.category,
    n.image_url,
    n.client_id,
    n.created_at,
    n.compensation_numeric,
    n.dist_meters
  FROM nearby n
  ORDER BY
    CASE WHEN p_sort = 'soonest' THEN n.date END ASC NULLS LAST,
    CASE WHEN p_sort = 'pay_high' THEN n.compensation_numeric END DESC NULLS LAST,
    CASE WHEN p_sort = 'pay_low' THEN n.compensation_numeric END ASC NULLS LAST,
    n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

COMMENT ON FUNCTION public.gigs_within_radius IS 'Returns gigs within radius_meters of (center_lat, center_lng). Excludes gigs without location_lat/lng.';

-- 4. Count function for pagination
CREATE OR REPLACE FUNCTION public.gigs_within_radius_count(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision,
  p_category text DEFAULT NULL,
  p_keyword text DEFAULT NULL,
  p_pay_min double precision DEFAULT NULL,
  p_pay_max double precision DEFAULT NULL,
  p_date_min date DEFAULT NULL
)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT count(*)::bigint
  FROM public.gigs g
  WHERE g.status = 'active'
    AND g.location_lat IS NOT NULL
    AND g.location_lng IS NOT NULL
    AND extensions.ST_DWithin(
      extensions.ST_SetSRID(extensions.ST_MakePoint(g.location_lng, g.location_lat), 4326)::extensions.geography,
      extensions.ST_SetSRID(extensions.ST_MakePoint(center_lng, center_lat), 4326)::extensions.geography,
      radius_meters
    )
    AND (p_category IS NULL OR p_category = '' OR g.category = p_category)
    AND (p_keyword IS NULL OR p_keyword = '' OR g.title ILIKE '%' || p_keyword || '%' OR g.description ILIKE '%' || p_keyword || '%' OR g.location ILIKE '%' || p_keyword || '%')
    AND (p_pay_min IS NULL OR g.compensation_numeric >= p_pay_min)
    AND (p_pay_max IS NULL OR g.compensation_numeric <= p_pay_max)
    AND (p_date_min IS NULL OR g.date >= p_date_min);
$$;

COMMENT ON FUNCTION public.gigs_within_radius_count IS 'Returns count of gigs within radius for pagination.';

-- 5. Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.gigs_within_radius TO authenticated;
GRANT EXECUTE ON FUNCTION public.gigs_within_radius TO service_role;
GRANT EXECUTE ON FUNCTION public.gigs_within_radius_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.gigs_within_radius_count TO service_role;
