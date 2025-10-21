-- =====================================================
-- TOTL Agency - Fix Avatars Bucket Policies
-- =====================================================
-- Date: 2025-10-21
-- Purpose: Resolve conflicting avatar storage policies from two previous migrations
-- Issue: Two migrations created conflicting policies with different folder structures
-- Solution: Drop old policies and ensure clean, working policies for current code
-- Path structure used by code: {user_id}/avatar-{timestamp}.{ext}

BEGIN;

-- =====================================================
-- 1. DROP ALL EXISTING AVATAR POLICIES (if they exist)
-- =====================================================

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: user can insert own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: user can update own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: user can read own" ON storage.objects;
DROP POLICY IF EXISTS "Avatars: user can delete own" ON storage.objects;
DROP POLICY IF EXISTS "Avatar upload: user folder only" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update: user folder only" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete: user folder only" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read: public access" ON storage.objects;

-- =====================================================
-- 2. CREATE CLEAN, WORKING POLICIES
-- =====================================================
-- Path structure matches code: {user_id}/avatar-{timestamp}.{ext}

-- Policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Avatar upload: user folder only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update files in their own folder
CREATE POLICY "Avatar update: user folder only"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete files in their own folder
CREATE POLICY "Avatar delete: user folder only"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to all avatars (for displaying profile pictures)
CREATE POLICY "Avatar read: public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

COMMIT;
