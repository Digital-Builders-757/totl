# 🤖 TOTL Agency - AI Agent Quick Start Guide

> **READ THIS FIRST** - This document provides everything an AI agent needs to get caught up quickly before starting work on TOTL Agency.

**Last Updated:** December 4, 2025  
**Status:** Production Ready  
**Target Audience:** AI Agents (Cursor, GitHub Copilot, etc.)

---

## ⚡ 30-Second Quick Start

**Before writing ANY code, you MUST:**

1. ✅ **Read** `TOTL_PROJECT_CONTEXT_PROMPT.md` (complete project rules)
2. ✅ **Check** `database_schema_audit.md` (single source of truth for schema)
3. ✅ **Review** `docs/DOCUMENTATION_INDEX.md` (find relevant docs for your task)
4. ✅ **Verify** your approach matches documented patterns
5. ✅ **Run** pre-push checks before committing

**Critical Rule:** If you can't check every box above, **STOP** and gather context first.

---

## 📋 Project Overview

**TOTL Agency** is a talent booking platform connecting models/actors with casting directors/brands.

### **Core Purpose**
- **Talent** (models/actors) browse gigs, apply, and manage portfolios
- **Career Builders** (clients/brands) post gigs, review applications, and book talent
- **Admins** manage users, moderate content, and oversee the platform

### **Tech Stack**
- **Frontend:** Next.js 15.5.4 + App Router + TypeScript 5 (strict)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI:** TailwindCSS + shadcn/ui components
- **Email:** Resend API
- **Deployment:** Vercel

### **Key Database Tables**
- `profiles` - Main user accounts (roles: talent/client/admin)
- `talent_profiles` - Talent-specific data (physical attributes, experience)
- `client_profiles` - Career Builder company info
- `gigs` - Job postings
- `applications` - Talent applications to gigs
- `bookings` - Confirmed engagements
- `portfolio_items` - Talent portfolio images
- `content_flags` - Moderation flags

---

## 🚨 Critical Rules (Non-Negotiable)

### **1. Database Schema Management**
- **`database_schema_audit.md`** is the **SINGLE SOURCE OF TRUTH**
- **ALWAYS** update the audit file **BEFORE** making schema changes
- All schema changes **MUST** go through migrations (`supabase/migrations/`)
- **NEVER** manually edit `types/database.ts` - it's auto-generated
- After migrations: regenerate types with `npm run types:regen`

### **2. Type Safety**
- **NO `any` types** - enforced by ESLint
- **ALWAYS** use generated types from `@/types/supabase`
- **NEVER** create custom interfaces for DB entities
- Import pattern: `import type { Database } from '@/types/supabase'`

### **3. Import Paths**
- ✅ **CORRECT:** `@/lib/supabase-admin-client`
- ✅ **CORRECT:** `@/types/supabase`
- ❌ **WRONG:** `@/lib/supabase/supabase-admin-client` (extra `/supabase/`)
- ❌ **WRONG:** `@/types/database` (should be `/types/supabase`)

### **4. Authentication & Security**
- **BEFORE auth changes:** Read `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md`
- **RLS is ALWAYS active** - never bypass security policies
- Use `@/lib/supabase-client` for user-level access
- Use `@/lib/supabase-admin-client` for server-only admin operations
- **NEVER** expose service keys in client code

### **5. Component Architecture**
- **Server Components** (default) - fetch data, pass props
- **Client Components** (`"use client"`) - presentational only, no data fetching
- **Server Actions** (`"use server"`) - mutations and form handling
- **API Routes** (`app/api/**/route.ts`) - external integrations

### **6. Query Patterns**
- Use `.maybeSingle()` when a row might not exist (never check `PGRST116`)
- Use explicit column selection (avoid `select('*')` in app code)
- Handle errors properly - always check `error` before using `data`
- Use functional state updates: `setUsers(prevUsers => ...)`

---

## 📚 Essential Documentation Map

### **Must-Read Before Starting Work**

| Task Type | Required Reading |
|-----------|----------------|
| **Any code change** | `TOTL_PROJECT_CONTEXT_PROMPT.md` |
| **Database changes** | `database_schema_audit.md` + `docs/SQL_RLS_POLICY_CREATION_GUIDE.md` |
| **Auth changes** | `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md` + `docs/AUTH_STRATEGY.md` |
| **Security changes** | `docs/SECURITY_CONFIGURATION.md` |
| **Stripe/subscriptions** | `docs/STRIPE_SUBSCRIPTION_PRD.md` + `docs/STRIPE_TROUBLESHOOTING.md` |
| **New features** | `docs/DOCUMENTATION_INDEX.md` → find relevant feature docs |
| **Bug fixes** | `docs/TROUBLESHOOTING_GUIDE.md` + `docs/COMMON_ERRORS_QUICK_REFERENCE.md` |
| **Admin features** | `docs/ADMIN_ACCOUNT_GUIDE.md` |

### **Quick Reference Documents**

