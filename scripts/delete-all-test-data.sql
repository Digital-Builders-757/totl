-- =====================================================
-- Delete All Test Accounts and Test Gigs
-- =====================================================
-- WARNING: This will permanently delete all test data
-- Run this in Supabase Dashboard SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: VERIFICATION (Run these first to see what will be deleted)
-- =====================================================
-- Uncomment and run these SELECT statements first to verify what will be deleted:

/*
SELECT 
  'Test Accounts Found' as info,
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

SELECT 
  'Test Gigs Found' as info,
  COUNT(*) as count
FROM gigs
WHERE id IN (
  'd1d1d1d1-aaaa-4444-aaaa-111111111111',
  'd2d2d2d2-bbbb-4444-bbbb-222222222222',
  'd3d3d3d3-cccc-4444-cccc-333333333333'
)
OR title ILIKE '%test%'
OR client_id IN (
  SELECT id FROM profiles
  WHERE id IN (
    'cb2b2b2b-2222-4444-bbbb-000000000002',
    'cc3c3c3c-3333-4444-cccc-000000000003'
  )
);
*/

-- =====================================================
-- STEP 2: DELETE TEST DATA (CASCADE will handle related data)
-- =====================================================

-- Delete test users from auth.users
-- This will CASCADE delete:
-- - profiles
-- - talent_profiles / client_profiles
-- - applications
-- - bookings
-- - portfolio_items
-- - gigs (if they're clients)
-- - All other related data
DELETE FROM auth.users
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

-- Delete any remaining test gigs (in case they weren't owned by test clients)
DELETE FROM gigs
WHERE id IN (
  'd1d1d1d1-aaaa-4444-aaaa-111111111111',
  'd2d2d2d2-bbbb-4444-bbbb-222222222222',
  'd3d3d3d3-cccc-4444-cccc-333333333333'
)
OR title ILIKE '%test%';

-- Delete test client applications (these don't cascade from users)
DELETE FROM client_applications
WHERE email LIKE '%@example.com'
   OR email LIKE '%test%'
   OR id IN (
     '53a57d40-93a4-4a02-8eb4-ccd8b8957ab8',
     '1bea5343-b7db-4f27-8f57-841cf9619ce9',
     'f31f2440-0791-4c37-bb76-0d5087465d59'
   );

-- Delete test content flags (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_flags'
  ) THEN
    DELETE FROM content_flags
    WHERE id IN (
      'fb31fdb6-7f10-4e62-9f30-1e5d6a739e65',
      'e62ca82e-323d-4050-9446-4b4ff6cc9d4e'
    )
    OR reporter_id IN (
      SELECT id FROM profiles
      WHERE id IN (
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
      )
    );
  END IF;
END $$;

-- =====================================================
-- STEP 3: VERIFICATION AFTER DELETION (Run separately after deletion)
-- =====================================================
-- Uncomment and run these after deletion to verify cleanup:

/*
SELECT 
  'Remaining Test Accounts' as info,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@thetotlagency.local'
   OR email LIKE '%@example.com'
   OR email LIKE '%test%';

SELECT 
  'Remaining Test Gigs' as info,
  COUNT(*) as count
FROM gigs
WHERE title ILIKE '%test%';

SELECT 
  'Total Remaining Profiles' as info,
  COUNT(*) as count
FROM profiles;

SELECT 
  'Total Remaining Applications' as info,
  COUNT(*) as count
FROM applications;

SELECT 
  'Total Remaining Bookings' as info,
  COUNT(*) as count
FROM bookings;
*/

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. CASCADE DELETE handles most cleanup automatically
-- 2. Test accounts are identified by:
--    - Email patterns (@thetotlagency.local, @example.com, %test%)
--    - Known test UUIDs from seed.sql
-- 3. Test gigs are identified by:
--    - Known test UUIDs
--    - Titles containing "test"
-- 4. This script is safe to run multiple times (idempotent)
-- 5. Review the SELECT statements above before COMMIT to verify what will be deleted

