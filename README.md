# TOTL Agency - Talent Booking Platform

**Status:** Production Ready  
**Last Updated:** July 25, 2025

A comprehensive talent booking platform connecting models, actors, and performers with casting directors, agencies, and brands. Built with Next.js 15, Supabase, and TypeScript.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Resend API key (for emails)

### ⚠️ Important: Next.js 15+ Compatibility
This project uses Next.js 15+ which requires specific patterns for async cookies. Always use our centralized Supabase client helpers:

```typescript
// ✅ Use these patterns
import { createSupabaseServerClient } from "@/lib/supabase-client";
const supabase = await createSupabaseServerClient();

// ❌ Avoid direct Supabase client creation
const supabase = createServerComponentClient<Database>({ cookies });
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd totl

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Resend credentials

# Start development server
npm run dev
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Email Service
RESEND_API_KEY=your_resend_key
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 15.2.4 with App Router, TypeScript 5, React Server Components
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Real-time)
- **UI:** TailwindCSS + shadcn/ui components
- **Email:** Resend API for custom transactional emails
- **Deployment:** Vercel (frontend) + Supabase Cloud (backend)
- **Database:** PostgreSQL with Row-Level Security (RLS)

## 🏗️ Architecture

### Database Schema
The platform uses a well-structured PostgreSQL database with the following core tables:

- **`profiles`** - Main user accounts with roles
- **`talent_profiles`** - Talent-specific data
- **`client_profiles`** - Client-specific data
- **`gigs`** - Job postings by clients
- **`applications`** - Talent applications to gigs
- **`bookings`** - Confirmed engagements
- **`portfolio_items`** - Talent portfolio media

### Authentication Flow
1. **User Signup** → Supabase Auth
2. **Trigger** → Automatic profile creation
3. **Email Verification** → Profile activation
4. **Role-based Routing** → Appropriate dashboard

### Security
- **Row-Level Security (RLS)** enabled on all tables
- **Role-based access control** (talent/client/admin)
- **Secure authentication** with Supabase Auth
- **Input validation** with Zod schemas

## 📁 Project Structure

```
totl/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── talent/            # Talent dashboard & features
│   ├── client/            # Client dashboard & features
│   ├── admin/             # Admin panel
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Custom components
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
├── supabase/             # Database migrations & config
├── docs/                 # Documentation
└── scripts/              # Utility scripts
```

## 🔐 User Roles & Access

### Talent Users
- **Dashboard:** `/talent/dashboard`
- **Features:** Browse gigs, apply, manage profile, portfolio
- **Access:** View active gigs, submit applications

### Client Users  
- **Dashboard:** `/client/dashboard`
- **Features:** Post gigs, review applications, manage bookings
- **Access:** Create/edit gigs, view applications for their gigs

### Admin Users
- **Dashboard:** `/admin/dashboard`
- **Features:** User management, platform oversight
- **Access:** Full platform access

## 🚀 Development

### Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint

# Database
npx supabase gen types typescript --project-id "<ID>" > types/database.ts
npx supabase db reset    # Reset local database
npx supabase db push     # Push migrations to remote
```

### Code Patterns

#### Supabase Client Usage
```typescript
// Client-side
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";

const supabase = createClientComponentClient<Database>();

// Server-side
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabase = createServerComponentClient<Database>({ cookies });
```

#### Component Architecture
```typescript
// Server Component (data fetching)
export default async function GigsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: gigs } = await supabase
    .from('gigs')
    .select('*')
    .eq('status', 'active');
  
  return <GigsClient gigs={gigs || []} />;
}

// Client Component (presentational)
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

## 📊 Production Status

### ✅ Production Ready Features
- ✅ Clean database (no mock data)
- ✅ Secure RLS policies
- ✅ Proper empty states
- ✅ Real data fetching
- ✅ Email verification flow
- ✅ Role-based routing
- ✅ TypeScript compilation
- ✅ Build process working

### Current Database State
| Table | Records | Status |
|-------|---------|--------|
| `profiles` | 2 | ✅ Clean |
| `client_profiles` | 1 | ✅ Clean |
| `talent_profiles` | 1 | ✅ Clean |
| `gigs` | 0 | ✅ Ready for real data |
| `applications` | 0 | ✅ Ready for real data |

### Test Account
- **Email:** `testclient@example.com`
- **Password:** `TestPassword123!`
- **Purpose:** Demo client functionality

## 📚 Documentation

### Core Documentation
- **[Project Context](TOTL_PROJECT_CONTEXT_PROMPT.md)** - Complete project overview and AI assistant rules
- **[Database Schema](database_schema_audit.md)** - Single source of truth for database structure
- **[Developer Quick Reference](docs/DEVELOPER_QUICK_REFERENCE.md)** - Common patterns and troubleshooting
- **[Coding Standards](docs/CODING_STANDARDS.md)** - Development guidelines

### Additional Resources
- **[Authentication Strategy](docs/AUTH_STRATEGY.md)** - Detailed auth flow and security
- **[Email Service](docs/email-service.md)** - Email integration details
- **[Security Fixes](SECURITY_FIXES_SUMMARY.md)** - Recent security improvements

## 🔧 Troubleshooting

### Common Issues

#### Build Errors
```bash
# TypeScript errors
npm run type-check

# Linting issues  
npm run lint

# Build issues
npm run build
```

#### Database Issues
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check user profiles
SELECT p.id, p.role, p.display_name 
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id;
```

#### Authentication Issues
- Verify environment variables are set correctly
- Check Supabase project settings
- Ensure email verification is configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use proper error handling
- Write meaningful commit messages
- Test thoroughly before submitting PRs
- Follow the established component patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the [documentation](docs/)
- Review the [troubleshooting guide](#-troubleshooting)
- Open an issue on GitHub

---

**Built with ❤️ for the talent industry**
