# 🔐 Environment Variables Setup Guide

**Created:** November 1, 2025  
**Purpose:** Complete guide to recreating your `.env.local` file

---

## 📋 **Quick Setup**

### **Step 1: Create the File**

In your project root (`C:\Users\young\Desktop\Project Files\totl`), create a file named `.env.local`

### **Step 2: Copy This Template**

```bash
# ======================================
# TOTL Agency - Local Development Environment
# ======================================

# ======================================
# 🌐 Site Configuration
# ======================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ======================================
# 🔐 Supabase Configuration (REQUIRED)
# ======================================
# Get from: https://supabase.com/dashboard → Your Project → Settings → API

# Public (browser-safe)
NEXT_PUBLIC_SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Server-side (preferred)
SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# ⚠️ Admin only (NEVER expose to browser!)
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Project configuration
SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp
SUPABASE_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE

# ======================================
# 📧 Resend Email (REQUIRED for emails)
# ======================================
RESEND_API_KEY=re_YOUR_RESEND_API_KEY

# Admin notifications email (NEW!)
ADMIN_EMAIL=admin@thetotlagency.com

# ======================================
# 🔍 Sentry Error Tracking (Optional)
# ======================================
SENTRY_DSN_DEV=YOUR_DEV_DSN
SENTRY_DSN_PROD=YOUR_PROD_DSN
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=totl

# ======================================
# 🔧 Vercel (Auto-set in production)
# ======================================
VERCEL_ENV=development
```

---

## 🔑 **Where to Get Your Keys**

### **1. Supabase Keys**

**Navigate to:** https://supabase.com/dashboard

1. **Select your project** (TOTL Agency)
2. **Go to:** Settings → API
3. **Copy these values:**

| Variable | Location | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Looks like: `https://utvircuwknqzpnmvxidp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public | Starts with `eyJhbGci...` (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | ⚠️ **NEVER expose to browser!** |

4. **For Access Token:**
   - Go to: Account → Access Tokens
   - Create new token: `TOTL Development`
   - Copy token (starts with `sbp_`)

### **2. Resend API Key**

**Navigate to:** https://resend.com/api-keys

1. **Login** to your Resend account
2. **Click:** API Keys
3. **Create new key:** `TOTL Agency Development`
4. **Copy the key** (starts with `re_`)

⚠️ **Important:** You can only see the key once! Save it immediately.

### **3. Admin Email**

**Set this to:** Your email address for receiving client application notifications

Example:
```bash
ADMIN_EMAIL=your.email@thetotlagency.com
```

### **4. Sentry (Optional - for error tracking)**

**Navigate to:** https://sentry.io

1. **Go to:** Settings → Projects → TOTL → Client Keys (DSN)
2. **Copy DSN** for dev/prod
3. **Auth Token:** Settings → Account → Auth Tokens

---

## ✅ **Verification**

After creating `.env.local`, verify it works:

```bash
# Check environment variables are loaded
npm run env:check

# Should output:
# ✅ NEXT_PUBLIC_SUPABASE_URL: Set
# ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set
# ✅ RESEND_API_KEY: Set
```

---

## 🎯 **Quick Copy Template (Minimal)**

**For quick setup, here's the absolute minimum needed:**

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp

# Resend (REQUIRED for emails)
RESEND_API_KEY=re_YOUR_KEY

# Admin Email (NEW - for client applications)
ADMIN_EMAIL=your@email.com

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🚨 **Security Reminders**

### ❌ NEVER:
- Commit `.env.local` to git
- Share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- Expose service role key in browser code
- Push `.env.local` to GitHub

### ✅ ALWAYS:
- Keep `.env.local` in `.gitignore` (already done)
- Use `NEXT_PUBLIC_*` only for browser-safe values
- Store service role keys server-side only
- Use different keys for dev/prod environments

---

## 📝 **Your Specific Values**

Based on your project configuration, I can see:

✅ **Supabase Project ID:** `utvircuwknqzpnmvxidp`  
✅ **Supabase URL:** `https://utvircuwknqzpnmvxidp.supabase.co`

**You need to get from Supabase Dashboard:**
- Anon public key
- Service role key (admin operations)
- Access token (CLI operations)

**You need to get from Resend:**
- API key for sending emails

---

## 🔧 **After Creating .env.local**

```bash
# 1. Verify environment
npm run env:check

# 2. Test Supabase connection
npm run dev
# Visit: http://localhost:3000

# 3. Test email sending
# Submit a test client application at: http://localhost:3000/client/apply
```

---

## 💡 **Pro Tips**

### **Use Multiple .env Files:**

```bash
.env.local          # Your local development (not in git)
.env.development    # Shared dev defaults (can be in git)
.env.production     # Production config (Vercel dashboard)
```

### **VS Code Extension:**

Install "DotENV" extension for syntax highlighting in `.env` files!

---

## 🆘 **Troubleshooting**

### **"Supabase configuration missing" error:**
- Check `.env.local` exists in project root
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set
- Restart dev server after creating `.env.local`

### **Emails not sending:**
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for domain verification
- Look for `[DEV]` in console logs (means API key missing)

### **Can't authenticate:**
- Check both `NEXT_PUBLIC_` and non-public Supabase vars are set
- Restart dev server
- Clear browser cache and cookies

---

## 📋 **Checklist**

- [ ] Created `.env.local` in project root
- [ ] Added all Supabase variables
- [ ] Added Resend API key
- [ ] Added admin email address
- [ ] Added site URL
- [ ] Ran `npm run env:check` to verify
- [ ] Restarted dev server
- [ ] Tested login works
- [ ] Tested email sending works

---

**Need help getting your keys?** Check the sections above or see:
- **Supabase:** `docs/ENVIRONMENT_SETUP.md`
- **Resend:** `docs/EMAIL_NOTIFICATION_SYSTEM_IMPLEMENTATION.md`

---

**Once your `.env.local` is set up, the client application emails will work automatically with Resend!** 🎉

