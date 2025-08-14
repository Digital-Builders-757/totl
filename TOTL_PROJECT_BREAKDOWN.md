# 🎯 TOTL Agency - Complete Project Breakdown

**For LLM Context Loading**  
**Date:** January 2025  
**Status:** Production Ready  
**Purpose:** Comprehensive project overview for AI assistance

---

## 📋 **PROJECT OVERVIEW**

**TOTL Agency** is a talent booking platform connecting models, actors, and performers with casting directors, agencies, and brands. The platform facilitates gig postings, applications, bookings, and portfolio management with role-based access control.

**Key Features:**
- Role-based access (talent/client/admin)
- Gig posting and management
- Application system with status tracking
- Portfolio management
- Real-time notifications
- Secure authentication with email verification
- Row-level security (RLS) on all data

---

## 🛠️ **TECH STACK**

### **Frontend**
- **Framework:** Next.js 15.2.4 with App Router
- **Language:** TypeScript 5
- **UI:** TailwindCSS + shadcn/ui components
- **State Management:** React Server Components + Server Actions
- **Forms:** React Hook Form + Zod validation

### **Backend**
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Real-time:** Supabase Realtime
- **Email:** Resend API

### **Development Tools**
- **Package Manager:** npm
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged
- **Type Checking:** TypeScript strict mode
- **Environment:** PowerShell (Windows)

---

## 🗃️ **DATABASE SCHEMA**

### **Core Tables (8 total)**

#### **1. profiles** - Main User Accounts
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

#### **2. talent_profiles** - Talent-Specific Data
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

#### **3. client_profiles** - Client-Specific Data
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

#### **4. gigs** - Job Postings
```sql
CREATE TABLE public.gigs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT,
  location             TEXT NOT NULL,
  compensation_min     INTEGER,
  compensation_max     INTEGER,
  duration             TEXT,
  start_date           DATE,
  end_date             DATE,
  application_deadline DATE,
  requirements         TEXT[],
  status               gig_status DEFAULT 'draft',
  image_url            TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **5. applications** - Talent Applications
```sql
CREATE TABLE public.applications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id     UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  talent_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     application_status DEFAULT 'new',
  message    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(gig_id, talent_id)
);
```

#### **6. bookings** - Confirmed Bookings
```sql
CREATE TABLE public.bookings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id        UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  talent_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        booking_status DEFAULT 'pending',
  booking_date  DATE,
  booking_time  TIME,
  location      TEXT,
  compensation  INTEGER,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **7. portfolio_items** - Talent Portfolio
