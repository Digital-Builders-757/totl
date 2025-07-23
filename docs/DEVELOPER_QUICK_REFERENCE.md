# TOTL Agency - Developer Quick Reference

**Last Updated:** July 23, 2025  
**Status:** Production Ready

## Table of Contents
- [Quick Start](#-quick-start)
- [Critical Requirements](#-critical-requirements)
- [Common Patterns](#-common-patterns)
- [Troubleshooting](#-troubleshooting)
- [Testing Checklist](#-testing-checklist)

## 🚀 Quick Start

### Essential Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Database
npx supabase gen types typescript --project-id "<ID>" > types/database.ts
npx supabase db reset    # Reset local database
npx supabase db push     # Push migrations to remote
```

### Environment Setup
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional (for emails)
RESEND_API_KEY=your_resend_key
```

## ⚠️ Critical Requirements

### **1. Metadata Key Naming**
**CRITICAL:** All user metadata keys must use **lowercase with underscores**:

```typescript
// ✅ CORRECT - Will work with trigger
{
  first_name: "John",      // lowercase with underscore
  last_name: "Doe",        // lowercase with underscore
  role: "talent",          // lowercase
  company_name: "Acme Co"  // lowercase with underscore
}

// ❌ WRONG - Will cause NULL values in database
{
  firstName: "John",       // camelCase - trigger won't find this
  lastName: "Doe",         // camelCase - trigger won't find this
  Role: "talent",          // PascalCase - trigger won't find this
  companyName: "Acme Co"   // camelCase - trigger won't find this
}
```

### **2. Database Schema**
- **Single Source of Truth:** `database_schema_audit.md`
- **Generated Types:** `types/database.ts`
- **Never use `any` types** - always use generated types

### **3. RLS Policies**
- All tables have RLS enabled
- Policies are production-ready and secure
- Test with real user accounts, not service keys

## 💻 Common Patterns

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

if (error) {
  console.error('Error fetching gigs:', error);
  return [];
}

return data || [];
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

#### **Server Component (Data Fetching)**
```typescript
// app/gigs/page.tsx
export default async function GigsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <div>Configuration error</div>;
  }
  
  const { data: gigs, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('status', 'active');
  
  if (error) {
    console.error('Error fetching gigs:', error);
    return <div>Error loading gigs</div>;
  }
  
  return <GigsClient gigs={gigs || []} />;
}
```

#### **Client Component (Presentational)**
```typescript
// components/gigs-client.tsx
"use client";

import { EmptyState } from "@/components/ui/empty-state";

interface GigsClientProps {
  gigs: Gig[];
}

export function GigsClient({ gigs }: GigsClientProps) {
  if (gigs.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No gigs available"
        description="Check back later for new opportunities"
      />
    );
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

### **Authentication Patterns**
```typescript
// Check if user is authenticated
const { user } = useAuth();

if (!user) {
  return <div>Please log in</div>;
}

// Check user role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'client') {
  redirect('/dashboard');
}
```

### **Form Validation with Zod**
```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const gigSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  compensation: z.string().min(1, "Compensation is required"),
});

type GigFormValues = z.infer<typeof gigSchema>;

export function GigForm() {
  const form = useForm<GigFormValues>({
    resolver: zodResolver(gigSchema),
  });
  
  // ... rest of component
}
```

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **1. "type user_role does not exist"**
```sql
-- Recreate the enum if missing
CREATE TYPE public.user_role AS ENUM ('talent', 'client', 'admin');
```

#### **2. Build Error: Supabase not configured**
```typescript
// Add environment variable check
const isSupabaseConfigured = typeof window !== 'undefined' && 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = isSupabaseConfigured ? createClientComponentClient() : null;
```

#### **3. RLS Policy Issues**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

#### **4. NULL Value Constraint Violations**
```sql
-- Check trigger function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test trigger function
SELECT test_trigger_function_exists();
```

### **Debug Queries**

#### **Check User Profiles**
```sql
SELECT p.id, p.role, p.display_name, 
       CASE WHEN tp.id IS NOT NULL THEN 'talent' 
            WHEN cp.id IS NOT NULL THEN 'client' 
            ELSE 'no_profile' END as profile_type
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id
ORDER BY p.created_at;
```

#### **Check Gigs with Applications**
```sql
SELECT g.title, g.status, COUNT(a.id) as application_count
FROM gigs g
LEFT JOIN applications a ON g.id = a.gig_id
GROUP BY g.id, g.title, g.status
ORDER BY g.created_at DESC;
```

#### **Check RLS Policies**
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

### **Production Health Checks**

#### **Database Health**
```sql
-- Check table record counts
SELECT 
  'profiles' as table_name,
  COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
  'talent_profiles' as table_name,
  COUNT(*) as record_count
FROM talent_profiles
UNION ALL
SELECT 
  'client_profiles' as table_name,
  COUNT(*) as record_count
FROM client_profiles
UNION ALL
SELECT 
  'gigs' as table_name,
  COUNT(*) as record_count
FROM gigs
UNION ALL
SELECT 
  'applications' as table_name,
  COUNT(*) as record_count
FROM applications
ORDER BY table_name;
```

#### **RLS Policy Health**
```sql
-- Check all tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

## 🧪 Testing Checklist

### **Pre-Launch Testing**
- [ ] **User Registration** - Test talent and client signup
- [ ] **Email Verification** - Verify email flow works
- [ ] **Profile Creation** - Check profiles are created correctly
- [ ] **Role-based Routing** - Test dashboard access
- [ ] **Gig Creation** - Test client can post gigs
- [ ] **Gig Visibility** - Test talent can see active gigs
- [ ] **Application Flow** - Test talent can apply to gigs
- [ ] **Application Review** - Test client can review applications
- [ ] **RLS Security** - Test unauthorized access is blocked

### **Production Testing**
- [ ] **Environment Variables** - Verify all are set correctly
- [ ] **Database Connection** - Test Supabase connectivity
- [ ] **Build Process** - Verify production build works
- [ ] **Performance** - Check page load times
- [ ] **Error Handling** - Test error states
- [ ] **Empty States** - Verify when no data exists

### **Test Accounts**
- **Test Client:** `testclient@example.com` / `TestPassword123!`
- **Purpose:** Demo client functionality

---

**For complete project context, see `TOTL_PROJECT_CONTEXT_PROMPT.md`**  
**For database schema details, see `database_schema_audit.md`** 