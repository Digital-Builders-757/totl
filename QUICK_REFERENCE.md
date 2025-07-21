# TOTL Agency - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linting
npm run lint

# Generate Supabase types
npx supabase gen types typescript --project-id "<YOUR_PROJECT_ID>" > types/database.ts
```

## 📊 Database Schema Quick Reference

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
- `applications.gig_id` → `bookings.gig_id` (1:1)

## 🔐 Authentication Flow

### User Roles
- **`talent`** → `/admin/talentdashboard`
- **`client`** → `/admin/dashboard`
- **`admin`** → `/admin/dashboard`

### Protected Routes
- `/admin/*` - Requires authentication
- `/admin/talentdashboard/*` - Talent only
- `/admin/dashboard/*` - Client/Admin only

## 💻 Common Code Patterns

### Supabase Client Usage
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

### Safe Query Pattern
```typescript
const { data, error } = await supabase
  .from('gigs')
  .select(`
    *,
    profiles!gigs_client_id_fkey (
      company_name,
      industry
    )
  `)
  .eq('status', 'active');

if (error) {
  console.error('Error fetching gigs:', error);
  return [];
}

return data || [];
```

### Component Pattern
```typescript
// Server Component (data fetching)
export default async function GigsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: gigs } = await supabase.from('gigs').select('*');
  
  return <GigsClient gigs={gigs || []} />;
}

// Client Component (presentational)
export function GigsClient({ gigs }: { gigs: Gig[] }) {
  return (
    <div>
      {gigs.map(gig => (
        <GigCard key={gig.id} gig={gig} />
      ))}
    </div>
  );
}
```

## 🎨 UI Components

### shadcn/ui Components Used
- `Button` - All buttons
- `Card` - Content containers
- `Input` - Form inputs
- `Form` - Form handling
- `Dialog` - Modals
- `Tabs` - Tab navigation
- `Badge` - Status indicators
- `Avatar` - User avatars
- `SafeImage` - Image with fallbacks

### Styling
- **Primary:** Black (`bg-black`, `text-black`)
- **Secondary:** Gray scale (`bg-gray-50`, `text-gray-600`)
- **Accent:** Green for success, red for errors
- **Layout:** Container with max-width, responsive grid

## 🔧 Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL="<YOUR_SUPABASE_PROJECT_URL>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<YOUR_SUPABASE_ANON_PUBLIC_KEY>"
SUPABASE_SERVICE_ROLE_KEY="<YOUR_SUPABASE_SERVICE_ROLE_KEY>"
RESEND_API_KEY="<YOUR_RESEND_API_KEY>"

# Optional
NEXT_PUBLIC_SITE_URL="<YOUR_SITE_URL>"
```

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

### Pages
- `app/admin/talentdashboard/` - Talent dashboard
- `app/admin/dashboard/` - Client dashboard
- `app/gigs/` - Gig browsing
- `app/talent/` - Talent profiles

## 🚨 Common Issues & Solutions

### TypeScript Errors
- **Missing types:** Run `npx supabase gen types typescript`
- **`any` types:** Use proper interfaces from `types/database.ts`
- **Import errors:** Check file paths and exports

### Authentication Issues
- **Session not found:** Check middleware and auth provider
- **Role redirects:** Verify user role in profiles table
- **Email verification:** Check `profiles.email_verified` field

### Database Errors
- **RLS policy violations:** Check user permissions and policies
- **Foreign key errors:** Verify referenced records exist
- **Unique constraint violations:** Check for duplicate entries

## 🔄 Development Workflow

1. **Start development:** `npm run dev`
2. **Make changes:** Follow TypeScript and linting rules
3. **Test locally:** Check all user flows
4. **Database changes:** Create migration files
5. **Deploy:** Push to Vercel and Supabase

## 📞 Support

- **Documentation:** Check `TOTL_PROJECT_CONTEXT_PROMPT.md`
- **Database:** Supabase Dashboard
- **Deployment:** Vercel Dashboard
- **Email:** Resend Dashboard

---

*This quick reference should help you get started quickly. For complete details, always refer to `TOTL_PROJECT_CONTEXT_PROMPT.md`.* 