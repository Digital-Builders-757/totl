-- Moderation tooling: content flags + suspension fields

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_resource_type') THEN
    CREATE TYPE public.flag_resource_type AS ENUM ('gig', 'talent_profile', 'client_profile', 'application', 'booking');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_status') THEN
    CREATE TYPE public.flag_status AS ENUM ('open', 'in_review', 'resolved', 'dismissed');
  END IF;
END$$;

-- Profiles suspension fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Content flags table
CREATE TABLE IF NOT EXISTS public.content_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resource_type flag_resource_type NOT NULL,
  resource_id UUID NOT NULL,
  gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status flag_status NOT NULL DEFAULT 'open',
  admin_notes TEXT,
  assigned_admin_id UUID REFERENCES public.profiles(id),
  resolution_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_flags_status_idx ON public.content_flags(status);
CREATE INDEX IF NOT EXISTS content_flags_resource_type_idx ON public.content_flags(resource_type);
CREATE INDEX IF NOT EXISTS content_flags_gig_idx ON public.content_flags(gig_id);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY IF NOT EXISTS "Users can insert content flags"
  ON public.content_flags
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY IF NOT EXISTS "Reporters can view their own flags"
  ON public.content_flags
  FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY IF NOT EXISTS "Admins can view content flags"
  ON public.content_flags
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ));

CREATE POLICY IF NOT EXISTS "Admins can update content flags"
  ON public.content_flags
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ));

CREATE POLICY IF NOT EXISTS "Admins can delete content flags"
  ON public.content_flags
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  ));

-- Trigger for updated_at
CREATE TRIGGER update_content_flags_updated_at
  BEFORE UPDATE ON public.content_flags
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();

