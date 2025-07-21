# TOTL Agency – Complete Project Context & AI Assistant Rules

## 🎯 Project Overview

**TOTL Agency** is a comprehensive talent booking platform connecting models, actors, and performers with casting directors, agencies, and brands. The platform facilitates gig postings, applications, bookings, and portfolio management with role-based access control.

**Tech Stack:**
- **Frontend:** Next.js 15.2.4 with App Router, TypeScript 5, React Server Components
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI:** TailwindCSS + shadcn/ui components
- **Email:** Resend API for custom transactional emails
- **Deployment:** Vercel (frontend) + Supabase Cloud (backend)

---

## 🏗️ Architecture & Database Schema

### Core Database Tables

#### **Profiles (Core User Accounts)**
```sql
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE, 
  role          TEXT NOT NULL CHECK (role IN ('talent', 'client', 'admin')), 
  display_name  TEXT, 
  avatar_url    TEXT, 
  email_verified BOOLEAN DEFAULT FALSE, 
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(), 
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **Talent Profiles**
```sql
CREATE TABLE public.talent_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name   TEXT NOT NULL,
  last_name    TEXT NOT NULL,
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

#### **Client Profiles**
```sql
CREATE TABLE public.client_profiles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
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

#### **Gigs (Job Postings)**
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

#### **Applications**
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

#### **Bookings**
```sql
CREATE TABLE public.bookings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gig_id        UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  talent_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  booking_date  TIMESTAMPTZ NOT NULL,
  booking_time  TEXT NOT NULL,
  location      TEXT NOT NULL,
  compensation  TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **Portfolio Items**
```sql
CREATE TABLE public.portfolio_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talent_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  title       TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Enum Values
- **User Roles:** `'talent'`, `'client'`, `'admin'`
- **Gig Status:** `'draft'`, `'active'`, `'closed'`, `'featured'`, `'urgent'`
- **Application Status:** `'new'`, `'under_review'`, `'shortlisted'`, `'rejected'`, `'accepted'`
- **Booking Status:** `'pending'`, `'confirmed'`, `'completed'`, `'cancelled'`

---

## 🔐 Row-Level Security (RLS) Policies

### Profiles RLS
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);
```

### Talent Profiles RLS
```sql
ALTER TABLE public.talent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent can manage their own talent_profile"
  ON public.talent_profiles FOR INSERT, UPDATE
  WITH CHECK (auth.uid() = user_id AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'talent');

CREATE POLICY "Talent profiles are viewable by anyone"
  ON public.talent_profiles FOR SELECT
  USING (TRUE);
```

### Client Profiles RLS
```sql
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can manage their own client_profile"
  ON public.client_profiles FOR INSERT, UPDATE
  WITH CHECK (auth.uid() = user_id AND (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'client');

CREATE POLICY "Client profiles are viewable by anyone"
  ON public.client_profiles FOR SELECT
  USING (TRUE);
```

### Gigs RLS
```sql
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create gigs"
  ON public.gigs FOR INSERT
  WITH CHECK (
    auth.uid() = client_id 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client'
  );

CREATE POLICY "Clients can update their own gigs"
  ON public.gigs FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Gigs are viewable by everyone"
  ON public.gigs FOR SELECT
  USING (TRUE);
```

### Applications RLS
```sql
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    auth.uid() = talent_id 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'talent'
  );

CREATE POLICY "Talent can view own applications"
  ON public.applications FOR SELECT
  USING (auth.uid() = talent_id);

CREATE POLICY "Clients can view applications for their gigs"
  ON public.applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = applications.gig_id 
        AND gigs.client_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update applications for their gigs"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.gigs 
      WHERE gigs.id = applications.gig_id 
        AND gigs.client_id = auth.uid()
    )
  );
```

### Bookings RLS
```sql
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (
    auth.uid() = client_id 
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client'
  );

CREATE POLICY "Clients can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Participants can view bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = talent_id);
```

