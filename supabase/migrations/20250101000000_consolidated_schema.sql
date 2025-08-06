-- =====================================================
-- TOTL Agency - Consolidated Database Schema Migration
-- =====================================================
-- Date: 2025-01-01
-- Purpose: Consolidated schema that matches production database
-- Replaces: Multiple broken migrations with correct structure

BEGIN;

-- =====================================================
-- 1. DROP EXISTING OBJECTS (if they exist)
-- =====================================================

-- Drop triggers first (only if tables exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.get_current_user_id();
DROP FUNCTION IF EXISTS public.get_talent_applications();
DROP FUNCTION IF EXISTS public.test_trigger_function_exists();
DROP FUNCTION IF EXISTS public.ensure_profile_completion();
DROP FUNCTION IF EXISTS public.backfill_missing_profiles();
DROP FUNCTION IF EXISTS public.gigs_search_update();
DROP FUNCTION IF EXISTS public.update_modified_column();

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS client_applications CASCADE;
DROP TABLE IF EXISTS gig_requirements CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS gigs CASCADE;
DROP TABLE IF EXISTS client_profiles CASCADE;
DROP TABLE IF EXISTS talent_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS application_status CASCADE;
DROP TYPE IF EXISTS gig_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =====================================================
-- 2. CREATE ENUM TYPES
-- =====================================================

CREATE TYPE public.user_role AS ENUM ('talent', 'client', 'admin');
CREATE TYPE public.gig_status AS ENUM ('draft', 'active', 'closed', 'featured', 'urgent');
CREATE TYPE public.application_status AS ENUM ('new', 'under_review', 'shortlisted', 'rejected', 'accepted');

-- =====================================================
-- 3. CREATE TABLES (matching production structure)
-- =====================================================

-- Main profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'talent',
    display_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Talent-specific profiles
CREATE TABLE public.talent_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    location TEXT,
    experience TEXT,
    portfolio_url TEXT,
    height TEXT,
    measurements TEXT,
    hair_color TEXT,
    eye_color TEXT,
    shoe_size TEXT,
    languages TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client-specific profiles
CREATE TABLE public.client_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    company_size TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gigs table
CREATE TABLE public.gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    compensation TEXT NOT NULL,
    duration TEXT NOT NULL,
    date DATE NOT NULL,
    application_deadline TIMESTAMPTZ,
    status gig_status NOT NULL DEFAULT 'draft',
    image_url TEXT,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Applications table
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    talent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status application_status NOT NULL DEFAULT 'new',
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(gig_id, talent_id)
);

-- Gig requirements table
CREATE TABLE public.gig_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
    requirement TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client applications table (for non-authenticated client signups)
CREATE TABLE public.client_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    company_name TEXT NOT NULL,
    industry TEXT,
    website TEXT,
    business_description TEXT NOT NULL,
    needs_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Primary indexes (auto-created)
-- Foreign key indexes
CREATE INDEX IF NOT EXISTS talent_profiles_user_id_idx ON talent_profiles(user_id);
CREATE INDEX IF NOT EXISTS client_profiles_user_id_idx ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS gigs_client_id_idx ON gigs(client_id);
CREATE INDEX IF NOT EXISTS applications_gig_id_idx ON applications(gig_id);
CREATE INDEX IF NOT EXISTS applications_talent_id_idx ON applications(talent_id);
CREATE INDEX IF NOT EXISTS gig_requirements_gig_id_idx ON gig_requirements(gig_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS gigs_status_idx ON gigs(status);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications(status);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gig_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE FUNCTIONS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Handle new user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_role text;
  user_first_name text;
  user_last_name text;
  display_name text;
BEGIN
  -- Extract role and name from the user's metadata with safe defaults
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'talent');
  user_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
  
  -- Create display name safely
  IF user_first_name IS NOT NULL AND user_first_name <> '' AND 
     user_last_name IS NOT NULL AND user_last_name <> '' THEN
    display_name := user_first_name || ' ' || user_last_name;
  ELSIF user_first_name IS NOT NULL AND user_first_name <> '' THEN
    display_name := user_first_name;
  ELSIF user_last_name IS NOT NULL AND user_last_name <> '' THEN
    display_name := user_last_name;
  ELSE
    display_name := split_part(new.email, '@', 1);
  END IF;

  -- Create profile for the new user
  INSERT INTO public.profiles (id, role, display_name, email_verified)
  VALUES (new.id, user_role::user_role, display_name, new.email_confirmed_at IS NOT NULL);

  -- Create role-specific profile
  IF user_role = 'talent' THEN
    INSERT INTO public.talent_profiles (user_id, first_name, last_name)
    VALUES (new.id, user_first_name, user_last_name);
  ELSIF user_role = 'client' THEN
    INSERT INTO public.client_profiles (user_id, company_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'company_name', display_name));
  END IF;
  
  RETURN NEW;
END;
$$;

-- Get current user ID function
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE sql 
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT auth.uid();
$$;

-- =====================================================
-- 7. CREATE TRIGGERS
-- =====================================================

-- Auth user creation trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_talent_profiles_updated_at
  BEFORE UPDATE ON talent_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON client_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_gigs_updated_at
  BEFORE UPDATE ON gigs
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_client_applications_updated_at
  BEFORE UPDATE ON client_applications
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant permissions on sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

COMMIT; 