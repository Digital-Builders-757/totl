-- =====================================================
-- Verify Test Data Deletion
-- =====================================================
-- Run this to confirm all test data has been removed
-- =====================================================

-- Check for remaining test accounts
SELECT 
  'Remaining Test Accounts' as check_type,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@thetotlagency.local'
   OR email LIKE '%@example.com'
   OR email LIKE '%test%'
   OR id IN (
     '11111111-1111-1111-1111-111111111111',
     '22222222-2222-2222-2222-222222222222',
     '33333333-3333-3333-3333-333333333333',
     '44444444-4444-4444-4444-444444444444',
     '55555555-5555-5555-5555-555555555555',
     '66666666-6666-6666-6666-666666666666',
     '77777777-7777-7777-7777-777777777777',
     '88888888-8888-8888-8888-888888888888',
     '99999999-9999-9999-9999-999999999999',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
     'ca1a1a1a-1111-4444-aaaa-000000000001',
     'cb2b2b2b-2222-4444-bbbb-000000000002',
     'cc3c3c3c-3333-4444-cccc-000000000003'
   );

-- Check for remaining test gigs
SELECT 
  'Remaining Test Gigs' as check_type,
  COUNT(*) as count
FROM gigs
WHERE id IN (
  'd1d1d1d1-aaaa-4444-aaaa-111111111111',
  'd2d2d2d2-bbbb-4444-bbbb-222222222222',
  'd3d3d3d3-cccc-4444-cccc-333333333333'
)
OR title ILIKE '%test%';

-- Check total remaining data
SELECT 
  'Total Users' as check_type,
  COUNT(*) as count
FROM auth.users;

SELECT 
  'Total Profiles' as check_type,
  COUNT(*) as count
FROM profiles;

SELECT 
  'Total Gigs' as check_type,
  COUNT(*) as count
FROM gigs;

SELECT 
  'Total Applications' as check_type,
  COUNT(*) as count
FROM applications;

SELECT 
  'Total Bookings' as check_type,
  COUNT(*) as count
FROM bookings;

SELECT 
  'Total Portfolio Items' as check_type,
  COUNT(*) as count
FROM portfolio_items;