### Portfolio Items RLS
```sql
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talent can add portfolio items"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (
    auth.uid() = talent_id
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'talent'
  );

CREATE POLICY "Talent can update own portfolio items"
  ON public.portfolio_items FOR UPDATE
  USING (auth.uid() = talent_id);

CREATE POLICY "Talent can delete own portfolio items"
  ON public.portfolio_items FOR DELETE
  USING (auth.uid() = talent_id);

CREATE POLICY "Portfolio items are viewable by everyone"
  ON public.portfolio_items FOR SELECT
  USING (TRUE);
```

---

## 🔐 Authentication System

### Signup Flow
1. **User Registration:** Email, password, role selection (talent/client)
2. **Supabase Auth Account:** Creates entry in `auth.users`
3. **Profile Initialization:** Creates row in `profiles` with role
4. **Role-Specific Profile:** Creates entry in `talent_profiles` or `client_profiles`
5. **Email Verification:** Custom Resend email with verification link
6. **Post-Verification:** Account fully active, redirect to appropriate dashboard

### Login & Session Management
- **Login:** `supabase.auth.signInWithPassword`
- **Session Persistence:** Supabase JS client auto-refresh
- **Role-Based Redirects:** Talent → `/admin/talentdashboard`, Client → `/admin/dashboard`
- **Logout:** `supabase.auth.signOut()`

### Middleware for Route Protection
```typescript
// middleware.ts - Role-based access control
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const protectedPaths = ['/dashboard', '/admin'];
    const isAttemptingProtected = protectedPaths.some(path =>
      req.nextUrl.pathname.startsWith(path)
    );
    if (isAttemptingProtected) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    const role = profile?.role;

    // Role-based redirects
    if (role === 'talent' && req.nextUrl.pathname.startsWith('/admin/dashboard')) {
      return NextResponse.redirect(new URL('/admin/talentdashboard', req.url));
    }
    if (role === 'client' && req.nextUrl.pathname.startsWith('/admin/talentdashboard')) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
  }

  return res;
}
```

---

## 📁 Project Structure

```
totl/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── admin/                    # Admin dashboard routes
│   ├── talent/                   # Talent-specific routes
│   ├── client/                   # Client-specific routes
│   └── api/                      # API routes
├── components/
│   ├── ui/                       # shadcn/ui components
│   └── [custom components]       # Custom React components
├── lib/
│   ├── supabase-client.ts        # Supabase client initialization
│   ├── supabase-admin-client.ts  # Admin client for server-side
│   └── [utility functions]       # Helper functions
├── types/
│   └── database.ts               # Generated Supabase types
├── supabase/
│   ├── migrations/               # Database migrations
│   └── functions/                # Edge functions
└── middleware.ts                 # Route protection
```

---

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="<YOUR_SUPABASE_PROJECT_URL>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<YOUR_SUPABASE_ANON_PUBLIC_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<YOUR_SUPABASE_SERVICE_ROLE_KEY>"

# Email Service (Resend)
RESEND_API_KEY="<YOUR_RESEND_API_KEY>"

