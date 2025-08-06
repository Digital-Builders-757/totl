# TOTL Agency - Project Context

**Last Updated:** July 25, 2025  
**Status:** Production Ready

## 🎯 Project Overview

**TOTL Agency** is a comprehensive talent booking platform connecting models, actors, and performers with casting directors, agencies, and brands.

**Tech Stack:**
- **Frontend:** Next.js 15.2.4 with App Router, TypeScript 5, React Server Components
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI:** TailwindCSS + shadcn/ui components
- **Email:** Resend API for custom transactional emails

## 🖥️ Environment

### **Terminal Environment**
- **OS:** Windows 10/11
- **Shell:** PowerShell
- **Commands:** Use PowerShell-compatible commands only
  - `Get-ChildItem` instead of `ls`
  - `Get-Content` instead of `cat`
  - `Select-String` instead of `grep`
  - `Where-Object` for filtering
  - `ForEach-Object` for iteration

## 📊 Database Schema

### Core Tables
- **`profiles`** - User accounts with roles (talent/client/admin)
- **`talent_profiles`** - Extended talent information
- **`client_profiles`** - Extended client information
- **`gigs`** - Job postings by clients
- **`applications`** - Talent applications to gigs
- **`bookings`** - Confirmed engagements
- **`portfolio_items`** - Talent portfolio media

### Key Relationships
- `profiles.id` → `auth.users.id` (1:1)
- `profiles.id` → `talent_profiles.user_id` (1:1)
- `profiles.id` → `client_profiles.user_id` (1:1)
- `profiles.id` → `gigs.client_id` (1:many)
- `gigs.id` → `applications.gig_id` (1:many)

## 🔐 Authentication & Security

### User Roles
- **`talent`** → `/talent/dashboard`
- **`client`** → `/client/dashboard`
- **`admin`** → `/admin/dashboard`

### Security Features
- Row-Level Security (RLS) on all tables
- Role-based access control
- Email verification required
- No service keys in client code
- Recent security hardening (July 25, 2025)

## 🏗️ Architecture Patterns

### Database Access
- Use `lib/supabase-client.ts` for client-side queries
- Use `lib/supabase-admin-client.ts` for server-side operations
- Always assume RLS is active
- Use generated types from `types/database.ts`

### Component Structure
- React components are presentational only
- Server components handle data fetching
- Pass data as props to client components
- Use proper error boundaries

### Code Standards
- No `any` types - use generated TypeScript types
- Proper error handling for all database operations
- Follow established naming conventions
- Use Zod for form validation

## 📁 Key Files

### Core Files
- `TOTL_PROJECT_CONTEXT_PROMPT.md` - Complete project context
- `types/database.ts` - Generated Supabase types
- `lib/supabase-client.ts` - Supabase client
- `middleware.ts` - Route protection
- `components/auth-provider.tsx` - Auth context

### Database
- `supabase/migrations/` - Database migrations
- `supabase/config.toml` - Supabase configuration

### Documentation
- `docs/DOCUMENTATION_OVERVIEW.md` - Navigation guide for all documentation
- `docs/DEVELOPER_QUICK_REFERENCE.md` - Daily development patterns
- `docs/CODING_STANDARDS.md` - Development guidelines
- `database_schema_audit.md` - Database schema (single source of truth)

## 🚫 Forbidden Patterns

- Using `any` types in TypeScript
- Direct database calls in React components
- Bypassing RLS policies
- Exposing service keys to client
- Mixing database logic with UI logic
- Using camelCase for metadata keys (must use snake_case)
- Using Unix commands in PowerShell environment
- Making changes without checking documentation first

## ✅ Best Practices

- Always reference `TOTL_PROJECT_CONTEXT_PROMPT.md` before coding
- Use generated types from `types/database.ts`
- Follow RLS-compatible query patterns
- Separate database logic from React components
- Implement proper error handling
- Follow project naming conventions
- Use lowercase with underscores for metadata keys
- Check documentation before making changes
- Update documentation after significant changes
- Use PowerShell-compatible commands only

## 🔧 Critical Requirements

### **Documentation-First Approach**
**CRITICAL:** Always check relevant documentation before making any changes:
1. Read `docs/DOCUMENTATION_OVERVIEW.md` to understand documentation structure
2. Check `docs/DEVELOPER_QUICK_REFERENCE.md` for common patterns
3. Review `docs/CODING_STANDARDS.md` for development guidelines
4. Consult `database_schema_audit.md` for database changes
5. Reference `TOTL_PROJECT_CONTEXT_PROMPT.md` for complete context

### **PowerShell Environment**
**CRITICAL:** Use PowerShell-compatible commands only:
```powershell
# ✅ CORRECT - PowerShell commands
Get-ChildItem -Recurse -Filter "*.ts"
Get-Content file.txt | Select-String "pattern"
Get-ChildItem -Directory | Where-Object { $_.Name -like "*component*" }

# ❌ WRONG - Unix commands (don't work in PowerShell)
ls -la
cat file.txt
grep "pattern" file.txt
```

### **Metadata Key Naming**
**CRITICAL:** All user metadata keys must use **lowercase with underscores**:
```typescript
// ✅ CORRECT
{ first_name: "John", last_name: "Doe", role: "talent" }

// ❌ WRONG
{ firstName: "John", lastName: "Doe", Role: "talent" }
```

### **Database Schema**
- Single source of truth: `database_schema_audit.md`
- All tables have RLS enabled
- Triggers automatically create profiles on signup
- Never use service keys in client code

## 📝 Documentation Update Process

### **Before Making Changes**
- [ ] Read `docs/DOCUMENTATION_OVERVIEW.md`
- [ ] Check `docs/DEVELOPER_QUICK_REFERENCE.md` for patterns
- [ ] Review `docs/CODING_STANDARDS.md` for guidelines
- [ ] Consult `database_schema_audit.md` for database changes
- [ ] Reference `TOTL_PROJECT_CONTEXT_PROMPT.md` for context

### **After Making Changes**
- [ ] Update relevant documentation files
- [ ] Update timestamps in modified files
- [ ] Remove outdated information
- [ ] Ensure cross-references are accurate
- [ ] Update `docs/DOCUMENTATION_OVERVIEW.md` if needed
- [ ] Test documentation instructions

---

**For complete details, always refer to `TOTL_PROJECT_CONTEXT_PROMPT.md`** 