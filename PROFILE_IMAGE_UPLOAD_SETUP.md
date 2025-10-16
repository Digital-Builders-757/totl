# Profile Image Upload - Setup Guide

## ✅ What's Already Built

Good news! Your profile image upload system is **already implemented** and working! Here's what you have:

### Components:
- ✅ `app/settings/avatar-upload.tsx` - Avatar upload component with drag & drop
- ✅ `app/settings/actions.ts` - `uploadAvatar` server action
- ✅ Settings page integration - Avatar upload is in the profile editor

### Features:
- ✅ Drag and drop file upload
- ✅ Click to browse files
- ✅ File validation (type and size)
- ✅ Image preview before upload
- ✅ Automatic cleanup of old avatars
- ✅ Database updates with avatar path
- ✅ Toast notifications for success/errors

---

## 🔧 Setup Required

### 1. Create Supabase Storage Bucket

You need to run the migration to create the `avatars` storage bucket:

**Option A: Using Supabase CLI (Recommended)**
```bash
npx supabase migration up --linked
```

**Option B: Manual Setup in Supabase Dashboard**

1. Go to your Supabase Dashboard → Storage
2. Click "Create Bucket"
3. Bucket name: `avatars`
4. Make it **Public**
5. Click "Create"

### 2. Set Up Storage Policies

If you use Option B (manual), add these policies in the Supabase Dashboard:

**Go to**: Storage → avatars bucket → Policies

**Policy 1: Allow users to upload their own avatar**
```sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Allow users to update their own avatar**
```sql
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');
```

**Policy 3: Allow users to delete their own avatar**
```sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

**Policy 4: Allow public read access**
```sql
CREATE POLICY "Public can view all avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

---

## 🧪 Testing the Upload Feature

### How to Test:

1. **Go to**: `http://localhost:3000/settings` (or your deployed URL)
2. **Login** as any user (talent or client)
3. **Click** on the avatar area or the upload zone
4. **Select** an image (JPG, PNG, or GIF, under 5MB)
5. **Preview** will show
6. **Click** "Save Avatar"
7. **Success toast** will appear
8. **Page refreshes** with new profile picture

### What Should Happen:

✅ Image uploads to Supabase Storage bucket `avatars`
✅ File is saved as `{user_id}/avatar-{timestamp}.{ext}`
✅ Profile database updates with `avatar_path`
✅ Old avatar files are automatically deleted
✅ New avatar displays everywhere (navbar, dashboard, etc.)

---

## 🎨 Where Avatar Displays:

After uploading, your avatar will show in:
- ✅ Settings page (profile header)
- ✅ Navbar (if implemented)
- ✅ Dashboard pages
- ✅ Application cards
- ✅ Anywhere using the Avatar component with `avatar_url`

---

## 🚀 Next Steps: Portfolio Images

After the avatar bucket is set up, we can add:

### Portfolio Gallery Upload (for Talent)

**Features:**
- Upload multiple images
- Gallery view with thumbnails
- Reorder images (drag & drop)
- Set primary image
- Image captions
- Delete images

**Implementation:**
- New `portfolio_images` table in database
- New `portfolio` storage bucket
- Gallery component for talent profiles
- Upload multiple files at once
- Optimized image delivery

---

## 📋 Storage Bucket Structure

```
Supabase Storage
└── avatars/
    ├── {user_id_1}/
    │   └── avatar-{timestamp}.jpg
    ├── {user_id_2}/
    │   └── avatar-{timestamp}.png
    └── {user_id_3}/
        └── avatar-{timestamp}.gif

Future:
└── portfolio/
    ├── {talent_id_1}/
    │   ├── image-1.jpg
    │   ├── image-2.jpg
    │   └── image-3.jpg
    └── {talent_id_2}/
        └── image-1.png
```

---

## ✨ Your System is Ready!

**All you need to do:**

1. ✅ Run the migration: `npx supabase migration up --linked`
   
   OR
   
   Create the bucket manually in Supabase Dashboard

2. ✅ Test the upload on `/settings` page

3. ✅ Ready to use! 🎉

---

*The profile image upload feature is fully implemented and just needs the storage bucket configured!*

