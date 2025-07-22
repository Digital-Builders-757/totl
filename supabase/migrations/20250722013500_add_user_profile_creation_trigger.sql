-- Migration: Add user profile creation trigger
-- Date: 2025-07-22
-- Description: Creates trigger to automatically create profiles when new users sign up

-- Create trigger to automatically create profiles when new users sign up
-- This trigger fires when a new user is created in auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- The handle_new_user function already exists and:
-- 1. Extracts role and name from user metadata
-- 2. Creates a record in profiles table with role
-- 3. Creates a record in talent_profiles or client_profiles based on role
-- 4. Sets email_verified based on email confirmation status 