-- Clean up test data from TOTL Agency database
-- This script removes test users, gigs, and related data

-- Delete applications first (due to foreign key constraints)
DELETE FROM applications WHERE id IN (
  SELECT a.id FROM applications a
  JOIN gigs g ON a.gig_id = g.id
  WHERE g.title LIKE '%test%' OR g.title LIKE '%Test%'
);

-- Delete gigs (test gigs)
DELETE FROM gigs WHERE title LIKE '%test%' OR title LIKE '%Test%';

-- Delete talent profiles for test users
DELETE FROM talent_profiles WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email LIKE '%test%' OR email LIKE '%@example.com' OR display_name LIKE '%test%'
);

-- Delete client profiles for test users  
DELETE FROM client_profiles WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email LIKE '%test%' OR email LIKE '%@example.com' OR display_name LIKE '%test%'
);

-- Delete profiles for test users
DELETE FROM profiles 
WHERE email LIKE '%test%' OR email LIKE '%@example.com' OR display_name LIKE '%test%';

-- Delete portfolio items for test users (if any remain)
DELETE FROM portfolio_items WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE email LIKE '%test%' OR email LIKE '%@example.com' OR display_name LIKE '%test%'
);

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
