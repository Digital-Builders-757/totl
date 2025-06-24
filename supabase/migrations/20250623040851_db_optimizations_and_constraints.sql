-- Recommended DB Optimizations & Constraints from Production Readiness Report

BEGIN;

-- 1. Query Performance & Indexing
-- Create indexes on frequently used foreign keys and filter columns to speed up queries.

-- Index for fetching applications by gig or by talent
CREATE INDEX IF NOT EXISTS idx_applications_on_gig_id ON public.applications (gig_id);
CREATE INDEX IF NOT EXISTS idx_applications_on_talent_id ON public.applications (talent_id);

-- Index for fetching gigs by client or by status
CREATE INDEX IF NOT EXISTS idx_gigs_on_client_id ON public.gigs (client_id);
CREATE INDEX IF NOT EXISTS idx_gigs_on_status ON public.gigs (status);

-- Index for fetching profiles by role
CREATE INDEX IF NOT EXISTS idx_profiles_on_role ON public.profiles (role);


-- 2. Data Model Refinements (Unique Constraints)
-- Add unique constraints to prevent data duplication and ensure integrity.

-- The unique constraint on (gig_id, talent_id) for the applications table
-- was already present in the initial schema creation, so it is omitted here.

-- Ensure a user can only have one talent_profile.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.talent_profiles'::regclass 
        AND conname = 'unique_user_in_talent_profiles'
    ) THEN
        ALTER TABLE public.talent_profiles
        ADD CONSTRAINT unique_user_in_talent_profiles UNIQUE (user_id);
    END IF;
END;
$$;

-- Ensure a user can only have one client_profile.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.client_profiles'::regclass 
        AND conname = 'unique_user_in_client_profiles'
    ) THEN
        ALTER TABLE public.client_profiles
        ADD CONSTRAINT unique_user_in_client_profiles UNIQUE (user_id);
    END IF;
END;
$$;

COMMIT;
