# 🔐 Complete Environment Variables List for TOTL Agency

**Created:** January 2025  
**Purpose:** Complete reference for all environment variables needed in `.env.local`

---

## 📋 **REQUIRED Variables (Must Have)**

### 🔐 **Supabase Configuration** (REQUIRED)

**Get from:** https://supabase.com/dashboard/project/utvircuwknqzpnmvxidp/settings/api

| Variable | Description | Where to Find | Example |
|----------|-------------|---------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project URL | Settings → API → Project URL | `https://utvircuwknqzpnmvxidp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser-safe) | Settings → API → anon public | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_URL` | Server-side Supabase URL | Same as above | `https://utvircuwknqzpnmvxidp.supabase.co` |
| `SUPABASE_ANON_KEY` | Server-side anon key | Same as above | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ Admin key (NEVER expose!) | Settings → API → service_role | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_PROJECT_ID` | Project identifier | Settings → General → Reference ID | `utvircuwknqzpnmvxidp` |
| `SUPABASE_ACCESS_TOKEN` | CLI access token (optional) | Account → Access Tokens → Create new | `sbp_...` |

### 📧 **Resend Email Configuration** (REQUIRED for emails)

**Get from:** https://resend.com/api-keys

| Variable | Description | Where to Find | Example |
|----------|-------------|---------------|---------|
| `RESEND_API_KEY` | Resend API key for sending emails | API Keys → Create new key | `re_1234567890abcdef...` |
| `ADMIN_EMAIL` | Email for admin notifications | Your email address | `admin@thetotlagency.com` |

### 💳 **Stripe Configuration** (REQUIRED for subscriptions)

**Get from:** https://dashboard.stripe.com

| Variable | Description | Where to Find | Example |
|----------|-------------|---------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Developers → API Keys → Secret key | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Developers → Webhooks → Your endpoint → Signing secret | `whsec_...` |
| `STRIPE_PRICE_TALENT_MONTHLY` | Monthly subscription price ID | Products → Your product → Monthly price ID | `price_1SXZFiL74RJvr6jHynEWFxaT` |
| `STRIPE_PRICE_TALENT_ANNUAL` | Annual subscription price ID | Products → Your product → Annual price ID | `price_1SXZFiL74RJvr6jH26OFzsvl` |

### 🌐 **Site Configuration** (REQUIRED)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SITE_URL` | Base URL for your application | `http://localhost:3000` (dev) or `https://www.thetotlagency.com` (prod) |

---

## 🔍 **Optional Variables (Recommended)**

### 🔍 **Sentry Error Tracking** (Optional but recommended)

**Get from:** https://sentry.io

| Variable | Description | Where to Find | Example |
|----------|-------------|---------------|---------|
| `SENTRY_DSN_DEV` | Sentry DSN for development | Settings → Projects → TOTL → Client Keys (DSN) | `https://...@...sentry.io/...` |
| `SENTRY_DSN_PROD` | Sentry DSN for production | Same as above (use prod project) | `https://...@...sentry.io/...` |
| `SENTRY_AUTH_TOKEN` | Sentry auth token | Settings → Account → Auth Tokens | `...` |
| `SENTRY_ORG` | Sentry organization slug | Organization settings | `your-org-slug` |
| `SENTRY_PROJECT` | Sentry project name | Project settings | `totl` |
| `NEXT_PUBLIC_SENTRY_DSN` | Public Sentry DSN (optional) | Same as SENTRY_DSN_DEV | `https://...@...sentry.io/...` |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Sentry environment tag | Custom value | `development` or `production` |

### 🔧 **Vercel Configuration** (Auto-set in production)

| Variable | Description | Example |
|----------|-------------|---------|
| `VERCEL_ENV` | Vercel environment | `development`, `preview`, or `production` |
| `NEXT_PUBLIC_VERCEL_ENV` | Public Vercel environment | Same as above |

### 🧪 **Testing Variables** (Optional - for Playwright tests)

