-- Migration: Fix handle_new_user trigger function to handle NULL metadata values
-- Date: 2025-07-22
-- Description: Updates the trigger function to prevent "null value violates not-null constraint" errors

-- Fix the handle_new_user trigger function to handle NULL metadata values gracefully
-- This prevents "null value violates not-null constraint" errors during user signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role text;
  user_first_name text;
  user_last_name text;
  display_name text;
BEGIN
  -- Extract role and name from the user's metadata with safe defaults
  -- Use COALESCE to prevent NULL values from causing constraint violations
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'talent');
  user_first_name := COALESCE(new.raw_user_meta_data->>'first_name', '');
  user_last_name := COALESCE(new.raw_user_meta_data->>'last_name', '');
  
  -- Create display name safely, handling cases where names might be empty
  IF user_first_name IS NOT NULL AND user_first_name <> '' AND 
     user_last_name IS NOT NULL AND user_last_name <> '' THEN
    display_name := user_first_name || ' ' || user_last_name;
  ELSIF user_first_name IS NOT NULL AND user_first_name <> '' THEN
    display_name := user_first_name;
  ELSIF user_last_name IS NOT NULL AND user_last_name <> '' THEN
    display_name := user_last_name;
  ELSE
    -- Fallback to email username if no names provided
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
    -- Handle client profile creation with safe defaults
    INSERT INTO public.client_profiles (user_id, company_name)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'company_name', display_name));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Key improvements made:
-- 1. Added COALESCE to prevent NULL values from metadata extraction
-- 2. Safe display_name construction with fallback to email username
-- 3. Graceful handling of missing first_name/last_name in talent profiles
-- 4. Safe company_name handling for client profiles
-- 5. Maintains data integrity while preventing runtime errors 