# TOTL Agency - Project Context

## 🎯 Project Overview

**TOTL Agency** is a comprehensive talent booking platform connecting models, actors, and performers with casting directors, agencies, and brands.

**Tech Stack:**
- **Frontend:** Next.js 15.2.4 with App Router, TypeScript 5, React Server Components
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI:** TailwindCSS + shadcn/ui components
- **Email:** Resend API for custom transactional emails

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
- **`talent`** → `/admin/talentdashboard`
- **`client`** → `/admin/dashboard`
- **`admin`** → `/admin/dashboard`

### Security Features
- Row-Level Security (RLS) on all tables
- Role-based access control
- Email verification required
- No service keys in client code

## 🏗️ Architecture Patterns

### Database Access
- Use `lib/supabase-client.ts` for client-side queries
- Use `lib/supabase-admin-client.ts` for server-side operations
- Always assume RLS is active

### Component Structure
- React components are presentational only
- Server components handle data fetching
- Pass data as props to client components

### Code Standards
- No `any` types - use generated TypeScript types
- Proper error handling for all database operations
- Follow established naming conventions

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

## 🚫 Forbidden Patterns

- Using `any` types in TypeScript
- Direct database calls in React components
- Bypassing RLS policies
- Exposing service keys to client
- Mixing database logic with UI logic

## ✅ Best Practices

- Always reference `TOTL_PROJECT_CONTEXT_PROMPT.md` before coding
- Use generated types from `types/database.ts`
- Follow RLS-compatible query patterns
- Separate database logic from React components
- Implement proper error handling
- Follow project naming conventions

---

**For complete details, always refer to `TOTL_PROJECT_CONTEXT_PROMPT.md`** 