| Variable | Description | Example |
|----------|-------------|---------|
| `PLAYWRIGHT_TALENT_EMAIL` | Test talent account email | `test-talent@example.com` |
| `PLAYWRIGHT_TALENT_PASSWORD` | Test talent account password | `test-password-123` |
| `PLAYWRIGHT_TEST_PASSWORD` | Default password used for dynamically-created Playwright users (admin API + signup flows) | `TestPassword123!` |
| `PLAYWRIGHT_TEST_GIG_ID` | Test gig ID for integration tests | `123e4567-e89b-12d3-a456-426614174000` |
| `PLAYWRIGHT_TEST_BASE_URL` | Base URL for Playwright tests | `http://localhost:3000` |

---

## 📝 **Complete .env.local Template**

Copy this template and fill in your actual values:

```bash
# ======================================
# TOTL Agency - Local Development Environment
# ======================================
# IMPORTANT: This file contains sensitive credentials
# DO NOT commit this file to version control
# ======================================

# ======================================
# 🌐 Site Configuration (REQUIRED)
# ======================================
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ======================================
# 🔐 Supabase Configuration (REQUIRED)
# ======================================
# Get from: https://supabase.com/dashboard/project/utvircuwknqzpnmvxidp/settings/api

# Public (browser-safe) - REQUIRED
NEXT_PUBLIC_SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# Server-side - REQUIRED
SUPABASE_URL=https://utvircuwknqzpnmvxidp.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE

# ⚠️ Admin only (NEVER expose to browser!) - REQUIRED
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Project configuration
SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp
# NOTE (CLI-only secret):
# Do NOT keep SUPABASE_ACCESS_TOKEN in .env.local (Next loads it). Put it in .env.cli instead.
# SUPABASE_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE

# ======================================
# 📧 Resend Email (REQUIRED for emails)
# ======================================
# Get from: https://resend.com/api-keys
RESEND_API_KEY=re_YOUR_RESEND_API_KEY

# Admin notifications email
ADMIN_EMAIL=admin@thetotlagency.com

# ======================================
# 💳 Stripe Configuration (REQUIRED for subscriptions)
# ======================================
# Get from: https://dashboard.stripe.com
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
STRIPE_PRICE_TALENT_MONTHLY=price_1SXZFiL74RJvr6jHynEWFxaT
STRIPE_PRICE_TALENT_ANNUAL=YOUR_ANNUAL_PRICE_ID

# ======================================
# 🔍 Sentry Error Tracking (Optional)
# ======================================
# Get from: https://sentry.io
SENTRY_DSN_DEV=YOUR_DEV_DSN
SENTRY_DSN_PROD=YOUR_PROD_DSN
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=totl
NEXT_PUBLIC_SENTRY_DSN=YOUR_PUBLIC_DSN
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development

# ======================================
# 🔧 Vercel (Auto-set in production)
# ======================================
VERCEL_ENV=development
NEXT_PUBLIC_VERCEL_ENV=development

# ======================================
# 🧪 Testing (Optional - for Playwright)
# ======================================
PLAYWRIGHT_TALENT_EMAIL=test-talent@example.com
PLAYWRIGHT_TALENT_PASSWORD=test-password-123
PLAYWRIGHT_TEST_PASSWORD=TestPassword123!
PLAYWRIGHT_TEST_GIG_ID=123e4567-e89b-12d3-a456-426614174000
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

---

## 🎯 **Quick Setup Checklist**

### **Step 1: Supabase Keys** ⏱️ 5 minutes
- [ ] Go to https://supabase.com/dashboard/project/utvircuwknqzpnmvxidp/settings/api
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL` (already known: `https://utvircuwknqzpnmvxidp.supabase.co`)
- [ ] Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon public key)
- [ ] Copy `SUPABASE_SERVICE_ROLE_KEY` (service_role key)
- [ ] Set `SUPABASE_PROJECT_ID=utvircuwknqzpnmvxidp`
- [ ] (Optional) Get `SUPABASE_ACCESS_TOKEN` from Account → Access Tokens
- [ ] Save `SUPABASE_ACCESS_TOKEN` to `.env.cli` (not `.env.local`)

