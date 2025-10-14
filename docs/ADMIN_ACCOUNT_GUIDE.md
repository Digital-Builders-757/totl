# 🔐 Admin Account & Dashboard Guide

**Last Updated:** October 11, 2025  
**Purpose:** Complete guide to understanding and managing admin accounts in TOTL Agency

---

## 📋 Table of Contents

1. [Admin System Overview](#admin-system-overview)
2. [Understanding Dashboard "Cache"](#understanding-dashboard-cache)
3. [Creating Your First Admin Account](#creating-your-first-admin-account)
4. [Admin Dashboard Features](#admin-dashboard-features)
5. [Admin Permissions](#admin-permissions)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Admin System Overview

The TOTL Agency platform has three user roles:
- **Talent** - Models, actors, performers
- **Client** - Companies, casting directors, agencies
- **Admin** - Platform administrators (you!)

### Admin Capabilities:
✅ View all gigs (including drafts)  
✅ View all applications  
✅ View all users (talent and clients)  
✅ Create new users with any role  
✅ Manage platform content  
✅ Access diagnostic tools  
✅ Full platform oversight

---

## 🗄️ Understanding Dashboard "Cache"

### What You're Seeing

When you look at the database types (`types/database.ts`), you'll see several "views":

```typescript
Views: {
  admin_bookings_dashboard: { ... }
  admin_dashboard_cache: { ... }      // ← This one!
  admin_talent_dashboard: { ... }
}
```

### What Are These?

These are **PostgreSQL database views** - NOT traditional caches. Think of them as "saved queries" or "virtual tables."

#### **`admin_talent_dashboard`** (USED ✅)
- **Location:** Created in `supabase/migrations/20250813193749_admin_talent_dashboard_view.sql`
- **Purpose:** Pre-joins applications + gigs + profiles data
- **Used in:** `/admin/talentdashboard` and `/admin/talent-dashboard`
- **SQL:**
  ```sql
  SELECT 
    a.id as application_id,
    a.talent_id,
    a.status as application_status,
    g.title as gig_title,
    p.display_name as talent_display_name,
    cp.company_name as client_company_name
  FROM applications a
  JOIN gigs g ON g.id = a.gig_id
  JOIN profiles p ON p.id = a.talent_id
  LEFT JOIN client_profiles cp ON cp.user_id = g.client_id
  ```

#### **`admin_bookings_dashboard`** (USED ✅)
- **Purpose:** Pre-joins bookings + gigs + profiles data
- **Used in:** Admin booking views
- **Similar structure to talent dashboard view**

#### **`admin_dashboard_cache`** (NOT USED ❌)
- **Status:** Appears in types but **NOT created in any migration**
- **Why:** Likely an artifact or planned feature that wasn't implemented
- **Action:** Can be safely ignored or removed from types

### How Views Work

When you query a view, PostgreSQL runs the underlying JOIN query in real-time:

```typescript
// You write:
const { data } = await supabase
  .from('admin_talent_dashboard')
  .select('*');

// PostgreSQL executes:
// SELECT ... FROM applications 
// JOIN gigs ... 
// JOIN profiles ...
```

**Benefits:**
- ✅ Simplifies complex queries
- ✅ Consistent data structure
- ✅ Type-safe in TypeScript
- ✅ Easier to maintain

**Not a Cache:**
- ❌ Data is NOT stored/cached
- ❌ No performance improvement from caching
- ❌ Real-time data (always fresh)

---

## 🔑 Creating Your First Admin Account

### Method 1: Update Existing User (EASIEST)

If you already have an account on the platform, upgrade it to admin:

**Step 1:** Go to your Supabase Dashboard  
**Step 2:** Navigate to **SQL Editor**  
**Step 3:** Run this query (replace email with yours):

```sql
-- Find your user ID
SELECT id, email, role 
FROM auth.users 
WHERE email = 'your-email@example.com';

-- Update your role to admin
UPDATE public.profiles 
SET role = 'admin', 
    updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@example.com'
);

-- Verify the change
SELECT p.id, u.email, p.role, p.display_name
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'your-email@example.com';
```

**Step 4:** Log out and log back in  
**Step 5:** You should now see admin options!

---

### Method 2: Create New Admin User via Supabase Dashboard

**Step 1:** Go to Supabase Dashboard  
**Step 2:** Navigate to **Authentication > Users**  
**Step 3:** Click **"Add User"** or **"Invite User"**  
**Step 4:** Fill in the form:
- Email: `admin@yourcompany.com`
- Password: `your-secure-password`
- **✅ Check "Auto-confirm user"** (skips email verification)

**Step 5:** After creation, go to **SQL Editor** and run:

```sql
UPDATE public.profiles 
SET role = 'admin', 
    display_name = 'Admin User',
    email_verified = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@yourcompany.com');
```

**Step 6:** Log in at `/login` with the new credentials

---

### Method 3: Use Admin UI (Requires Existing Admin)

If you already have one admin account:

**Step 1:** Log in as admin  
**Step 2:** Navigate to `/admin/users/create`  
**Step 3:** Fill in the form:
- Email
- Password  
- First Name
- Last Name
- **Role: Select "Admin"**

**Step 4:** Click "Create User"

---

### Method 4: Use Helper Script

We've created a PowerShell script to guide you:

```powershell
# From project root:
.\scripts\create-first-admin.ps1
```

The script will:
- Prompt for admin details
- Provide step-by-step instructions
- Show SQL commands to run

---

## 🎛️ Admin Dashboard Features

Once you're logged in as admin, you have access to:

### **Main Dashboard** (`/admin/dashboard`)
- Overview statistics (active gigs, applications, revenue)
- Recent gigs table with search/filter
- Quick actions (create gig, view applications)
- Stats cards showing:
  - Active Gigs count
  - Approved Applications count
  - Pending Applications count
  - Total Revenue (placeholder)

### **Gigs Management** (`/admin/gigs/create`)
- Create new gigs
- Edit existing gigs
- View all gigs (including drafts)
- Delete gigs

### **Applications** (`/admin/applications`)
- View all applications across all gigs
- Filter by status
- Review talent applications
- Accept/reject applications

### **Talent Dashboard View** (`/admin/talent-dashboard`)
- See platform from talent perspective
- View all talent profiles
- Browse applications as if you were talent
- Quality assurance tool

### **User Management** (`/admin/users/create`)
- Create new users (talent, client, or admin)
- Set roles directly
- Skip email verification
- Bulk user creation (future feature)

### **Diagnostic Tools** (`/admin/diagnostic`)
- System health checks
- Database connection tests
- Performance metrics
- Error logs

---

## 🔐 Admin Permissions

### What Admins Can Access

**Database Tables:**
- ✅ Full read access to all tables
- ✅ Can create gigs for any client
- ✅ Can view all applications
- ✅ Can view all user profiles
- ✅ Can create users with service role (via API)

**Routes:**
- ✅ `/admin/*` - All admin routes
- ✅ `/talent/*` - Can view talent routes
- ✅ `/client/*` - Can view client routes
- ✅ All public routes

**RLS Policies:**
Admin role is checked in the middleware, not RLS policies. This means:
- Admins bypass most RLS restrictions through the app layer
- Database queries still use RLS, but middleware allows access
- Service role key used for admin-specific operations

### What Admins Cannot Do (By Design)

- ❌ Cannot delete users from UI (must use SQL)
- ❌ Cannot modify Supabase auth directly from UI
- ❌ Cannot access service role key from client
- ❌ Cannot bypass middleware protection

---

## 🔧 Troubleshooting

### Issue: "You don't have permission to access this page"

**Cause:** Your account doesn't have admin role  
**Solution:**
1. Check your role in database:
   ```sql
   SELECT email, role FROM profiles 
   JOIN auth.users ON profiles.id = auth.users.id 
   WHERE email = 'your-email@example.com';
   ```
2. If role is not 'admin', update it:
   ```sql
   UPDATE profiles SET role = 'admin' 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
   ```
3. Log out and log back in

---

### Issue: "Admin dashboard is empty"

**Cause:** No data in database  
**Solution:** This is normal for a fresh installation. Create some gigs and applications to see data.

---

### Issue: "Cannot create users from admin panel"

**Cause:** API endpoint or Edge function not deployed  
**Solution:**
1. Check if endpoint exists: `/app/api/admin/create-user/route.ts`
2. Ensure Supabase Edge function is deployed
3. Check browser console for errors
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment

---

### Issue: "Role changes not taking effect"

**Cause:** Cached session  
**Solution:**
1. Log out completely
2. Clear browser cookies for the site
3. Log back in
4. Or force refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

---

## 🎯 Quick Reference Commands

### Check User Role
```sql
SELECT u.email, p.role, p.display_name
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'email@example.com';
```

### Make User Admin
```sql
UPDATE public.profiles 
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'email@example.com');
```

### List All Admins
```sql
SELECT u.email, p.display_name, p.created_at
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;
```

### Remove Admin Role (Demote to Talent)
```sql
UPDATE public.profiles 
SET role = 'talent'
WHERE id = (SELECT id FROM auth.users WHERE email = 'email@example.com');
```

---

## 📚 Additional Resources

- **Database Schema:** `database_schema_audit.md`
- **Auth Strategy:** `docs/AUTH_STRATEGY.md`
- **Middleware Logic:** `middleware.ts`
- **Admin Routes:** `app/admin/`
- **User Creation API:** `app/api/admin/create-user/route.ts`

---

## ✅ Checklist: Setting Up Your First Admin

- [ ] Access Supabase Dashboard
- [ ] Create user or identify existing user
- [ ] Run SQL to set role to 'admin'
- [ ] Verify role was updated
- [ ] Log out and log back in
- [ ] Navigate to `/admin/dashboard`
- [ ] Confirm you can see admin features
- [ ] Test creating a gig
- [ ] Test creating another user

---

**Need Help?** Check the troubleshooting section or review the authentication documentation in `docs/AUTH_STRATEGY.md`.






