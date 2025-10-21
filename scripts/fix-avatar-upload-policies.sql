-- =====================================================
-- QUICK FIX: Avatar Upload Policies
-- =====================================================
-- Run this in Supabase Dashboard → SQL Editor
-- This fixes the avatar upload issue immediately
-- =====================================================

BEGIN;

-- 1. Drop all existing conflicting policies
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

-- 2. Ensure avatars bucket is public (for displaying profile pictures)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- 3. Create clean, working policies
-- Path structure: {user_id}/avatar-{timestamp}.{ext}

CREATE POLICY "Avatar upload: user folder only"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

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

CREATE POLICY "Avatar delete: user folder only"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatar read: public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

COMMIT;

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this after to verify policies are correct:

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%Avatar%'
ORDER BY policyname;