### **Step 2: Resend API Key** ⏱️ 3 minutes
- [ ] Go to https://resend.com/api-keys
- [ ] Create new API key: `TOTL Agency Development`
- [ ] Copy `RESEND_API_KEY` (starts with `re_`)
- [ ] Set `ADMIN_EMAIL` to your email address

### **Step 3: Stripe Keys** ⏱️ 10 minutes
- [ ] Go to https://dashboard.stripe.com
- [ ] Copy `STRIPE_SECRET_KEY` from Developers → API Keys (Secret key)
- [ ] Create webhook endpoint: Developers → Webhooks → Add endpoint
- [ ] Copy `STRIPE_WEBHOOK_SECRET` from webhook details
- [ ] Get price IDs from Products → Your subscription product
- [ ] Copy `STRIPE_PRICE_TALENT_MONTHLY` and `STRIPE_PRICE_TALENT_ANNUAL`

### **Step 4: Site URL** ⏱️ 1 minute
- [ ] Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` (for local dev)

### **Step 5: Optional - Sentry** ⏱️ 5 minutes
- [ ] Go to https://sentry.io
- [ ] Get DSN from Settings → Projects → TOTL → Client Keys
- [ ] Copy `SENTRY_DSN_DEV` and `SENTRY_DSN_PROD`
- [ ] Get auth token from Settings → Account → Auth Tokens

---

## 🔗 **Quick Links**

- **Supabase Dashboard:** https://supabase.com/dashboard/project/utvircuwknqzpnmvxidp/settings/api
- **Resend API Keys:** https://resend.com/api-keys
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Sentry Dashboard:** https://sentry.io

---

## ✅ **Verification**

After creating `.env.local`, verify it works:

```bash
# Check environment variables are loaded
npm run env:check

# Should output:
# ✅ NEXT_PUBLIC_SUPABASE_URL: Set
# ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set
# ✅ SUPABASE_SERVICE_ROLE_KEY: Set
# ✅ RESEND_API_KEY: Set
# ✅ STRIPE_SECRET_KEY: Set
# etc...
```

---

## 🚨 **Security Reminders**

### ❌ **NEVER:**
- Commit `.env.local` to git (it's already in `.gitignore`)
- Share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- Expose service role keys in browser code
- Push `.env.local` to GitHub
- Share Stripe secret keys

### ✅ **ALWAYS:**
- Keep `.env.local` in `.gitignore` (already done)
- Use `NEXT_PUBLIC_*` only for browser-safe values
- Store service role keys server-side only
- Use different keys for dev/prod environments
- Rotate keys periodically

---

## 📊 **Summary by Priority**

### **🔴 Critical (App won't work without these):**
1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_SITE_URL`

### **🟡 Important (Core features need these):**
5. `RESEND_API_KEY` (for emails)
6. `ADMIN_EMAIL` (for notifications)
7. `STRIPE_SECRET_KEY` (for subscriptions)
8. `STRIPE_WEBHOOK_SECRET` (for webhooks)
9. `STRIPE_PRICE_TALENT_MONTHLY` (for subscriptions)
10. `STRIPE_PRICE_TALENT_ANNUAL` (for subscriptions)

### **🟢 Optional (Nice to have):**
11. Sentry variables (error tracking)
12. Testing variables (Playwright)
13. `SUPABASE_ACCESS_TOKEN` (CLI operations)

---

**Total Required Variables:** 10  
**Total Optional Variables:** 8  
**Total Variables:** 18

---

**Need help?** Check:
- `docs/ENV_SETUP_GUIDE.md` - Detailed setup instructions
- `docs/ENV_SETUP_GUIDE.md` - Quick start guide
- `docs/STRIPE_ENV_VARIABLES.txt` - Stripe-specific setup