- **`docs/COMMON_ERRORS_QUICK_REFERENCE.md`** - Copy/paste fixes for common errors
- **`docs/PRE_PUSH_CHECKLIST.md`** - Mandatory checks before pushing
- **`docs/DEVELOPER_QUICK_REFERENCE.md`** - Database query patterns
- **`docs/TYPESCRIPT_COMMON_ERRORS.md`** - TypeScript error solutions

---

## 🔧 Common Patterns & Code Examples

### **Database Query (Server Component)**
```typescript
import { createSupabaseServer } from "@/lib/supabase/supabase-server";
import type { Database } from "@/types/supabase";

const supabase = await createSupabaseServer();
const { data: profile, error } = await supabase
  .from("profiles")
  .select("id, role, display_name")
  .eq("id", user.id)
  .maybeSingle();

if (error) {
  console.error("Error:", error);
  return;
}
// profile is typed as Profile | null
```

### **Database Query (Client Component)**
```typescript
"use client";
import { useAuth } from "@/components/auth/auth-provider";
// Use profile from auth context - don't fetch separately
const { profile } = useAuth();
```

### **Server Action Pattern**
```typescript
"use server";
import { createSupabaseServer } from "@/lib/supabase/supabase-server";

export async function updateProfile(data: ProfileUpdate) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Unauthorized" };
  }
  
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);
    
  if (error) {
    return { error: error.message };
  }
  
  return { success: true };
}
```

### **Type Definitions**
```typescript
import type { Database } from "@/types/supabase";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Gig = Database['public']['Tables']['gigs']['Row'];
type UserRole = Database['public']['Enums']['user_role'];
type GigStatus = Database['public']['Enums']['gig_status'];
```

---

## ✅ Pre-Work Checklist

**Before writing ANY code:**

- [ ] Read `TOTL_PROJECT_CONTEXT_PROMPT.md` completely
- [ ] Check `docs/DOCUMENTATION_INDEX.md` for relevant docs
- [ ] Read all applicable documentation for your task
- [ ] Review `database_schema_audit.md` if touching database
- [ ] Verify your approach matches documented patterns
- [ ] Check `docs/COMMON_ERRORS_QUICK_REFERENCE.md` for pitfalls
- [ ] Understand the component architecture (Server vs Client)

---

## 🚨 Pre-Push Checklist

**Before pushing ANY code:**

```bash
# 1. Schema & Types Verification
npm run schema:verify:comprehensive
npm run types:check
npm run build

# 2. Linting
npm run lint

# 3. Verify import paths are correct
# Check for: @/lib/supabase/supabase-admin-client (WRONG)
# Should be: @/lib/supabase-admin-client (CORRECT)
```

**If ANY step fails, DO NOT PUSH until it's fixed!**

---

## 🎯 Current Project Status

### **MVP Status:** ✅ Complete with Subscription System

**Latest Features:**
- ✅ Stripe subscription system (monthly/annual plans)
- ✅ Client application workflow with admin approval
- ✅ Moderation toolkit (content flags, account suspension)
- ✅ Email automation (Resend templates)
- ✅ Admin dashboard (user management, client applications)
- ✅ Portfolio gallery with hover effects
- ✅ Command palette (⌘K navigation)

**Recent Improvements:**
- ✅ Sign-out security enhancements (cookie cleanup)
- ✅ Client terminology update ("Career Builder" branding)
- ✅ Cascade delete constraints (user deletion cleanup)
- ✅ Type safety improvements (no `any` policy)

**See:** `MVP_STATUS_NOTION.md` for complete status

---

## 🔍 Finding Information

### **Where to Look**

1. **Project Rules:** `TOTL_PROJECT_CONTEXT_PROMPT.md`
2. **Database Schema:** `database_schema_audit.md`
3. **Documentation Index:** `docs/DOCUMENTATION_INDEX.md`
4. **Common Errors:** `docs/COMMON_ERRORS_QUICK_REFERENCE.md`
5. **Troubleshooting:** `docs/TROUBLESHOOTING_GUIDE.md`

### **Search Strategy**

- **Feature docs:** Check `docs/DOCUMENTATION_INDEX.md` → find category → read relevant docs
- **Error messages:** Check `docs/COMMON_ERRORS_QUICK_REFERENCE.md` first
- **Database questions:** Check `database_schema_audit.md` + `docs/DATABASE_REPORT.md`
- **Auth questions:** Check `docs/AUTH_STRATEGY.md` + `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md`

---

## 🚫 Common Pitfalls to Avoid

### **❌ NEVER Do These:**

1. **Use `any` types** - TypeScript strict mode enforced
2. **Edit `types/database.ts` manually** - It's auto-generated
3. **Change schema without updating `database_schema_audit.md`** - Single source of truth
4. **Use wrong import paths** - Check `docs/COMMON_ERRORS_QUICK_REFERENCE.md`
5. **Fetch profiles in client components** - Use `useAuth()` context instead
6. **Bypass RLS policies** - Security is non-negotiable
7. **Use `.single()` when row might not exist** - Use `.maybeSingle()` instead
8. **Check for `PGRST116` with `.maybeSingle()`** - It doesn't occur with `.maybeSingle()`
9. **Create custom interfaces for DB entities** - Use generated types
10. **Push code that doesn't build locally** - Always test first

