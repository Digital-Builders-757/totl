# TOTL Agency – Complete Project Context & AI Assistant Rules

**Last Updated:** July 23, 2025  
**Version:** 2.0  
**Status:** Production Ready

## Table of Contents
- [Project Overview](#-project-overview)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Authentication & Authorization](#-authentication--authorization)
- [Development Guidelines](#-development-guidelines)
- [Production Status](#-production-status)
- [Quick Reference](#-quick-reference)
- [Troubleshooting](#-troubleshooting)

## 🎯 Project Overview

**TOTL Agency** is a comprehensive talent booking platform connecting models, actors, and performers with casting directors, agencies, and brands. The platform facilitates gig postings, applications, bookings, and portfolio management with role-based access control.

**Key Features:**
- **Role-based access** (talent/client/admin)
- **Gig posting and management**
- **Application system**
- **Portfolio management**
- **Real-time notifications**
- **Secure authentication**

## 🛠️ Tech Stack

- **Frontend:** Next.js 15.2.4 with App Router, TypeScript 5, React Server Components
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI:** TailwindCSS + shadcn/ui components
- **Email:** Resend API for custom transactional emails
- **Deployment:** Vercel (frontend) + Supabase Cloud (backend)
- **Database:** PostgreSQL with Row-Level Security (RLS)

## 🗃️ Database Schema

### **Core Tables**

#### **profiles** (Main User Accounts)
```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, 
  role          user_role NOT NULL DEFAULT 'talent', 
  display_name  TEXT, 
  avatar_url    TEXT, 
  email_verified BOOLEAN DEFAULT FALSE, 
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **talent_profiles**
```sql
CREATE TABLE public.talent_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name   TEXT NOT NULL DEFAULT '',
  last_name    TEXT NOT NULL DEFAULT '',
  phone        TEXT,
  age          INTEGER,
  location     TEXT,
  experience   TEXT,
  portfolio_url TEXT,
  height       TEXT,
  measurements TEXT,
  hair_color   TEXT,
  eye_color    TEXT,
  shoe_size    TEXT,
  languages    TEXT[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **client_profiles**
```sql
CREATE TABLE public.client_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  industry     TEXT,
  website      TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  company_size TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **gigs** (Job Postings)
```sql
CREATE TABLE public.gigs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT NOT NULL,
  location             TEXT NOT NULL,
  compensation         TEXT NOT NULL,
  duration             TEXT NOT NULL,
  date                 TEXT NOT NULL,
  application_deadline TIMESTAMPTZ,
  requirements         TEXT[],
  status               TEXT NOT NULL CHECK (status IN 
                        ('draft', 'active', 'closed', 'featured', 'urgent')), 
  image_url            TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **applications**
```sql
CREATE TABLE public.applications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id     UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  talent_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN 
              ('new', 'under_review', 'shortlisted', 'rejected', 'accepted')),
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gig_id, talent_id)
);
```

### **Custom Types (Enums)**
```sql
-- user_role
CREATE TYPE public.user_role AS ENUM ('talent', 'client', 'admin');

-- application_status  
CREATE TYPE public.application_status AS ENUM ('new', 'under_review', 'shortlisted', 'rejected', 'accepted');

-- booking_status
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- gig_status
CREATE TYPE public.gig_status AS ENUM ('draft', 'active', 'closed', 'completed');
```

### **Critical NOT NULL Constraints**
The following columns are protected by the `handle_new_user()` trigger:

| Column | Table | Protection | Default |
|--------|-------|------------|---------|
| `role` | profiles | `COALESCE(metadata->>'role', 'talent')` | `'talent'` |
| `first_name` | talent_profiles | `COALESCE(metadata->>'first_name', '')` | `''` |
| `last_name` | talent_profiles | `COALESCE(metadata->>'last_name', '')` | `''` |
| `company_name` | client_profiles | `COALESCE(metadata->>'company_name', display_name)` | `display_name` |

**⚠️ CRITICAL:** Metadata keys must use **lowercase with underscores**:
```typescript
// ✅ CORRECT
{ first_name: "John", last_name: "Doe", role: "talent" }

// ❌ WRONG  
{ firstName: "John", lastName: "Doe", Role: "talent" }
```

## 🔐 Authentication & Authorization

### **User Signup Flow**

#### **1. Frontend Signup**
```typescript
// Talent signup
const { error } = await signUp(data.email, data.password, {
  data: {
    first_name: data.firstName,    // lowercase with underscore
    last_name: data.lastName,      // lowercase with underscore
    role: "talent",                // lowercase
  },
  emailRedirectTo: `${window.location.origin}/auth/callback`,
});
```

#### **2. Database Trigger**
The `handle_new_user()` trigger automatically:
- Creates `profiles` record
- Creates role-specific profile (`talent_profiles` or `client_profiles`)
- Handles NULL values with `COALESCE`
- Sets proper defaults

#### **3. Email Verification**
- User receives verification email
- Clicks link → `/auth/callback`
- Profile `email_verified` updated to `true`
- Redirected to role-specific dashboard

### **Role-Based Routing**
- **Talent:** `/talent/dashboard`
- **Client:** `/client/dashboard`  
- **Admin:** `/admin/dashboard`

### **Row-Level Security (RLS)**
All tables have RLS enabled with policies:

#### **Gigs Table**
```sql
-- Public can view active gigs only
CREATE POLICY "Public can view active gigs only"
  ON public.gigs FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

-- Clients can manage their gigs
CREATE POLICY "Clients can create gigs"
  ON public.gigs FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());
```

#### **Applications Table**
```sql
-- Talent can see their applications, clients can see for their gigs
CREATE POLICY "Applications access policy"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    talent_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM gigs 
      WHERE gigs.id = applications.gig_id 
      AND gigs.client_id = auth.uid()
    )
  );
```

## 💻 Development Guidelines

### **Supabase Client Usage**

#### **Client-Side**
```typescript
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";

const supabase = createClientComponentClient<Database>();

// Always use specific field selection
const { data, error } = await supabase
  .from('gigs')
  .select('id, title, description, location, compensation')
  .eq('status', 'active');
```

#### **Server-Side**
```typescript
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabase = createServerComponentClient<Database>({ cookies });

// Force dynamic rendering for auth-dependent pages
export const dynamic = "force-dynamic";
```

### **Component Architecture**

#### **Server Components (Data Fetching)**
```typescript
// app/gigs/page.tsx
export default async function GigsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: gigs } = await supabase
    .from('gigs')
    .select('*')
    .eq('status', 'active');
  
  return <GigsClient gigs={gigs || []} />;
}
```

#### **Client Components (Presentational)**
```typescript
// components/gigs-client.tsx
"use client";

export function GigsClient({ gigs }: { gigs: Gig[] }) {
  if (gigs.length === 0) {
    return <EmptyState message="No gigs available" />;
  }
  
  return (
    <div className="grid gap-4">
      {gigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
    </div>
  );
}
```

### **Error Handling**
```typescript
// Always wrap Supabase calls in try-catch
try {
  const { data, error } = await supabase.from('gigs').select('*');
  if (error) throw error;
  return data || [];
} catch (error) {
  console.error('Error fetching gigs:', error);
  return [];
}
```

### **Type Safety**
- Use generated types from `types/database.ts`
- Never use `any` types
- Always type component props
- Use Zod for form validation

## 🚀 Production Status

### **✅ Production Ready Features**
- ✅ Clean database (no mock data)
- ✅ Secure RLS policies
- ✅ Proper empty states
- ✅ Real data fetching
- ✅ Email verification flow
- ✅ Role-based routing
- ✅ TypeScript compilation
- ✅ Build process working

### **Current Database State**
| Table | Records | Status |
|-------|---------|--------|
| `profiles` | 2 | ✅ Clean |
| `client_profiles` | 1 | ✅ Clean |
| `talent_profiles` | 1 | ✅ Clean |
| `gigs` | 0 | ✅ Ready for real data |
| `applications` | 0 | ✅ Ready for real data |

### **Test Account**
- **Email:** `testclient@example.com`
- **Password:** `TestPassword123!`
- **Purpose:** Demo client functionality

## 📋 Quick Reference

### **Common Commands**
```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint

# Database
npx supabase gen types typescript --project-id "<ID>" > types/database.ts
npx supabase db reset    # Reset local database
npx supabase db push     # Push migrations to remote
```

### **Key File Locations**
- **Database Schema:** `database_schema_audit.md` (single source of truth)
- **Supabase Config:** `supabase/config.toml`
- **Migrations:** `supabase/migrations/`
- **Types:** `types/database.ts`
- **Auth Provider:** `components/auth-provider.tsx`

### **Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
RESEND_API_KEY=your_resend_key
```

## 🔧 Troubleshooting

### **Common Issues**

#### **"type user_role does not exist"**
```sql
-- Recreate the enum if missing
CREATE TYPE public.user_role AS ENUM ('talent', 'client', 'admin');
```

#### **Build Error: Supabase not configured**
```typescript
// Add environment variable check
const isSupabaseConfigured = typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = isSupabaseConfigured ? createClientComponentClient() : null;
```

#### **RLS Policy Issues**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### **Debug Queries**
```sql
-- Check user profiles
SELECT p.id, p.role, p.display_name, 
       CASE WHEN tp.id IS NOT NULL THEN 'talent' 
            WHEN cp.id IS NOT NULL THEN 'client' 
            ELSE 'no_profile' END as profile_type
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id;

-- Check gigs with applications
SELECT g.title, g.status, COUNT(a.id) as application_count
FROM gigs g
LEFT JOIN applications a ON g.id = a.gig_id
GROUP BY g.id, g.title, g.status;
```

---

**For complete database schema details, see `database_schema_audit.md`**  
**For development setup, see `README.md`** 