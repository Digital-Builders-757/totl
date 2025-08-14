# 🤖 ChatGPT Instructions for TOTL Agency Project

**Copy and paste these instructions when starting a new ChatGPT conversation about the TOTL Agency project.**

---

## 🎯 **PROJECT CONTEXT**

You are helping with **TOTL Agency**, a talent booking platform built with Next.js 15.2.4 + Supabase + TypeScript. This is a production-ready application with role-based access (talent/client/admin), comprehensive security, and automated type safety.

**Key Architecture:**
- Next.js App Router with React Server Components
- Supabase (PostgreSQL + Auth + Storage + Real-time)
- TypeScript 5 with strict type safety
- TailwindCSS + shadcn/ui components
- Row-level security (RLS) on all database tables
- Automated type generation from database schema

---

## 📋 **CRITICAL RULES TO FOLLOW**

### **1. Database & Types**
- **NEVER manually edit** `types/database.ts` - it's auto-generated
- **Always reference** `database_schema_audit.md` for schema truth
- **Use generated types** from `types/database.ts` for all database operations
- **No `any` types** - use proper TypeScript types only

### **2. Supabase Usage**
- **Use centralized clients:** `lib/supabase-client.ts` (client-side) or `lib/supabase-admin-client.ts` (server-side)
- **NEVER use `select('*')`** - always specify explicit columns
- **Service role key** only in server-side code (API routes, server actions)
- **Assume RLS is active** - all queries must work under security policies

### **3. Component Architecture**
- **Server components** for data fetching
- **Client components** for presentation only
- **No database calls** in React components
- **Use Server Actions** for mutations

### **4. Development Environment**
- **PowerShell environment** - use Windows-compatible commands
- **PowerShell scripts** for verification and automation
- **npm scripts** for common tasks

---

## 🛠️ **COMMON TASKS & PATTERNS**

### **Database Queries**
```typescript
// ✅ CORRECT - Use explicit columns
const { data } = await supabase
  .from('gigs')
  .select('id, title, description, location, status, created_at, client_id')
  .eq('status', 'published');

// ❌ WRONG - Don't use select('*')
const { data } = await supabase
  .from('gigs')
  .select('*')
  .eq('status', 'published');
```

### **Type Safety**
```typescript
// ✅ CORRECT - Use generated types
import type { Database } from '@/types/database';
type Gig = Database['public']['Tables']['gigs']['Row'];

// ❌ WRONG - Don't use any
const gig: any = await getGig();
```

### **Server Actions**
```typescript
// ✅ CORRECT - Server action pattern
'use server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin-client';

export async function createGig(formData: FormData) {
  const supabase = createSupabaseAdminClient();
  // Implementation with proper error handling
}
```

### **Component Structure**
```typescript
// ✅ CORRECT - Server component for data
export default async function GigsPage() {
  const gigs = await getGigs(); // Server-side data fetching
  return <GigsList gigs={gigs} />; // Pass to client component
}

// ✅ CORRECT - Client component for UI
'use client'
export function GigsList({ gigs }: { gigs: Gig[] }) {
  // Presentation logic only
}
```

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **When Making Database Changes**
1. Update `database_schema_audit.md` first
2. Create migration: `supabase migration new <description>`
3. Apply: `supabase db push`
4. Regenerate types: `npm run types:regen`
5. Verify: `npm run schema:verify`

### **Available Scripts**
```bash
npm run dev              # Development server
npm run types:regen      # Regenerate types
npm run types:check      # Verify types are fresh
npm run schema:verify    # Comprehensive verification
npm run verify-all       # All checks
npm run db:reset         # Reset local database
npm run db:push          # Push migrations
```

---

## 📊 **DATABASE SCHEMA OVERVIEW**

### **Core Tables**
- **profiles** - Main user accounts (linked to Supabase Auth)
- **talent_profiles** - Talent-specific data
- **client_profiles** - Client-specific data
- **gigs** - Job postings
- **applications** - Talent applications for gigs
- **bookings** - Confirmed bookings
- **portfolio_items** - Talent portfolio
- **gig_requirements** - Gig requirements

### **Key Enums**
- **user_role**: 'talent' | 'client' | 'admin'
- **gig_status**: 'draft' | 'published' | 'closed' | 'completed'
- **application_status**: 'new' | 'under_review' | 'shortlisted' | 'rejected' | 'accepted'
- **booking_status**: 'pending' | 'confirmed' | 'completed' | 'cancelled'

