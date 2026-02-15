-- Mock Talent Data for TOTL Agency
-- This script creates realistic talent profiles for demonstration purposes

-- Clean up previously seeded accounts so the script is idempotent
DELETE FROM content_flags
WHERE id IN (
  'fb31fdb6-7f10-4e62-9f30-1e5d6a739e65',
  'e62ca82e-323d-4050-9446-4b4ff6cc9d4e'
);

DELETE FROM client_applications
WHERE id IN (
  '53a57d40-93a4-4a02-8eb4-ccd8b8957ab8',
  '1bea5343-b7db-4f27-8f57-841cf9619ce9',
  'f31f2440-0791-4c37-bb76-0d5087465d59'
);

DELETE FROM portfolio_items
WHERE id IN (
  '2f2b2c63-9b57-4df7-9b73-6cda2177a09f',
  'bbdc0403-92a3-4862-94c4-43216336fdd9',
  '8bfd28b9-a9c9-4cbb-894b-e69094f4a816'
);

DELETE FROM bookings
WHERE id IN ('7a9bd9fb-8a44-4a89-94e2-8269fb91504c');

DELETE FROM applications
WHERE id IN (
  'e8ad2d3d-8500-4e4f-8c6b-352adbe0fe71',
  '72ba215f-d40e-4f2b-8f77-d9513cd5f07f',
  '0171ea21-2d4a-4db0-8cf8-436a039f1427',
  'd956c34b-b0c1-4c55-a7c3-57b74af5f7ff',
  '7d06f030-5f04-4471-a48e-2ba32170f6cc'
);

DELETE FROM gig_requirements
WHERE id IN (
  'a2f6b084-16b5-47d4-9762-48e7caa0d1b4',
  '29df1be0-78b6-4192-a4f4-a22b5a45f624',
  'dfee65a9-4937-46f0-80f3-65ede111b6e0',
  '2c41c4cf-5fdd-4dd4-8cb7-9d0cb0b0d842',
  'be49f677-be3e-48f5-90e6-6ef3265e8fc0'
);

DELETE FROM gigs
WHERE id IN (
  'd1d1d1d1-aaaa-4444-aaaa-111111111111',
  'd2d2d2d2-bbbb-4444-bbbb-222222222222',
  'd3d3d3d3-cccc-4444-cccc-333333333333'
);

DELETE FROM talent_profiles
WHERE user_id IN (
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
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

DELETE FROM client_profiles
WHERE user_id IN (
  'cb2b2b2b-2222-4444-bbbb-000000000002',
  'cc3c3c3c-3333-4444-cccc-000000000003'
);

DELETE FROM profiles
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
  'cc3c3c3c-3333-4444-cccc-000000000003',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

DELETE FROM auth.users
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
  'cc3c3c3c-3333-4444-cccc-000000000003',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure each seeded profile has a corresponding auth.users record (FK requirement)
WITH user_seeds AS (
  SELECT * FROM (VALUES
    ('11111111-1111-1111-1111-111111111111', 'emma.seed@thetotlagency.local', 'Emma', 'Rodriguez', 'talent'),
    ('22222222-2222-2222-2222-222222222222', 'marcus.seed@thetotlagency.local', 'Marcus', 'Johnson', 'talent'),
    ('33333333-3333-3333-3333-333333333333', 'sofia.seed@thetotlagency.local', 'Sofia', 'Chen', 'talent'),
    ('44444444-4444-4444-4444-444444444444', 'james.seed@thetotlagency.local', 'James', 'Wilson', 'talent'),
    ('55555555-5555-5555-5555-555555555555', 'isabella.seed@thetotlagency.local', 'Isabella', 'Martinez', 'talent'),
    ('66666666-6666-6666-6666-666666666666', 'alexander.seed@thetotlagency.local', 'Alexander', 'Thompson', 'talent'),
    ('77777777-7777-7777-7777-777777777777', 'olivia.seed@thetotlagency.local', 'Olivia', 'Davis', 'talent'),
    ('88888888-8888-8888-8888-888888888888', 'ethan.seed@thetotlagency.local', 'Ethan', 'Brown', 'talent'),
    ('99999999-9999-9999-9999-999999999999', 'ava.seed@thetotlagency.local', 'Ava', 'Garcia', 'talent'),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'liam.seed@thetotlagency.local', 'Liam', 'Anderson', 'talent'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'mia.seed@thetotlagency.local', 'Mia', 'Taylor', 'talent'),
    ('ca1a1a1a-1111-4444-aaaa-000000000001', 'qa.admin@thetotlagency.local', 'QA', 'Admin', 'admin'),
    ('cb2b2b2b-2222-4444-bbbb-000000000002', 'lumen.media@thetotlagency.local', 'Lumen', 'Media', 'client'),
    ('cc3c3c3c-3333-4444-cccc-000000000003', 'northwind.events@thetotlagency.local', 'Northwind', 'Events', 'client'),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'test@totl.local', 'Test', 'User', 'talent')
  ) AS t(id, email, first_name, last_name, profile_role)
)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
SELECT
  id::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  email,
  crypt('Password123!', gen_salt('bf')),
  NOW(),
  jsonb_build_object('provider', 'email'),
  jsonb_build_object(
    'first_name', first_name,
    'last_name', last_name,
    'role', profile_role
  ),
  NOW(),
  NOW()
