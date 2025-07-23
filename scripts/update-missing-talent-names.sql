-- Script: Update Missing Talent Profile Names
-- Date: 2025-07-22
-- Description: Updates existing talent profiles that have empty or NULL name fields
-- Usage: Run this in Supabase SQL Editor or via psql

-- Step 1: Identify talent profiles with missing name data
-- This query shows all talent profiles that need name updates
SELECT 
  tp.user_id,
  tp.first_name,
  tp.last_name,
  p.display_name,
  u.email,
  CASE 
    WHEN tp.first_name IS NULL OR tp.first_name = '' THEN 'Missing first_name'
    WHEN tp.last_name IS NULL OR tp.last_name = '' THEN 'Missing last_name'
    ELSE 'Both names missing'
  END as issue
FROM talent_profiles tp
JOIN profiles p ON tp.user_id = p.id
JOIN auth.users u ON tp.user_id = u.id
WHERE tp.first_name IS NULL 
   OR tp.first_name = '' 
   OR tp.last_name IS NULL 
   OR tp.last_name = '';

-- Step 2: Update talent profiles with missing names
-- This will set first_name and last_name based on display_name or email
UPDATE talent_profiles 
SET 
  first_name = COALESCE(
    NULLIF(TRIM(SPLIT_PART(profiles.display_name, ' ', 1)), ''),
    SPLIT_PART(auth.users.email, '@', 1)
  ),
  last_name = COALESCE(
    NULLIF(TRIM(SUBSTRING(profiles.display_name FROM POSITION(' ' IN profiles.display_name) + 1)), ''),
    ''
  )
FROM profiles, auth.users
WHERE talent_profiles.user_id = profiles.id 
  AND talent_profiles.user_id = auth.users.id
  AND (talent_profiles.first_name IS NULL 
       OR talent_profiles.first_name = '' 
       OR talent_profiles.last_name IS NULL 
       OR talent_profiles.last_name = '');

-- Step 3: Verify the updates
-- Check that all talent profiles now have name data
SELECT 
  tp.user_id,
  tp.first_name,
  tp.last_name,
  p.display_name,
  u.email,
  CASE 
    WHEN tp.first_name IS NULL OR tp.first_name = '' THEN 'Still missing first_name'
    WHEN tp.last_name IS NULL OR tp.last_name = '' THEN 'Still missing last_name'
    ELSE 'Names complete'
  END as status
FROM talent_profiles tp
JOIN profiles p ON tp.user_id = p.id
JOIN auth.users u ON tp.user_id = u.id
ORDER BY status;

-- Step 4: Update display names in profiles table for consistency
-- This ensures the display_name matches the updated first_name + last_name
UPDATE profiles 
SET display_name = CONCAT(talent_profiles.first_name, ' ', talent_profiles.last_name)
FROM talent_profiles
WHERE profiles.id = talent_profiles.user_id
  AND talent_profiles.first_name IS NOT NULL 
  AND talent_profiles.first_name != ''
  AND talent_profiles.last_name IS NOT NULL 
  AND talent_profiles.last_name != '';

-- Step 5: Final verification
-- Show the final state of all talent profiles
SELECT 
  tp.user_id,
  tp.first_name,
  tp.last_name,
  p.display_name,
  u.email,
  p.email_verified
FROM talent_profiles tp
JOIN profiles p ON tp.user_id = p.id
JOIN auth.users u ON tp.user_id = u.id
ORDER BY tp.first_name, tp.last_name; 