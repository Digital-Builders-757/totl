# 📸 Where to Find Picture Upload in TOTL Agency

**Last Updated:** October 22, 2025

## 🎯 Quick Answer

The picture/avatar upload is in the **Settings page**, but you need to be **logged in** to see it!

---

## 📍 Step-by-Step Location

### Step 1: Make Sure You're Logged In
1. Go to `http://localhost:3000`
2. Click **"Sign In"** in the top right
3. Log in with your talent account

### Step 2: Navigate to Settings
**Option A:** Click your name/avatar in the navbar → **"Profile Settings"**

**Option B:** Go directly to: `http://localhost:3000/settings`

### Step 3: Find the Avatar Upload
When the Settings page loads, you should see **immediately at the top**:

```
┌─────────────────────────────────────────────────────┐
│  [Avatar]  [Upload Area]                            │
│   Circle    ┌─────────────────────────────────┐    │
│   Image     │  📤 Drag and drop or click      │    │
│             │  JPG, PNG or GIF. Max 5MB.      │    │
│             └─────────────────────────────────┘    │
│                                                      │
│  Your Name                                          │
│  your.email@example.com                             │
└─────────────────────────────────────────────────────┘
```

---

## 🖼️ Two Types of Picture Uploads

### 1. **Avatar/Profile Picture** (All Users)
- **Location:** Settings → Top of page
- **What it's for:** Your main profile picture (shows in navbar, dashboards, etc.)
- **File types:** JPG, PNG, GIF
- **Max size:** 5MB
- **Features:**
  - Drag & drop
  - Click to browse
  - Live preview
  - Auto-cleanup of old avatars

### 2. **Portfolio Gallery** (Talent Only)
- **Location:** Settings → Portfolio Tab
- **What it's for:** Showcase your work with multiple images
- **Features:**
  - Multiple images
  - Add titles and captions
  - Set primary image
  - Reorder images

---

## 🚨 Troubleshooting: "I Still Don't See It!"

### Problem 1: Not Logged In
**Symptom:** Settings page says "Please log in"  
**Solution:** Sign in first at `/login`

### Problem 2: Settings Page Not Loading
**Symptom:** Page is blank or shows error  
**Solution:** 
1. Check dev server is running: `npx next dev`
2. Visit `http://localhost:3000/settings`
3. Check browser console for errors (F12)

### Problem 3: Avatar Upload Component Missing
**Symptom:** Settings page loads but no upload area visible  
**Solution:** Clear cache and hard refresh:
- Press `Ctrl + Shift + R` (Windows)
- Or `Cmd + Shift + R` (Mac)

### Problem 4: Upload Fails
**Symptom:** Click upload but nothing happens or error appears  
**Solution:** Check Supabase storage bucket:
1. Go to Supabase Dashboard
2. Storage → Check if `avatars` bucket exists
3. If not, run migration:
   ```bash
   npx supabase migration up --linked
   ```

---

## 💻 Component Location in Code

If you're looking at the code:

**Component:** `app/settings/avatar-upload.tsx`  
**Used in:** `app/settings/profile-editor.tsx` (lines 49-56)  
**Settings Page:** `app/settings/page.tsx`

**Code snippet from profile-editor.tsx:**
```tsx
<AvatarUpload
  currentAvatarUrl={avatarSrc}
  userEmail={user.email || ""}
  displayName={profile.display_name}
/>
```

---

## ✅ Quick Test Checklist

Before asking for help, verify:

- [ ] Dev server is running (`npx next dev`)
- [ ] You're logged in to the app
- [ ] You're on `/settings` page
- [ ] Browser cache is cleared (hard refresh)
- [ ] You can see the Settings page header
- [ ] Supabase `avatars` bucket exists

---

## 🎥 What You Should See (ASCII Visual)

```
SETTINGS PAGE
─────────────────────────────────────────

┌───────────────────────────────────────┐
│                                        │
│  ●───●  ┌──────────────────────────┐ │ ← Avatar Upload Here!
│  │ O │  │ 📤 Drag and drop or click│ │
│  ●───●  │ JPG, PNG or GIF. Max 5MB │ │
│         └──────────────────────────┘ │
│                                        │
│  John Doe                              │
│  john@example.com                      │
└───────────────────────────────────────┘

┌───────────────────────────────────────┐
│  Manage your profile information       │
│                                        │
│  [Basic Info] [Details] [Portfolio]   │ ← Tabs
│                                        │
│  ... form fields ...                   │
└───────────────────────────────────────┘
```

---

## 📞 Still Can't Find It?

If you've checked everything above and still don't see the upload:

1. **Check browser console** (F12 → Console tab)
2. **Look for React errors** in the console
3. **Check network tab** - is the Settings API call failing?
4. **Verify Supabase connection** - check `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📚 Related Documentation

- `docs/PROFILE_IMAGE_UPLOAD_SETUP.md` - Full setup guide
- `docs/AVATAR_UPLOAD_FIX.md` - RLS policy fixes
- `docs/TROUBLESHOOTING_GUIDE.md` - General troubleshooting