---

## 📝 Documentation Rules

### **Where to Put Documentation**

- **Root directory:** Only `README.md`, `database_schema_audit.md`, `MVP_STATUS_NOTION.md`, `notion_update.md`
- **`docs/` folder:** Everything else (feature guides, troubleshooting, setup, etc.)

### **When to Update Documentation**

- **After schema changes:** Update `database_schema_audit.md` FIRST
- **After new features:** Create/update feature docs in `docs/`
- **After bug fixes:** Update `docs/TROUBLESHOOTING_GUIDE.md` if common issue
- **After significant changes:** Update `MVP_STATUS_NOTION.md`

---

## 🔄 Workflow Summary

### **Starting a New Task**

1. **Read** `TOTL_PROJECT_CONTEXT_PROMPT.md`
2. **Check** `docs/DOCUMENTATION_INDEX.md` for relevant docs
3. **Read** all applicable documentation
4. **Review** `database_schema_audit.md` if touching database
5. **Plan** your approach based on documented patterns
6. **Implement** following established conventions
7. **Test** locally before pushing
8. **Run** pre-push checklist
9. **Update** documentation if needed

### **Completing a Task**

1. **Run** pre-push checklist (`npm run schema:verify:comprehensive && npm run build && npm run lint`)
2. **Verify** import paths are correct
3. **Check** types are properly imported
4. **Update** relevant documentation
5. **Commit** with clear message
6. **Push** only if all checks pass

---

## 🆘 Emergency Reference

### **Quick Fixes**

**Schema sync error:**
```bash
npm run types:regen && npm run build
```

**Import path error:**
```bash
# Find incorrect imports
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules
# Fix: Replace with @/lib/supabase-admin-client
```

**Build failure:**
```bash
npm run build  # Fix errors locally first
```

**Type error:**
```typescript
// Ensure Database type is imported correctly
import type { Database } from "@/types/supabase";
```

---

## 📞 Key Files Reference

| File | Purpose | When to Read |
|------|---------|--------------|
| `TOTL_PROJECT_CONTEXT_PROMPT.md` | Complete project rules | Before ANY code |
| `database_schema_audit.md` | Database schema truth | Before DB changes |
| `docs/DOCUMENTATION_INDEX.md` | Documentation map | Finding relevant docs |
| `docs/COMMON_ERRORS_QUICK_REFERENCE.md` | Error fixes | When encountering errors |
| `docs/PRE_PUSH_CHECKLIST.md` | Pre-push checks | Before pushing code |
| `.cursorrules` | Cursor AI rules | Already loaded by Cursor |

---

## 🎓 Learning Path

### **For New Agents:**

1. **Start Here:** Read this document (`AGENT_ONBOARDING.md`)
2. **Read Rules:** `TOTL_PROJECT_CONTEXT_PROMPT.md`
3. **Understand Schema:** `database_schema_audit.md`
4. **Learn Patterns:** `docs/DEVELOPER_QUICK_REFERENCE.md`
5. **Know Errors:** `docs/COMMON_ERRORS_QUICK_REFERENCE.md`
6. **Check Status:** `MVP_STATUS_NOTION.md`

### **For Specific Tasks:**

- **Database work:** `database_schema_audit.md` + `docs/SQL_RLS_POLICY_CREATION_GUIDE.md`
- **Auth work:** `docs/AUTH_STRATEGY.md` + `docs/AUTH_DATABASE_TRIGGER_CHECKLIST.md`
- **Stripe work:** `docs/STRIPE_SUBSCRIPTION_PRD.md` + `docs/STRIPE_TROUBLESHOOTING.md`
- **Admin work:** `docs/ADMIN_ACCOUNT_GUIDE.md`
- **UI work:** `docs/UI_VISUAL_LANGUAGE.md` + `docs/CSS_BEST_PRACTICES.md`

---

## ✅ Final Checklist

**Before you start coding, confirm:**

- [ ] ✅ Read `TOTL_PROJECT_CONTEXT_PROMPT.md`
- [ ] ✅ Checked `docs/DOCUMENTATION_INDEX.md` for relevant docs
- [ ] ✅ Read applicable documentation
- [ ] ✅ Reviewed `database_schema_audit.md` (if touching DB)
- [ ] ✅ Understood the component architecture
- [ ] ✅ Know where to find information
- [ ] ✅ Know the pre-push checklist

**If you checked all boxes, you're ready to code! 🚀**

---

## 📚 Full Documentation Index

See `docs/DOCUMENTATION_INDEX.md` for complete list of 80+ documentation files organized by category.

---

**Remember:** When in doubt, **read the documentation first**. It's faster than debugging later! 🎯