---

## 🔒 **SECURITY MODEL**

### **Row-Level Security (RLS)**
All tables have RLS enabled:
- **profiles**: Users can SELECT/UPDATE own row, everyone can SELECT
- **talent_profiles**: Talent can INSERT/UPDATE own, everyone can SELECT
- **client_profiles**: Clients can INSERT/UPDATE own, everyone can SELECT
- **gigs**: Only clients can INSERT, clients can UPDATE own, everyone can SELECT
- **applications**: Talent can INSERT/view own, clients can SELECT/UPDATE for their gigs
- **bookings**: Clients INSERT/UPDATE own, participants can SELECT
- **portfolio_items**: Talent INSERT/UPDATE/DELETE own, everyone can SELECT

### **Authentication Flow**
1. User signs up → Supabase Auth creates user
2. `handle_new_user()` trigger creates profile with default role
3. User completes role-specific profile
4. Email verification required
5. Role-based routing to dashboard

---

## 🚀 **ROUTING STRUCTURE**

### **Public Routes**
- `/` - Landing page
- `/about` - About page
- `/gigs` - Public gig listings
- `/talent` - Public talent listings

### **Protected Routes**
- `/talent/*` - Talent dashboard (talent role only)
- `/client/*` - Client dashboard (client role only)
- `/admin/*` - Admin dashboard (admin role only)

### **Auth Routes**
- `/login` - Login page
- `/talent/signup` - Talent signup
- `/client/signup` - Client signup
- `/reset-password` - Password reset
- `/choose-role` - Role selection

---

## 📱 **KEY FEATURES**

### **For Talent**
- Profile creation and management
- Browse available gigs
- Apply to gigs with messages
- Portfolio management
- Track application status

### **For Clients**
- Company profile setup
- Post gig opportunities
- Review applications
- Manage bookings
- Track gig status

### **For Admins**
- User management
- Gig moderation
- Application oversight
- System diagnostics

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues & Solutions**

**Type Errors**
```bash
npm run types:regen  # Regenerate types
npm run types:check  # Verify types are fresh
```

**Schema Drift**
```bash
npm run schema:verify  # Check for inconsistencies
```

**RLS Issues**
- Check user permissions
- Verify user role in profiles table
- Ensure queries work under RLS policies

**Auth Problems**
- Verify email verification status
- Check user exists in both auth.users and profiles tables
- Ensure proper role assignment

---

## 📞 **HOW TO HELP EFFECTIVELY**

### **When Asked for Code**
1. **Always use generated types** from `types/database.ts`
2. **Follow RLS patterns** - no service role in client code
3. **Use explicit column selection** - no `select('*')`
4. **Separate data fetching** (server) from presentation (client)
5. **Include proper error handling**

### **When Asked for Database Changes**
1. **Reference `database_schema_audit.md`** for current schema
2. **Create migration files** for schema changes
3. **Update the audit file** to reflect changes
4. **Regenerate types** after changes
5. **Verify with schema check**

### **When Asked for New Features**
1. **Consider RLS implications** for all data access
2. **Use existing patterns** and components
3. **Follow type safety** requirements
4. **Implement proper error handling**
5. **Consider performance** and security

### **When Debugging Issues**
1. **Check type safety** first
2. **Verify RLS policies** are working
3. **Ensure proper authentication** flow
4. **Check for schema drift**
5. **Use available verification scripts**

---

## 🎯 **SUCCESS METRICS**

Your assistance should result in:
- ✅ **Type-safe code** with no `any` types
- ✅ **RLS-compatible queries** that work under security policies
- ✅ **Proper component separation** (server vs client)
- ✅ **Consistent patterns** following project standards
- ✅ **Secure implementations** with proper error handling
- ✅ **Maintainable code** that follows established conventions

---

## 📚 **KEY FILES TO REFERENCE**

- `database_schema_audit.md` - Database schema truth
- `types/database.ts` - Generated types (don't edit)
- `lib/supabase-client.ts` - Client configuration
- `lib/supabase-admin-client.ts` - Server admin client
- `middleware.ts` - Route protection
- `package.json` - Available scripts
- `TOTL_PROJECT_BREAKDOWN.md` - Complete project overview

---

**Remember: This is a production-ready application with strict security and type safety requirements. Always prioritize security, type safety, and following established patterns over quick solutions.**