```sql
CREATE TABLE public.portfolio_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talent_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT,
  description TEXT,
  image_url   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **8. gig_requirements** - Gig Requirements
```sql
CREATE TABLE public.gig_requirements (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id   UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### **Custom Types (Enums)**

```sql
-- User roles
CREATE TYPE public.user_role AS ENUM ('talent', 'client', 'admin');

-- Gig statuses
CREATE TYPE public.gig_status AS ENUM ('draft', 'published', 'closed', 'completed');

-- Application statuses
CREATE TYPE public.application_status AS ENUM ('new', 'under_review', 'shortlisted', 'rejected', 'accepted');

-- Booking statuses
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
```

---

## 🔒 **SECURITY MODEL**

### **Row-Level Security (RLS)**
All tables have RLS enabled with specific policies:

#### **profiles**
- Users can SELECT/UPDATE their own row
- Everyone can SELECT (public profile reads)

#### **talent_profiles**
- Talent can INSERT/UPDATE their own
- Everyone can SELECT

#### **client_profiles**
- Clients can INSERT/UPDATE their own
- Everyone can SELECT

#### **gigs**
- Only clients can INSERT
- Clients can UPDATE their own gigs
- Everyone can SELECT

#### **applications**
- Talent can INSERT and view own applications
- Clients can SELECT/UPDATE applications for gigs they own

#### **bookings**
- Clients INSERT/UPDATE own bookings
- Client or talent participant can SELECT

#### **portfolio_items**
- Talent INSERT/UPDATE/DELETE own items
- Everyone can SELECT

### **Authentication Flow**
1. User signs up → Supabase Auth creates user
2. `handle_new_user()` trigger creates profile with default role
3. User completes role-specific profile
4. Email verification required
5. Role-based routing to appropriate dashboard

---

## 🏗️ **PROJECT STRUCTURE**

```
totl/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── admin/                    # Admin dashboard routes
│   ├── client/                   # Client dashboard routes
│   ├── talent/                   # Talent dashboard routes
│   ├── api/                      # API routes
│   ├── gigs/                     # Public gig listings
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── auth-provider.tsx        # Auth context
│   └── [other components]
├── lib/                         # Utilities and clients
│   ├── supabase-client.ts       # Client-side Supabase client
│   ├── supabase-admin-client.ts # Server-side admin client
│   ├── safe-query.ts           # Safe query wrappers
│   ├── selects.ts              # Column selection helpers
│   └── [other utilities]
├── types/                       # TypeScript types
│   ├── database.ts             # Auto-generated Supabase types
│   └── supabase.ts             # Database type definition
├── supabase/                    # Supabase configuration
│   ├── migrations/             # Database migrations
│   ├── functions/              # Edge functions
│   └── config.toml            # Supabase config
├── scripts/                     # Development scripts
│   ├── verify-schema-sync.ps1  # Schema verification
│   ├── prepend-autogen-banner.mjs # Type banner
│   └── [other scripts]
└── docs/                       # Documentation
```

---

## 🔧 **DEVELOPMENT WORKFLOW**

### **Type Safety System**
- `types/database.ts` is AUTO-GENERATED from Supabase schema
- Never manually edit this file
- Regenerate after schema changes: `npm run types:regen`
- Verification: `npm run types:check`

### **Database Changes**
1. Update `database_schema_audit.md` (single source of truth)
2. Create new migration: `supabase migration new <description>`
3. Apply migration: `supabase db push`
4. Regenerate types: `npm run types:regen`
5. Verify: `npm run schema:verify`

### **Code Standards**
- **No `any` types** - Use generated types only
- **No `select('*')`** - Use explicit column selection
- **No direct Supabase imports** - Use centralized clients
- **Server components** for data fetching
- **Client components** for presentation only

### **Available Scripts**
```bash
npm run dev              # Development server
npm run build            # Production build
npm run lint             # ESLint check
npm run format           # Prettier formatting
npm run types:regen      # Regenerate types
npm run types:check      # Verify types are fresh
npm run schema:verify    # Comprehensive verification
npm run verify-all       # All checks
npm run db:reset         # Reset local database
npm run db:push          # Push migrations
npm run db:pull          # Pull schema changes
```

---

## 🚀 **ROUTING & AUTHENTICATION**

### **Route Protection**
- **Public routes:** `/`, `/about`, `/gigs`, `/talent`
- **Auth routes:** `/login`, `/signup`, `/reset-password`
- **Protected routes:** All dashboard routes
- **Role-based access:** `/talent/*`, `/client/*`, `/admin/*`

### **Middleware Logic**
1. Check if route requires authentication
2. Verify session exists
3. Check user role from profiles table
4. Redirect to appropriate dashboard or login
5. Enforce role-based route access

### **Role Redirects**
- **talent** → `/talent/dashboard`
- **client** → `/client/dashboard`
- **admin** → `/admin/dashboard`
- **no role** → `/choose-role`

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
- Data management

---

## 🔍 **CURRENT STATUS**

### **✅ Completed**
- Complete database schema with RLS
- Authentication system with role-based access
- Type safety system with automated verification
- Development workflow with comprehensive checks
- Basic UI components and layouts
- Middleware for route protection

### **🚧 In Progress**
- Portfolio upload functionality
- Email templates (verification/reset)
- Advanced search and filtering
- Real-time notifications

### **📋 Planned**
- Messaging system
- Payment integration
- Advanced analytics
- Mobile optimization

---

## 🛡️ **SECURITY FEATURES**

### **Data Protection**
- Row-level security on all tables
- Service role key isolation (server-only)
- Input validation with Zod
- SQL injection prevention (Supabase handles)
- XSS protection (Next.js built-in)

### **Authentication Security**
- Email verification required
- Secure session management
- Role-based access control
- Protected route middleware
- CSRF protection

---

## 📊 **PERFORMANCE OPTIMIZATIONS**

### **Database**
- Proper indexing on foreign keys
- Efficient query patterns
- RLS-optimized queries
- Connection pooling

### **Frontend**
- Server components for data fetching
- Image optimization with Next.js
- Code splitting and lazy loading
- TailwindCSS for minimal CSS

---

## 🐛 **TROUBLESHOOTING**

### **Common Issues**
1. **Type errors** → Run `npm run types:regen`
2. **Schema drift** → Run `npm run schema:verify`
3. **RLS issues** → Check user permissions
4. **Auth problems** → Verify email verification

### **Development Commands**
```bash
# Reset everything
npm run db:reset
npm run types:regen

# Verify system health
npm run verify-all

# Check specific issues
npm run types:check
npm run schema:verify
```

---

## 📞 **CONTEXT FOR AI ASSISTANCE**

When helping with this project:

1. **Always reference** `database_schema_audit.md` for schema truth
2. **Use generated types** from `types/database.ts`
3. **Follow RLS patterns** - no service role in client code
4. **Use explicit columns** - no `select('*')`
5. **Server components** for data, client components for UI
6. **PowerShell environment** - use Windows-compatible commands
7. **Type safety first** - no `any` types
8. **Security by default** - assume RLS is active

**Key Files to Reference:**
- `database_schema_audit.md` - Database schema truth
- `types/database.ts` - Generated types
- `lib/supabase-client.ts` - Client configuration
- `middleware.ts` - Route protection
- `package.json` - Available scripts

---

**This breakdown provides complete context for AI assistance with the TOTL Agency project. All architectural decisions, security models, and development patterns are documented for consistent guidance.**
