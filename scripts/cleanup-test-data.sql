-- Clean up test data from TOTL Agency database
-- This script removes test users, gigs, and related data

-- =====================================================
-- HARD DELETE CONTRACT (DEV CLEANUP)
-- =====================================================
-- ✅ Always delete users by deleting from auth.users
--    and rely on ON DELETE CASCADE to clean up public.* rows.
-- 🚫 Do NOT delete from public.profiles directly (it can create orphan auth.users).
--
-- Run in Supabase SQL Editor (service role context).

-- Delete applications for test gigs first (safe even if cascades exist)
DELETE FROM applications
WHERE id IN (
  SELECT a.id
  FROM applications a
  JOIN gigs g ON a.gig_id = g.id
  WHERE g.title ILIKE '%test%'
);

-- Delete test gigs by title (in case they were created by non-test users)
DELETE FROM gigs
WHERE title ILIKE '%test%';

-- Delete test users from auth.users (CASCADE handles profiles + related data)
DELETE FROM auth.users
WHERE email ILIKE '%test%'
   OR email ILIKE '%@example.com';

-- Show remaining data counts
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'gigs', COUNT(*) FROM gigs
UNION ALL  
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'talent_profiles', COUNT(*) FROM talent_profiles
UNION ALL
SELECT 'client_profiles', COUNT(*) FROM client_profiles;
