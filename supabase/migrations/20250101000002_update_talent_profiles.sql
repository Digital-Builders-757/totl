-- Add new fields to talent_profiles table
ALTER TABLE talent_profiles
ADD COLUMN IF NOT EXISTS specialties TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT;
