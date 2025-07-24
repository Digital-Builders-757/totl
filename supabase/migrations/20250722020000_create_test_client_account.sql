-- Migration: Create Test Client Account
-- Date: 2025-07-22
-- Description: Creates a test client account for testing gig creation and platform functionality

-- Create a test client user in auth.users (simulating signup)
-- Note: In production, this would be done via Supabase Auth signup
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  'test-client-1234-5678-9abc-def012345678',
  'testclient@example.com',
  crypt('TestPassword123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"role": "client", "first_name": "Test", "last_name": "Client", "company_name": "Test Company Inc."}'
);

-- Create the profile record
INSERT INTO profiles (
  id,
  role,
  display_name,
  email_verified,
  created_at,
  updated_at
) VALUES (
  'test-client-1234-5678-9abc-def012345678',
  'client',
  'Test Company Inc.',
  true,
  NOW(),
  NOW()
);

-- Create the client profile record
INSERT INTO client_profiles (
  user_id,
  company_name,
  industry,
  website,
  contact_name,
  contact_email,
  contact_phone,
  company_size,
  created_at,
  updated_at
) VALUES (
  'test-client-1234-5678-9abc-def012345678',
  'Test Company Inc.',
  'Fashion',
  'https://testcompany.com',
  'Test Client',
  'testclient@example.com',
  '+1-555-0123',
  '10-50',
  NOW(),
  NOW()
);

-- Add a comment for documentation
COMMENT ON TABLE profiles IS 'Test client account created for gig creation testing - testclient@example.com'; 