# Application
NEXT_PUBLIC_SITE_URL="<YOUR_SITE_URL>"
```

---

## 🎨 UI/UX Guidelines

### Design System
- **Colors:** Black/white primary, gray scale for UI elements
- **Typography:** Clean, professional fonts
- **Components:** shadcn/ui library for consistency
- **Layout:** Responsive design with mobile-first approach

### User Flows
- **Talent:** Browse gigs → Apply → Manage applications → Portfolio
- **Client:** Post gigs → Review applications → Manage bookings → Browse talent
- **Admin:** User management, platform oversight

---

## 🚀 Development Workflow

### Code Standards
- **TypeScript:** Strict mode enabled, no `any` types
- **ESLint:** Next.js core web vitals + TypeScript rules
- **Prettier:** Consistent code formatting
- **Components:** Presentational only, no direct data fetching

### Database Access
- **Client:** Use `lib/supabase-client.ts` for all queries
- **Server:** Use `lib/supabase-admin-client.ts` when needed
- **RLS:** Always assume RLS is active, never bypass on client
- **Types:** Use generated `Database` types for all queries

### Testing Strategy
- **Unit Tests:** Utility functions and business logic
- **Integration Tests:** API routes and database operations
- **E2E Tests:** Critical user flows (signup, gig posting, applications)

---

## 🔄 Deployment & CI/CD

### Production Setup
- **Frontend:** Vercel deployment with environment variables
- **Backend:** Supabase Cloud with production database
- **Email:** Resend production API key
- **Monitoring:** Error tracking and performance monitoring

### Migration Strategy
- **Schema Changes:** Use Supabase migrations
- **Type Generation:** Auto-generate types after schema changes
- **Rollback Plan:** Database backups and migration rollbacks

---

## 🛡️ Security Best Practices

### Data Protection
- **RLS Policies:** Enforce row-level security on all tables
- **Input Validation:** Validate all user inputs
- **Rate Limiting:** Prevent abuse of auth endpoints
- **HTTPS:** All production traffic over HTTPS

### Authentication Security
- **Email Verification:** Required for all accounts
- **Password Requirements:** Strong password policies
- **Session Management:** Secure session handling
- **Admin Access:** Restricted admin functionality

---

## 📚 Resources & Documentation

### Key Files
- **Database Schema:** `supabase/migrations/`
- **Type Definitions:** `types/database.ts`
- **Auth Provider:** `components/auth-provider.tsx`
- **Middleware:** `middleware.ts`
- **API Routes:** `app/api/`

### External Services
- **Supabase Dashboard:** Database management and monitoring
- **Vercel Dashboard:** Frontend deployment and analytics
- **Resend Dashboard:** Email delivery and analytics

---

## 🤖 AI Assistant Rules & Context Engineering

### Before Writing Any Code
1. **ALWAYS reference this context file first**
2. **Check existing database schema** before modifying
3. **Verify RLS policies** for any data access
4. **Use generated types** from `types/database.ts`
5. **Follow project structure** and naming conventions

### Code Generation Guidelines
- **No `any` types** - use proper TypeScript interfaces
- **RLS-compatible queries** - assume security policies are active
- **Component separation** - no database logic in React components
- **Error handling** - always check for Supabase errors
- **Type safety** - leverage generated database types

### Architecture Compliance
- **Database access** through centralized Supabase clients
- **Server-side data fetching** in API routes or server components
- **Client-side state management** through React context
- **Route protection** via Next.js middleware
- **Email handling** through Resend API

### Security Requirements
- **Never expose service keys** in client-side code
- **Always validate user permissions** before data access
- **Use parameterized queries** (Supabase handles this)
- **Implement proper error handling** for all database operations
- **Follow least privilege principle** in all data access

---

## 📋 Current Project Status

### ✅ Completed Features
- User authentication and role-based access
- Talent and client profile management
- Gig posting and browsing
- Application system
- Portfolio management
- Email verification system
- Admin dashboard framework

### 🚧 In Progress
- Booking management system
- Advanced search and filtering
- Real-time notifications
- Payment integration
- Advanced admin features

### 📋 Planned Features
- Mobile app development
- Advanced analytics
- Multi-language support
- API for third-party integrations
- Advanced reporting tools

---

## 🔗 Quick Reference

### Common Database Queries
```typescript
// Get user profile with role
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Get talent profile with details
const { data: talentProfile } = await supabase
  .from('talent_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Get gigs with client info
const { data: gigs } = await supabase
  .from('gigs')
  .select(`
    *,
    profiles!gigs_client_id_fkey (
      company_name,
      industry
    )
  `)
  .eq('status', 'active');
```

### Common Component Patterns
```typescript
// Protected route component
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Redirect to="/login" />;
  
  return <>{children}</>;
}

// Safe query wrapper
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const result = await queryFn();
    return { data: result.data, error: result.error?.message || null };
  } catch (error) {
    return { data: null, error: 'Unexpected error occurred' };
  }
}
```

---

**This context file should be referenced before writing any code for the TOTL Agency project. It contains all necessary information about the database schema, authentication system, security policies, and development guidelines.** 