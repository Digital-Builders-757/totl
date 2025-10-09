-- Mock Talent Data for TOTL Agency
-- This script creates realistic talent profiles for demonstration purposes

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
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'talent', 'Mia Taylor', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

-- Now, let's create detailed talent profiles
INSERT INTO talent_profiles (
  id, user_id, first_name, last_name, phone, age, location, experience, 
  portfolio_url, height, measurements, hair_color, eye_color, shoe_size, 
  languages, experience_years, specialties, weight, created_at, updated_at
) VALUES

-- Emma Rodriguez - Fashion Model
('talent-001', '11111111-1111-1111-1111-111111111111', 'Emma', 'Rodriguez', '+1-555-0101', 24, 'Los Angeles, CA', 
 'Professional fashion model with 3 years of experience in runway, editorial, and commercial work. Featured in Vogue, Elle, and Harper''s Bazaar.',
 'https://emmarodriguez.portfolio.com', '5''9"', '34-24-35', 'Brunette', 'Brown', '8', 
 ARRAY['English', 'Spanish'], 3, ARRAY['Fashion', 'Runway', 'Editorial'], 125, NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days'),

-- Marcus Johnson - Commercial Model
('talent-002', '22222222-2222-2222-2222-222222222222', 'Marcus', 'Johnson', '+1-555-0102', 28, 'New York, NY',
 'Versatile commercial model specializing in lifestyle, fitness, and corporate photography. Strong presence in advertising campaigns.',
 'https://marcusjohnson.models.com', '6''2"', '42-32-36', 'Black', 'Brown', '11',
 ARRAY['English'], 5, ARRAY['Commercial', 'Fitness', 'Lifestyle'], 185, NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days'),

-- Sofia Chen - Editorial Model
('talent-003', '33333333-3333-3333-3333-333333333333', 'Sofia', 'Chen', '+1-555-0103', 22, 'San Francisco, CA',
 'Emerging editorial model with a unique look. Experienced in high-fashion shoots and artistic photography.',
 'https://sofiachen.art', '5''7"', '32-23-34', 'Black', 'Brown', '7',
 ARRAY['English', 'Mandarin'], 2, ARRAY['Editorial', 'Artistic', 'High Fashion'], 115, NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),

-- James Wilson - Fitness Model
('talent-004', '44444444-4444-4444-4444-444444444444', 'James', 'Wilson', '+1-555-0104', 26, 'Miami, FL',
 'Certified personal trainer and fitness model. Specializes in athletic wear, supplement, and fitness equipment campaigns.',
 'https://jameswilson.fitness', '6''0"', '44-32-38', 'Blonde', 'Blue', '10',
 ARRAY['English'], 4, ARRAY['Fitness', 'Athletic', 'Health'], 195, NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day'),

-- Isabella Martinez - Plus Size Model
('talent-005', '55555555-5555-5555-5555-555555555555', 'Isabella', 'Martinez', '+1-555-0105', 29, 'Chicago, IL',
 'Confident plus-size model promoting body positivity and inclusivity in fashion. Featured in major campaigns.',
 'https://isabellamartinez.plus', '5''8"', '42-36-44', 'Brown', 'Hazel', '9',
 ARRAY['English', 'Spanish'], 6, ARRAY['Plus Size', 'Body Positivity', 'Fashion'], 165, NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days'),

-- Alexander Thompson - Male Fashion Model
('talent-006', '66666666-6666-6666-6666-666666666666', 'Alexander', 'Thompson', '+1-555-0106', 25, 'Portland, OR',
 'High-fashion male model with international experience. Known for editorial work and luxury brand campaigns.',
 'https://alexanderthompson.fashion', '6''1"', '40-30-35', 'Brown', 'Green', '10',
 ARRAY['English', 'French'], 4, ARRAY['High Fashion', 'Editorial', 'Luxury'], 175, NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),

-- Olivia Davis - Lifestyle Model
('talent-007', '77777777-7777-7777-7777-777777777777', 'Olivia', 'Davis', '+1-555-0107', 23, 'Austin, TX',
 'Natural lifestyle model perfect for family, home, and lifestyle brands. Authentic and relatable presence.',
 'https://oliviadavis.life', '5''6"', '34-26-36', 'Blonde', 'Blue', '8',
 ARRAY['English'], 3, ARRAY['Lifestyle', 'Family', 'Home'], 130, NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

-- Ethan Brown - Commercial Actor/Model
('talent-008', '88888888-8888-8888-8888-888888888888', 'Ethan', 'Brown', '+1-555-0108', 31, 'Seattle, WA',
 'Versatile commercial talent with acting background. Perfect for video campaigns, commercials, and branded content.',
 'https://ethanbrown.commercial', '5''11"', '38-30-34', 'Brown', 'Brown', '9',
 ARRAY['English'], 7, ARRAY['Commercial', 'Acting', 'Video'], 170, NOW() - INTERVAL '8 days', NOW() - INTERVAL '3 days'),

-- Ava Garcia - Beauty Model
('talent-009', '99999999-9999-9999-9999-999999999999', 'Ava', 'Garcia', '+1-555-0109', 27, 'Denver, CO',
 'Specialized beauty and skincare model with flawless skin and versatile look. Perfect for beauty campaigns.',
 'https://avagarcia.beauty', '5''7"', '36-25-37', 'Black', 'Brown', '8',
 ARRAY['English', 'Spanish'], 5, ARRAY['Beauty', 'Skincare', 'Makeup'], 125, NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'),

-- Liam Anderson - Mature Model
('talent-010', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Liam', 'Anderson', '+1-555-0110', 45, 'Boston, MA',
 'Distinguished mature model perfect for luxury, financial, and professional campaigns. Sophisticated and trustworthy presence.',
 'https://liamanderson.mature', '6''0"', '42-34-40', 'Salt & Pepper', 'Blue', '10',
 ARRAY['English'], 15, ARRAY['Mature', 'Professional', 'Luxury'], 185, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),

-- Mia Taylor - New Face
('talent-011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Mia', 'Taylor', '+1-555-0111', 19, 'Nashville, TN',
 'Fresh new face with natural beauty and potential. Eager to learn and grow in the modeling industry.',
 'https://miataylor.new', '5''8"', '34-24-36', 'Auburn', 'Green', '8',
 ARRAY['English'], 1, ARRAY['New Face', 'Natural', 'Fresh'], 120, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');

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