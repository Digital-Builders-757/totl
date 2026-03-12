-- Saved searches for talent discovery on /gigs.
-- Stores filter params (q, category, location, pay_range, upcoming, sort) so users
-- can save and quickly reload search combinations.

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  params JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing user's saved searches
CREATE INDEX IF NOT EXISTS saved_searches_user_id_idx ON public.saved_searches (user_id);

-- RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can only CRUD their own saved searches
CREATE POLICY "Users can view own saved searches"
  ON public.saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved searches"
  ON public.saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
  ON public.saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON public.saved_searches FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.saved_searches IS 'Saved gig search filter combinations for talent discovery';