FROM user_seeds
ON CONFLICT (id) DO NOTHING;

-- First, let's create some mock profiles (users)
INSERT INTO profiles (id, role, display_name, email_verified, created_at, updated_at) VALUES
-- Talent 1: Emma Rodriguez
('11111111-1111-1111-1111-111111111111', 'talent', 'Emma Rodriguez', true, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

-- Talent 2: Marcus Johnson
('22222222-2222-2222-2222-222222222222', 'talent', 'Marcus Johnson', true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),

-- Talent 3: Sofia Chen
('33333333-3333-3333-3333-333333333333', 'talent', 'Sofia Chen', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),

-- Talent 4: James Wilson
('44444444-4444-4444-4444-444444444444', 'talent', 'James Wilson', true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day'),

-- Talent 5: Isabella Martinez
('55555555-5555-5555-5555-555555555555', 'talent', 'Isabella Martinez', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days'),

-- Talent 6: Alexander Thompson
('66666666-6666-6666-6666-666666666666', 'talent', 'Alexander Thompson', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),

-- Talent 7: Olivia Davis
('77777777-7777-7777-7777-777777777777', 'talent', 'Olivia Davis', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

-- Talent 8: Ethan Brown
('88888888-8888-8888-8888-888888888888', 'talent', 'Ethan Brown', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),

-- Talent 9: Ava Garcia
('99999999-9999-9999-9999-999999999999', 'talent', 'Ava Garcia', true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'),

-- Talent 10: Liam Anderson
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'talent', 'Liam Anderson', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),

-- Talent 11: Mia Taylor
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'talent', 'Mia Taylor', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
-- Test User: simple memorable test account
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'talent', 'Test User', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Now, let's create detailed talent profiles
INSERT INTO talent_profiles (
  id, user_id, first_name, last_name, phone, age, location, experience, 
  portfolio_url, height, measurements, hair_color, eye_color, shoe_size, 
  languages, experience_years, specialties, weight, created_at, updated_at
) VALUES

-- Emma Rodriguez - Fashion Model
('0793beb9-a941-4383-86d1-bb847eb471c7', '11111111-1111-1111-1111-111111111111', 'Emma', 'Rodriguez', '+1-555-0101', 24, 'Los Angeles, CA', 
 'Professional fashion model with 3 years of experience in runway, editorial, and commercial work. Featured in Vogue, Elle, and Harper''s Bazaar.',
 'https://emmarodriguez.portfolio.com', '5''9"', '34-24-35', 'Brunette', 'Brown', '8', 
 ARRAY['English', 'Spanish'], 3, ARRAY['Fashion', 'Runway', 'Editorial'], 125, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

-- Marcus Johnson - Commercial Model
('aa9e3e6d-1ffc-48f3-bd98-702d7ce93814', '22222222-2222-2222-2222-222222222222', 'Marcus', 'Johnson', '+1-555-0102', 28, 'New York, NY',
 'Versatile commercial model specializing in lifestyle, fitness, and corporate photography. Strong presence in advertising campaigns.',
 'https://marcusjohnson.models.com', '6''2"', '42-32-36', 'Black', 'Brown', '11',
 ARRAY['English'], 5, ARRAY['Commercial', 'Fitness', 'Lifestyle'], 185, NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),

-- Sofia Chen - Editorial Model
('8c018a9e-3c6f-4b40-b096-46b1d9fc3f41', '33333333-3333-3333-3333-333333333333', 'Sofia', 'Chen', '+1-555-0103', 22, 'San Francisco, CA',
 'Emerging editorial model with a unique look. Experienced in high-fashion shoots and artistic photography.',
 'https://sofiachen.art', '5''7"', '32-23-34', 'Black', 'Brown', '7',
 ARRAY['English', 'Mandarin'], 2, ARRAY['Editorial', 'Artistic', 'High Fashion'], 115, NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),

-- James Wilson - Fitness Model
('0f0e2f3e-09ed-4f91-8fb7-b011a6edc5a0', '44444444-4444-4444-4444-444444444444', 'James', 'Wilson', '+1-555-0104', 26, 'Miami, FL',
 'Certified personal trainer and fitness model. Specializes in athletic wear, supplement, and fitness equipment campaigns.',
 'https://jameswilson.fitness', '6''0"', '44-32-38', 'Blonde', 'Blue', '10',
 ARRAY['English'], 4, ARRAY['Fitness', 'Athletic', 'Health'], 195, NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day'),

-- Isabella Martinez - Plus Size Model
('6a42a1a5-dbe5-4c31-b5f0-9b5f0d892aea', '55555555-5555-5555-5555-555555555555', 'Isabella', 'Martinez', '+1-555-0105', 29, 'Chicago, IL',
 'Confident plus-size model promoting body positivity and inclusivity in fashion. Featured in major campaigns.',
 'https://isabellamartinez.plus', '5''8"', '42-36-44', 'Brown', 'Hazel', '9',
 ARRAY['English', 'Spanish'], 6, ARRAY['Plus Size', 'Body Positivity', 'Fashion'], 165, NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days'),

-- Alexander Thompson - Male Fashion Model
('9d566993-d2ec-4c34-af23-f02977fb54c5', '66666666-6666-6666-6666-666666666666', 'Alexander', 'Thompson', '+1-555-0106', 25, 'Portland, OR',
 'High-fashion male model with international experience. Known for editorial work and luxury brand campaigns.',
 'https://alexanderthompson.fashion', '6''1"', '40-30-35', 'Brown', 'Green', '10',
 ARRAY['English', 'French'], 4, ARRAY['High Fashion', 'Editorial', 'Luxury'], 175, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),

-- Olivia Davis - Lifestyle Model
('ccc4ff05-5062-4fd9-b6e4-6e72b3d943f6', '77777777-7777-7777-7777-777777777777', 'Olivia', 'Davis', '+1-555-0107', 23, 'Austin, TX',
 'Natural lifestyle model perfect for family, home, and lifestyle brands. Authentic and relatable presence.',
 'https://oliviadavis.life', '5''6"', '34-26-36', 'Blonde', 'Blue', '8',
 ARRAY['English'], 3, ARRAY['Lifestyle', 'Family', 'Home'], 130, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

-- Ethan Brown - Commercial Actor/Model
('6c3b7396-d740-4799-8d02-735b2023728e', '88888888-8888-8888-8888-888888888888', 'Ethan', 'Brown', '+1-555-0108', 31, 'Seattle, WA',
 'Versatile commercial talent with acting background. Perfect for video campaigns, commercials, and branded content.',
 'https://ethanbrown.commercial', '5''11"', '38-30-34', 'Brown', 'Brown', '9',
 ARRAY['English'], 7, ARRAY['Commercial', 'Acting', 'Video'], 170, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),

-- Ava Garcia - Beauty Model
('cf3d948e-6f98-4642-a585-a236fdb7efe0', '99999999-9999-9999-9999-999999999999', 'Ava', 'Garcia', '+1-555-0109', 27, 'Denver, CO',
 'Specialized beauty and skincare model with flawless skin and versatile look. Perfect for beauty campaigns.',
 'https://avagarcia.beauty', '5''7"', '36-25-37', 'Black', 'Brown', '8',
 ARRAY['English', 'Spanish'], 5, ARRAY['Beauty', 'Skincare', 'Makeup'], 125, NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'),

-- Liam Anderson - Mature Model
('05d2e87d-d08b-4596-99e8-1359dacb213d', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Liam', 'Anderson', '+1-555-0110', 45, 'Boston, MA',
 'Distinguished mature model perfect for luxury, financial, and professional campaigns. Sophisticated and trustworthy presence.',
 'https://liamanderson.mature', '6''0"', '42-34-40', 'Salt & Pepper', 'Blue', '10',
 ARRAY['English'], 15, ARRAY['Mature', 'Professional', 'Luxury'], 185, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),

-- Mia Taylor - New Face
('fd54ead8-8392-48c5-b183-8102cd6dff90', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mia', 'Taylor', '+1-555-0111', 19, 'Nashville, TN',
 'Fresh new face with natural beauty and potential. Eager to learn and grow in the modeling industry.',
 'https://miataylor.new', '5''8"', '34-24-36', 'Auburn', 'Green', '8',
 ARRAY['English'], 1, ARRAY['New Face', 'Natural', 'Fresh'], 120, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),

-- Test User - Simple test account for quick login
('ee000000-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Test', 'User', '+1-555-0999', 25, 'Test City',
 'Test account for development and QA.',
 NULL, '5''10"', '38-30-36', 'Brown', 'Brown', '9',
 ARRAY['English'], 2, ARRAY['Commercial', 'Lifestyle'], 150, NOW(), NOW())
-- handle_new_user trigger already creates minimal talent_profiles; idempotent: skip if exists
ON CONFLICT (user_id) DO NOTHING;

-- Update the display names in profiles to match the talent names
UPDATE profiles SET display_name = 'Emma Rodriguez' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE profiles SET display_name = 'Marcus Johnson' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE profiles SET display_name = 'Sofia Chen' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE profiles SET display_name = 'James Wilson' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE profiles SET display_name = 'Isabella Martinez' WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE profiles SET display_name = 'Alexander Thompson' WHERE id = '66666666-6666-6666-6666-666666666666';
UPDATE profiles SET display_name = 'Olivia Davis' WHERE id = '77777777-7777-7777-7777-777777777777';
UPDATE profiles SET display_name = 'Ethan Brown' WHERE id = '88888888-8888-8888-8888-888888888888';
UPDATE profiles SET display_name = 'Ava Garcia' WHERE id = '99999999-9999-9999-9999-999999999999';
UPDATE profiles SET display_name = 'Liam Anderson' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE profiles SET display_name = 'Mia Taylor' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

-- Admin and client fixtures for QA
INSERT INTO profiles (
  id,
  role,
  display_name,
  email_verified,
  is_suspended,
  suspension_reason,
  subscription_status,
  subscription_plan,
  subscription_current_period_end,
  stripe_customer_id,
  stripe_subscription_id,
  created_at,
  updated_at
) VALUES
  -- Admin account used for moderation dashboard smoke tests
  ('ca1a1a1a-1111-4444-aaaa-000000000001', 'admin', 'QA Admin', true, false, NULL, 'none', NULL, NULL, NULL, NULL, NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day'),
  -- Active client with full profile and gigs
  ('cb2b2b2b-2222-4444-bbbb-000000000002', 'client', 'Lumen Media', true, false, NULL, 'none', NULL, NULL, NULL, NULL, NOW() - INTERVAL '35 days', NOW() - INTERVAL '2 days'),
  -- Suspended client to validate middleware redirects
  ('cc3c3c3c-3333-4444-cccc-000000000003', 'client', 'Northwind Events', true, true, 'Violation of posting guidelines', 'none', NULL, NULL, NULL, NULL, NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

INSERT INTO client_profiles (
  user_id,
  company_name,
  company_size,
  contact_name,
  contact_email,
  contact_phone,
  website,
  industry,
  created_at,
  updated_at
) VALUES
  ('cb2b2b2b-2222-4444-bbbb-000000000002', 'Lumen Media', '11-50', 'Tessa Hargrove', 'ops@lumenmedia.co', '+1-555-401-0001', 'https://lumenmedia.co', 'Media & Entertainment', NOW() - INTERVAL '35 days', NOW() - INTERVAL '2 days'),
  ('cc3c3c3c-3333-4444-cccc-000000000003', 'Northwind Events', '51-200', 'David Ibarra', 'hello@northwind.events', '+1-555-401-0002', 'https://northwind.events', 'Events & Experiential', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day');

-- Premium gigs used by dashboards, applications, and bookings
INSERT INTO gigs (
  id,
  client_id,
  title,
  description,
  category,
  location,
  compensation,
  duration,
  date,
  application_deadline,
  status,
  image_url,
  search_vector,
  created_at,
  updated_at
) VALUES
  (
    'd1d1d1d1-aaaa-4444-aaaa-111111111111',
    'cb2b2b2b-2222-4444-bbbb-000000000002',
    'Runway Residency Casting',
    'Week-long residency for an LA fashion house. Requires runway experience and availability for fittings.',
    'Fashion',
    'Los Angeles, CA',
    '$3,500 + accommodations',
    '7 days',
    NOW() + INTERVAL '21 days',
    NOW() + INTERVAL '14 days',
    'active',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
    to_tsvector('english', 'Runway Residency Casting LA fashion house'),
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'd2d2d2d2-bbbb-4444-bbbb-222222222222',
    'cb2b2b2b-2222-4444-bbbb-000000000002',
    'Brand Storytelling Campaign',
    'Lifestyle shoot for an eco-friendly beverage. Looking for two talent with on-camera experience.',
    'Lifestyle',
    'Austin, TX',
    '$1,200 per day',
    '3 days',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '5 days',
    'featured',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f',
    to_tsvector('english', 'Lifestyle eco beverage storytelling campaign'),
    NOW() - INTERVAL '18 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'd3d3d3d3-cccc-4444-cccc-333333333333',
    'cc3c3c3c-3333-4444-cccc-000000000003',
    'Fitness Product Launch',
    'High-energy launch event for a smart fitness mirror. Requires fitness modeling background.',
    'Fitness',
    'New York, NY',
    '$2,000 flat',
    '2 days',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '2 days',
    'urgent',
    'https://images.unsplash.com/photo-1554284126-aa88f22d8b74',
    to_tsvector('english', 'Fitness product launch smart mirror'),
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '1 day'
  );

-- Requirements linked to each gig
INSERT INTO gig_requirements (id, gig_id, requirement, created_at)
VALUES
  ('a2f6b084-16b5-47d4-9762-48e7caa0d1b4', 'd1d1d1d1-aaaa-4444-aaaa-111111111111', 'Minimum 5''9" with professional runway experience', NOW() - INTERVAL '12 days'),
  ('29df1be0-78b6-4192-a4f4-a22b5a45f624', 'd1d1d1d1-aaaa-4444-aaaa-111111111111', 'Available for daily rehearsals 10am-6pm', NOW() - INTERVAL '12 days'),
  ('dfee65a9-4937-46f0-80f3-65ede111b6e0', 'd2d2d2d2-bbbb-4444-bbbb-222222222222', 'Comfortable delivering scripted lines on camera', NOW() - INTERVAL '18 days'),
  ('2c41c4cf-5fdd-4dd4-8cb7-9d0cb0b0d842', 'd2d2d2d2-bbbb-4444-bbbb-222222222222', 'Prior lifestyle campaign experience preferred', NOW() - INTERVAL '18 days'),
  ('be49f677-be3e-48f5-90e6-6ef3265e8fc0', 'd3d3d3d3-cccc-4444-cccc-333333333333', 'Certified trainer or proven fitness portfolio', NOW() - INTERVAL '9 days');

-- Application records spanning multiple statuses
INSERT INTO applications (id, gig_id, talent_id, status, message, created_at, updated_at)
VALUES
  ('e8ad2d3d-8500-4e4f-8c6b-352adbe0fe71', 'd1d1d1d1-aaaa-4444-aaaa-111111111111', '11111111-1111-1111-1111-111111111111', 'shortlisted', 'Experienced runway talent, available full week.', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  ('72ba215f-d40e-4f2b-8f77-d9513cd5f07f', 'd1d1d1d1-aaaa-4444-aaaa-111111111111', '22222222-2222-2222-2222-222222222222', 'under_review', 'Runway + editorial background.', NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days'),
  ('0171ea21-2d4a-4db0-8cf8-436a039f1427', 'd2d2d2d2-bbbb-4444-bbbb-222222222222', '77777777-7777-7777-7777-777777777777', 'accepted', 'Loves sustainable brands.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
  ('d956c34b-b0c1-4c55-a7c3-57b74af5f7ff', 'd2d2d2d2-bbbb-4444-bbbb-222222222222', '88888888-8888-8888-8888-888888888888', 'rejected', 'Available remote if needed.', NOW() - INTERVAL '6 days', NOW() - INTERVAL '3 days'),
  ('7d06f030-5f04-4471-a48e-2ba32170f6cc', 'd3d3d3d3-cccc-4444-cccc-333333333333', '44444444-4444-4444-4444-444444444444', 'new', 'NASM certified trainer ready for travel.', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day');

-- Confirmed booking to power admin dashboards
INSERT INTO bookings (id, gig_id, talent_id, status, date, compensation, notes, created_at, updated_at)
VALUES
  ('7a9bd9fb-8a44-4a89-94e2-8269fb91504c', 'd2d2d2d2-bbbb-4444-bbbb-222222222222', '77777777-7777-7777-7777-777777777777', 'confirmed', NOW() + INTERVAL '9 days', 3600, 'Signed contract and travel booked.', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

-- Portfolio items for gallery + status badge testing
INSERT INTO portfolio_items (id, talent_id, title, description, image_url, caption, created_at, updated_at)
VALUES
  ('2f2b2c63-9b57-4df7-9b73-6cda2177a09f', '11111111-1111-1111-1111-111111111111', 'Vogue Editorial', 'High-fashion spread for April issue.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1', 'Vogue / Milan', NOW() - INTERVAL '40 days', NOW() - INTERVAL '10 days'),
  ('bbdc0403-92a3-4862-94c4-43216336fdd9', '22222222-2222-2222-2222-222222222222', 'Nike Training Club', 'Global fitness campaign assets.', 'https://images.unsplash.com/photo-1514996937319-344454492b37', 'Nike Global', NOW() - INTERVAL '32 days', NOW() - INTERVAL '8 days'),
  ('8bfd28b9-a9c9-4cbb-894b-e69094f4a816', '77777777-7777-7777-7777-777777777777', 'Joyful Living', 'Lifestyle set for home brand release.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f', 'Joyful Living', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days');

-- Client applications for follow-up reminder coverage
INSERT INTO client_applications (
  id,
  first_name,
  last_name,
  email,
  phone,
  company_name,
  industry,
  website,
  business_description,
  needs_description,
  status,
  admin_notes,
  follow_up_sent_at,
  created_at,
  updated_at
) VALUES
  (
    '53a57d40-93a4-4a02-8eb4-ccd8b8957ab8',
    'Nadia',
    'Singh',
    'nadia@copperandcove.com',
    '+1-555-620-0101',
    'Copper & Cove Jewelry',
    'Luxury Retail',
    'https://copperandcove.com',
    'Boutique jewelry house planning a holiday pop-up series.',
    'Need 6-8 talent for immersive showroom events.',
    'pending',
    NULL,
    NULL,
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    '1bea5343-b7db-4f27-8f57-841cf9619ce9',
    'Harold',
    'Kim',
    'harold@foxfable.com',
    '+1-555-620-0102',
    'Fox & Fable Creative',
    'Media',
    'https://foxfable.com',
    'Creative studio producing a streaming mini-series.',
    'Need recurring cast for 8-week shoot.',
    'approved',
    'Approved 48hr ago. Waiting on contract.',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    'f31f2440-0791-4c37-bb76-0d5087465d59',
    'Sarah',
    'Liu',
    'sarah@avantguard.co',
    '+1-555-620-0103',
    'Avant Guard',
    'Consulting',
    'https://avantguard.co',
    'Creative staffing agency looking for white-label talent supply.',
    'Need exclusive access to TOTL roster (does not fit policy).',
    'rejected',
    'Model agency conflict; suggested alternative partners.',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
  );

-- Moderation flags spanning open and resolved workflows
INSERT INTO content_flags (
  id,
  resource_type,
  resource_id,
  gig_id,
  reporter_id,
  reason,
  details,
  status,
  admin_notes,
  assigned_admin_id,
  resolution_action,
  resolved_at,
  created_at,
  updated_at
) VALUES
  (
    'fb31fdb6-7f10-4e62-9f30-1e5d6a739e65',
    'gig',
    'd3d3d3d3-cccc-4444-cccc-333333333333',
    'd3d3d3d3-cccc-4444-cccc-333333333333',
    '88888888-8888-8888-8888-888888888888',
    'Suspicious casting request',
    'Client requesting off-platform payments.',
    'in_review',
    'Researching contract details.',
    'ca1a1a1a-1111-4444-aaaa-000000000001',
    NULL,
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'e62ca82e-323d-4050-9446-4b4ff6cc9d4e',
    'talent_profile',
    '55555555-5555-5555-5555-555555555555',
    NULL,
    'cb2b2b2b-2222-4444-bbbb-000000000002',
    'Inaccurate portfolio claims',
    'Images appeared AI-generated; verified and cleared.',
    'resolved',
    'Validated authenticity via admin outreach.',
    'ca1a1a1a-1111-4444-aaaa-000000000001',
    'Documented resolution + reminded talent',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 days'
  );