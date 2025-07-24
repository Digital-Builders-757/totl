# TOTL Agency - Developer Onboarding

**Last Updated:** July 23, 2025  
**Status:** Production Ready

## Table of Contents
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Git
- Supabase account
- Resend API key (for emails)

### **Initial Setup**
```bash
# Clone the repository
git clone <repository-url>
cd totl

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

## ⚙️ Environment Setup

### **Required Environment Variables**
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Email Service (Resend)
RESEND_API_KEY=your_resend_api_key

# Optional - Custom domain for emails
RESEND_DOMAIN=your-domain.com
```

### **Getting Supabase Credentials**
1. **Create Supabase project** at [supabase.com](https://supabase.com)
2. **Go to Settings** → API
3. **Copy Project URL** and anon key
4. **Add to .env.local**

### **Getting Resend API Key**
1. **Sign up** at [resend.com](https://resend.com)
2. **Go to API Keys** section
3. **Create new API key**
4. **Add to .env.local**

## 🗄️ Database Setup

### **Local Development**
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Generate types
npx supabase gen types typescript --local > types/database.ts
```

### **Production Database**
```bash
# Link to remote project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Generate types from remote
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

### **Database Schema**
The database schema is defined in `database_schema_audit.md` - this is the **single source of truth**.

**Key Tables:**
- `profiles` - Main user accounts
- `talent_profiles` - Talent-specific data
- `client_profiles` - Client-specific data
- `gigs` - Job postings
- `applications` - Talent applications
- `bookings` - Confirmed engagements

### **Critical Database Notes**
- **RLS is enabled** on all tables
- **Triggers automatically create** profiles on signup
- **Metadata keys must use** lowercase with underscores
- **Never use service keys** in client code

## 💻 Development Workflow

### **Code Standards**
- **TypeScript only** - no `any` types
- **Use generated types** from `types/database.ts`
- **Server components** for data fetching
- **Client components** for interactivity
- **Zod validation** for forms

### **Component Patterns**

#### **Server Component (Data Fetching)**
```typescript
// app/gigs/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function GigsPage() {
  const supabase = createServerComponentClient({ cookies });
  
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

### **Authentication Patterns**
```typescript
// Check authentication
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

### **Form Validation**
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

## 🧪 Testing

### **Manual Testing Checklist**

#### **User Registration**
- [ ] **Talent signup** - Creates talent profile
- [ ] **Client signup** - Creates client profile
- [ ] **Email verification** - Works correctly
- [ ] **Role-based routing** - Goes to correct dashboard

#### **Gig Management**
- [ ] **Create gig** - Client can post gigs
- [ ] **Edit gig** - Client can update gigs
- [ ] **Delete gig** - Client can remove gigs
- [ ] **Gig visibility** - Talent can see active gigs

#### **Application Flow**
- [ ] **Apply to gig** - Talent can apply
- [ ] **Review applications** - Client can see applications
- [ ] **Update status** - Client can change application status
- [ ] **Application notifications** - Emails sent correctly

#### **Security Testing**
- [ ] **RLS policies** - Users can only access their data
- [ ] **Unauthorized access** - Blocked appropriately
- [ ] **Role restrictions** - Proper access control

### **Test Accounts**
```bash
# Test Client Account
Email: testclient@example.com
Password: TestPassword123!
Purpose: Demo client functionality

# Create additional test accounts as needed
```

### **Automated Testing**
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run build
npm run build
```

## 🚀 Deployment

### **Vercel Deployment**
1. **Connect repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will auto-deploy on push to main

### **Environment Variables in Production**
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
RESEND_API_KEY=your_resend_key

# Optional
RESEND_DOMAIN=your-domain.com
```

### **Database Migration**
```bash
# Push migrations to production
supabase db push

# Generate types from production
npx supabase gen types typescript --project-id your-project-id > types/database.ts
```

### **Post-Deployment Checklist**
- [ ] **Environment variables** set correctly
- [ ] **Database migrations** applied
- [ ] **Email service** working
- [ ] **Authentication** functioning
- [ ] **RLS policies** active
- [ ] **Performance** acceptable

## 📚 Key Documentation

### **Essential Files**
- **[Project Context](TOTL_PROJECT_CONTEXT_PROMPT.md)** - Complete project overview
- **[Database Schema](database_schema_audit.md)** - Single source of truth for database
- **[Developer Quick Reference](DEVELOPER_QUICK_REFERENCE.md)** - Common patterns
- **[Coding Standards](CODING_STANDARDS.md)** - Development guidelines

### **Important Directories**
```
app/                    # Next.js pages and API routes
components/            # React components
lib/                   # Utility functions and services
types/                 # TypeScript type definitions
supabase/              # Database migrations and config
docs/                  # Documentation
```

### **Critical Files**
```
TOTL_PROJECT_CONTEXT_PROMPT.md    # Main project context
database_schema_audit.md          # Database schema
types/database.ts                 # Generated Supabase types
lib/supabase-client.ts           # Supabase client config
components/auth-provider.tsx      # Authentication context
middleware.ts                    # Route protection
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Build Errors**
```bash
# Check TypeScript
npm run type-check

# Check linting
npm run lint

# Check build
npm run build
```

#### **Database Connection Issues**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
npx supabase status
```

#### **Authentication Issues**
```sql
-- Check user profiles
SELECT p.id, p.role, p.display_name 
FROM profiles p
LEFT JOIN talent_profiles tp ON p.id = tp.user_id
LEFT JOIN client_profiles cp ON p.id = cp.user_id;

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### **Getting Help**
1. **Check documentation** - Start with the files listed above
2. **Review error logs** - Check browser console and server logs
3. **Test with known good data** - Use test accounts
4. **Ask for help** - Provide error details and context

---

**Welcome to the TOTL Agency development team! 🎉**
