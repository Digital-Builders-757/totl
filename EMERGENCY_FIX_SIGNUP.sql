-- ============================================================
-- EMERGENCY FIX FOR SIGNUP ERROR
-- ============================================================
-- Error: column "email" of relation "profiles" does not exist
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire SQL script
-- 4. Run it
-- 5. Test signup again
-- ============================================================

-- Drop the problematic trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the old function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the corrected function (NO EMAIL COLUMN)
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

  -- FIXED: This line was trying to insert 'email' column which doesn't exist
  -- OLD (WRONG): INSERT INTO public.profiles (id, email, role, created_at, updated_at)
  -- NEW (CORRECT): INSERT INTO public.profiles (id, role, display_name, email_verified)
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

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ============================================================
-- VERIFICATION QUERY (Run this after to confirm it worked)
-- ============================================================
-- SELECT 
--   p.proname as function_name,
--   pg_get_functiondef(p.oid) as definition
-- FROM pg_proc p
-- WHERE p.proname = 'handle_new_user';
-- ============================================================
