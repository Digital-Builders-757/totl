-- Migration: Fix Function Search Path Issues Only
-- Date: 2025-07-25
-- Description: Fixes search path issues for functions detected in security scan

BEGIN;

-- Fix functions that are currently causing security warnings
-- Each function gets SET search_path = public, auth to prevent injection attacks

-- 1. Fix update_updated_at_column function
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

-- 2. Fix handle_new_user function
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

  -- Create a general profile for the new user
  INSERT INTO public.profiles (id, role, display_name, email_verified)
  VALUES (new.id, user_role::user_role, display_name, new.email_confirmed_at IS NOT NULL);

  -- Create a role-specific profile with safe defaults
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

-- 3. Create test_enum_casting function with proper search_path
CREATE OR REPLACE FUNCTION public.test_enum_casting()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Test function for enum casting
  PERFORM 'talent'::user_role;
  PERFORM 'client'::user_role;
  PERFORM 'admin'::user_role;
END;
$$;

-- 4. Create test_trigger_function_exists function with proper search_path
CREATE OR REPLACE FUNCTION public.test_trigger_function_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Test function to check if trigger functions exist
  RETURN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  );
END;
$$;

-- 5. Create ensure_profile_completion function with proper search_path
CREATE OR REPLACE FUNCTION public.ensure_profile_completion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Ensure all users have complete profiles
  FOR user_record IN 
    SELECT p.id, p.role 
    FROM public.profiles p
    WHERE p.id = auth.uid()
  LOOP
    -- Check if talent profile exists
    IF user_record.role = 'talent' AND NOT EXISTS (
      SELECT 1 FROM public.talent_profiles WHERE user_id = user_record.id
    ) THEN
      INSERT INTO public.talent_profiles (user_id, first_name, last_name)
      VALUES (user_record.id, '', '');
    END IF;
    
    -- Check if client profile exists
    IF user_record.role = 'client' AND NOT EXISTS (
      SELECT 1 FROM public.client_profiles WHERE user_id = user_record.id
    ) THEN
      INSERT INTO public.client_profiles (user_id, company_name)
      VALUES (user_record.id, '');
    END IF;
  END LOOP;
END;
$$;

-- 6. Create backfill_missing_profiles function with proper search_path
CREATE OR REPLACE FUNCTION public.backfill_missing_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  missing_count integer := 0;
  user_record RECORD;
BEGIN
  -- Backfill missing profiles for existing users
  FOR user_record IN 
    SELECT p.id, p.role 
    FROM public.profiles p
    WHERE p.role = 'talent' AND NOT EXISTS (
      SELECT 1 FROM public.talent_profiles WHERE user_id = p.id
    )
  LOOP
    INSERT INTO public.talent_profiles (user_id, first_name, last_name)
    VALUES (user_record.id, '', '');
    missing_count := missing_count + 1;
  END LOOP;
  
  FOR user_record IN 
    SELECT p.id, p.role 
    FROM public.profiles p
    WHERE p.role = 'client' AND NOT EXISTS (
      SELECT 1 FROM public.client_profiles WHERE user_id = p.id
    )
  LOOP
    INSERT INTO public.client_profiles (user_id, company_name)
    VALUES (user_record.id, '');
    missing_count := missing_count + 1;
  END LOOP;
  
  RETURN missing_count;
END;
$$;

-- 7. Create gigs_search_update function with proper search_path
CREATE OR REPLACE FUNCTION public.gigs_search_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update search vector for gigs table (if using full-text search)
  -- This is a placeholder for future search functionality
  RETURN NEW;
END;
$$;

-- 8. Create update_modified_column function with proper search_path
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update modified timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_enum_casting() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_trigger_function_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile_completion() TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_missing_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.gigs_search_update() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_modified_column() TO authenticated;

COMMIT;
