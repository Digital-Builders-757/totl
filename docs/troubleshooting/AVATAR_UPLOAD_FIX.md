# 🖼️ Avatar Upload Fix - Quick Guide

**Issue:** Avatar upload not working in Settings page  
**Root Cause:** Conflicting RLS policies from two different migrations  
**Status:** ✅ SQL fix ready to apply

---

## 🔍 What Went Wrong

**Problem:**
Two migrations created conflicting storage policies:
1. **December 2024** migration expected: `avatars/user-id.jpg`
2. **August 2025** migration expected: `user-id/avatar-timestamp.jpg`

Your code uses the **second pattern**, but the old policies are blocking uploads!

---

## ✅ Quick Fix (2 minutes)

### Step 1: Run the Fix Script

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your TOTL project

2. **Open SQL Editor:**
   - Left sidebar → SQL Editor → New Query

3. **Copy and paste this script:**
   ```sql
   -- Copy the entire contents of scripts/fix-avatar-upload-policies.sql
   ```
   
   Or directly:
   ```sql
   BEGIN;

   -- Drop all conflicting policies
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

   -- Ensure avatars bucket is public
   UPDATE storage.buckets 
   SET public = true 
   WHERE id = 'avatars';

   -- Create working policies
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
   ```

4. **Click "Run"** (or press Ctrl+Enter)

5. **Verify success:** Should see "Success. No rows returned"

### Step 2: Verify Policies

Run this query to verify the policies are correct:

```sql
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname LIKE '%Avatar%'
ORDER BY policyname;
```

**Expected Result:** You should see 4 policies:
- ✅ Avatar delete: user folder only
- ✅ Avatar read: public access  
- ✅ Avatar update: user folder only
- ✅ Avatar upload: user folder only

### Step 3: Test Upload

1. **Go to your app:** `http://localhost:3000/settings`
2. **Click the avatar upload area**
3. **Select an image** (JPG, PNG, or GIF < 5MB)
4. **Click "Save Avatar"**
5. **Should see:** "Avatar updated" success message
6. **Page refreshes** and shows your new avatar

---

## 🔧 If It Still Doesn't Work

### Check Browser Console:

1. Open DevTools (F12)
2. Go to Console tab
3. Try uploading again
4. Look for errors like:
   - "Failed to upload image"
   - "Authentication failed"
   - Any Supabase storage errors

### Check Network Tab:

1. Open DevTools (F12) → Network tab
2. Try uploading
3. Look for failed requests (red)
4. Click on failed request → Preview/Response tab
5. Copy the error message

**Send me the error details and I'll fix it!**

---

## 📊 Technical Details

### Path Structure
Your code creates paths like:
```
{user-id}/avatar-{timestamp}.{ext}

Example:
550e8400-e29b-41d4-a716-446655440000/avatar-1730000000.jpg
```

### How The Policy Works
```sql
(storage.foldername(name))[1] = auth.uid()::text
```

This checks that:
- The first folder in the path equals the authenticated user's ID
- Users can only upload to their own folder
- Prevents users from uploading to other users' folders

### Why Public Bucket?
```sql
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
```

- Avatars need to be visible across the app
- Other users view talent profiles with avatars
- Public bucket + RLS policies = secure + convenient
- Upload/update/delete still protected by auth
- Read access is public (displaying avatars)

---

## ✅ Success Indicators

After applying the fix, you should be able to:

- ✅ Click the upload area in Settings
- ✅ Select an image file
- ✅ See preview immediately
- ✅ Click "Save Avatar" button
- ✅ See uploading spinner
- ✅ Get success toast notification
- ✅ Page refreshes with new avatar
- ✅ Avatar displays in navbar
- ✅ Avatar displays in profile

---

## 🚨 Common Issues & Solutions

### "Failed to upload image. Please try again."
**Cause:** RLS policy blocking upload  
**Fix:** Run the SQL script above

### "Authentication failed"
**Cause:** Not logged in or session expired  
**Fix:** Log in again

### "File too large"
**Cause:** File > 5MB  
**Fix:** Resize image or use smaller file

### "Invalid file type"
**Cause:** Not JPG/PNG/GIF  
**Fix:** Convert image to supported format

---

## 📝 Future Prevention

The fix migration (`20251021000514_fix_avatars_bucket_policies.sql`) will be applied in future deployments, so this issue won't recur.

For now, running the SQL manually gets you unblocked immediately!

---

**Run the SQL script in Supabase Dashboard and your avatar upload should work!** 🎉

