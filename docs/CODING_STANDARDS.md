# TOTL Agency - Coding Standards

**🚨 CRITICAL: Before writing any code, read these in order:**
1. **[`TYPE_SAFETY_RULES.md`](./TYPE_SAFETY_RULES.md)** - Database type safety rules (MANDATORY)
2. **[`TYPE_SAFETY_PREVENTION_SYSTEM.md`](./TYPE_SAFETY_PREVENTION_SYSTEM.md)** - How the prevention system works
3. This document - General coding standards

**Last Updated:** November 1, 2025  
**Status:** Production Ready + Type Safety Enforced

## Table of Contents
- [Supabase Authentication Security](#-supabase-authentication-security)
- [TypeScript Standards](#typescript-standards)
- [React Patterns](#react-patterns)
- [Database Patterns](#database-patterns)
- [File Organization](#file-organization)
- [Error Handling](#error-handling)

## 🔐 Supabase Authentication Security

### **Critical Security Rule: Always Use `getUser()` Instead of `getSession()`**

**❌ NEVER DO THIS - Security Risk:**
```typescript
// ❌ WRONG - Insecure! Uses cached session data
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  // This user data comes from cookies/storage and may not be authentic!
  const userId = session.user.id;
}
```

**✅ ALWAYS DO THIS - Secure:**
```typescript
// ✅ CORRECT - Authenticates with Supabase Auth server
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  // This user data is verified by contacting Supabase Auth server
  const userId = user.id;
}
```

### **Why This Matters**
- `getSession()` returns cached data from cookies/storage (potentially tampered)
- `getUser()` authenticates with Supabase Auth server (verified)
- Using `getSession()` can lead to security vulnerabilities
- Next.js will show warnings when `getSession()` is used in server components

### **When to Use Each Method**

#### **Server Components & Server Actions**
```typescript
// ✅ Use getUser() for server-side authentication
export default async function ProtectedPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Safe to use user.id
  const userId = user.id;
}
```

#### **Client Components**
```typescript
// ✅ Use getUser() for client-side authentication too
"use client";

export function ClientComponent() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
}
```

### **Migration Checklist**
When updating existing code:
- [ ] Replace `getSession()` with `getUser()`
- [ ] Update `session?.user` references to `user`
- [ ] Update `session.user.id` to `user.id`
- [ ] Test authentication still works
- [ ] Verify no security warnings in console

### **Common Patterns**

#### **Server Action Authentication**
```typescript
"use server";

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  
  // ✅ Always use getUser() in server actions
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: "Not authenticated" };
  }
  
  // Safe to use user.id
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: formData.get("name") })
    .eq("id", user.id);
}
```

#### **Page Component Authentication**
```typescript
export default async function ProtectedPage() {
  const supabase = await createSupabaseServer();
  
  // ✅ Always use getUser() in server components
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Fetch user-specific data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
}
```

---

## 🔷 TypeScript Standards

### **Type Safety**
- ✅ **Always use generated types** from `types/database.ts`
- ❌ **Never use `any` types**
- ✅ **Type all component props** with interfaces
- ✅ **Use Zod for form validation**

### **Type Definitions**
```typescript
// ✅ Good - Specific interface
interface GigCardProps {
  gig: {
    id: string;
    title: string;
    description: string;
    location: string;
    compensation: string;
    status: string;
  };
  onApply?: (gigId: string) => void;
}

// ❌ Bad - Using any
interface GigCardProps {
  gig: any;
  onApply?: any;
}
```

### **Database Types**
```typescript
// ✅ Good - Use generated types
import type { Database } from "@/types/database";

type Gig = Database['public']['Tables']['gigs']['Row'];
type Application = Database['public']['Tables']['applications']['Row'];

// ❌ Bad - Manual type definitions
interface Gig {
  id: string;
  title: string;
  // ... manual typing
}
```

## ⚛️ React Patterns

### **Next.js 15+ Compatibility**

#### **🚨 CRITICAL: Async Cookies Pattern**
**ALWAYS** use the correct pattern for cookies in Next.js 15+:

```typescript
// ✅ CORRECT - Use centralized client helpers
import { createSupabaseServerClient } from "@/lib/supabase-client";

export default async function MyPage() {
  const supabase = await createSupabaseServerClient();
  // ... rest of component
}

// ✅ CORRECT - Server actions
import { createSupabaseActionClient } from "@/lib/supabase-client";

export async function myServerAction() {
  'use server';
  const supabase = await createSupabaseActionClient();
  // ... rest of action
}

// ❌ WRONG - This causes async cookies errors
const supabase = createServerComponentClient<Database>({ cookies });
```

#### **Why This Matters**
- Next.js 15+ made cookies async for streaming compatibility
- The old `{ cookies }` pattern causes runtime errors
- Centralized helpers ensure consistency across the app

### **Component Architecture**

#### **Server Components (Data Fetching)**
```typescript
// ✅ Good - Server component for data fetching (Next.js 15+)
export default async function GigsPage() {
  // Use centralized client helper for Next.js 15+ compatibility
  const supabase = await createSupabaseServerClient();
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return <div>Configuration error</div>;
  }
  
  const { data: gigs, error } = await supabase
    .from('gigs')
    .select('id, title, description, location, compensation, status')
    .eq('status', 'active');
  
  if (error) {
    console.error('Error fetching gigs:', error);
    return <div>Error loading gigs</div>;
  }
  
  return <GigsClient gigs={gigs || []} />;
}
```

#### **Client Components (Presentational)**
```typescript
// ✅ Good - Client component for interactivity
"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";

interface GigsClientProps {
  gigs: Gig[];
}

export function GigsClient({ gigs }: GigsClientProps) {
  const [selectedGig, setSelectedGig] = useState<string | null>(null);
  
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
      {gigs.map(gig => (
        <GigCard 
          key={gig.id} 
          gig={gig}
          isSelected={selectedGig === gig.id}
          onSelect={() => setSelectedGig(gig.id)}
        />
      ))}
    </div>
  );
}
```

### **State Management**
```typescript
// ✅ Good - Local state for component-specific data
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<Gig[]>([]);
```

### **Event Handling**
```typescript
// ✅ Good - Proper event typing
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    
    // Validate data
    if (!title || !description) {
      throw new Error('Title and description are required');
    }
    
    // Submit data
    await createGig({ title, description });
    
  } catch (error) {
    setError(error instanceof Error ? error.message : 'An error occurred');
  } finally {
    setLoading(false);
  }
};
```

## 🗄️ Database Patterns

### **⚠️ CRITICAL: Query Pattern Guidelines**

#### **Use `.maybeSingle()` for Profile Queries**

**Problem:** Using `.single()` on profile queries causes 406 "Not Acceptable" errors when profiles don't exist, breaking error handling and preventing proper Sentry tracking.

**Solution:** Always use `.maybeSingle()` when querying profiles, talent_profiles, or client_profiles that might not exist.

**✅ Use `.maybeSingle()` for:**
- Profile queries (profiles, talent_profiles, client_profiles)
- Any query where the record might not exist
- Authentication/authorization checks
- User data that may be missing

**✅ Use `.single()` for:**
- Queries where the record MUST exist (e.g., after a successful insert)
- Internal operations where missing data indicates a bug
- Admin operations with guaranteed data

**Example:**
```typescript
// ✅ CORRECT - Use maybeSingle() for profile queries
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("role, display_name")
  .eq("id", user.id)
  .maybeSingle();

// Handle missing profile gracefully
// With maybeSingle(), no rows returns null data (not an error)
if (!profile || profileError) {
  // Profile doesn't exist - create it or redirect
  return { error: "Profile not found" };
}

// ❌ WRONG - Using .single() causes 406 errors
const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single(); // This throws 406 if profile doesn't exist!
```

**See:** `docs/AUTH_STRATEGY.md` for complete query pattern best practices.

### **Supabase Client Usage**

#### **Client-Side**
```typescript
// ✅ Good - Proper client setup
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";

const supabase = createClientComponentClient<Database>();

// ✅ Good - Specific field selection
const { data, error } = await supabase
  .from('gigs')
  .select('id, title, description, location, compensation')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// ❌ Bad - Selecting all fields
const { data, error } = await supabase
  .from('gigs')
  .select('*'); // Don't select all fields
```

#### **Server-Side (Next.js 15+)**
```typescript
// ✅ Good - Server component setup (Next.js 15+)
import { createSupabaseServerClient } from "@/lib/supabase-client";

const supabase = await createSupabaseServerClient();

// ✅ Good - Force dynamic rendering for auth-dependent pages
export const dynamic = "force-dynamic";
```

### **Error Handling**
```typescript
// ✅ Good - Comprehensive error handling
try {
  const { data, error } = await supabase
    .from('gigs')
    .select('*')
    .eq('status', 'active');
    
  if (error) {
    console.error('Database error:', error);
    throw new Error(`Failed to fetch gigs: ${error.message}`);
  }
  
  return data || [];
  
} catch (error) {
  console.error('Error in fetchGigs:', error);
  
  // Log to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // logError(error);
  }
  
  return [];
}
```

### **RLS-Aware Queries**
```typescript
// ✅ Good - RLS-aware querying
const { data: userGigs, error } = await supabase
  .from('gigs')
  .select('*')
  .eq('client_id', user.id) // RLS will filter by user
  .order('created_at', { ascending: false });

// ✅ Good - Joins with RLS
const { data: applications, error } = await supabase
  .from('applications')
  .select(`
    *,
    gigs!inner(client_id),
    talent_profiles(first_name, last_name, location)
  `)
  .eq('gigs.client_id', user.id);
```

## 📁 File Organization

### **Directory Structure**
```
app/
├── (auth)/              # Authentication pages
├── talent/              # Talent-specific pages
├── client/              # Client-specific pages
├── admin/               # Admin pages
└── api/                 # API routes

components/
├── ui/                  # shadcn/ui components
├── forms/               # Form components
└── layout/              # Layout components

lib/
├── supabase-client.ts   # Supabase client config
├── utils.ts             # Utility functions
└── validations.ts       # Zod schemas

types/
└── database.ts          # Generated Supabase types
```

### **File Naming**
```typescript
// ✅ Good - Descriptive names
gig-card.tsx
talent-profile-form.tsx
client-dashboard.tsx
application-list.tsx

// ❌ Bad - Unclear names
card.tsx
form.tsx
dashboard.tsx
list.tsx
```

### **Component Organization**
```typescript
// ✅ Good - Logical component structure
// components/gig-card.tsx
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface GigCardProps {
  gig: Gig;
  onApply?: (gigId: string) => void;
}

export function GigCard({ gig, onApply }: GigCardProps) {
  const [isApplying, setIsApplying] = useState(false);
  
  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApply?.(gig.id);
    } finally {
      setIsApplying(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <h3>{gig.title}</h3>
      </CardHeader>
      <CardContent>
        <p>{gig.description}</p>
        <button 
          onClick={handleApply}
          disabled={isApplying}
        >
          {isApplying ? 'Applying...' : 'Apply'}
        </button>
      </CardContent>
    </Card>
  );
}
```

## ⚠️ Error Handling

### **Form Validation**
```typescript
// ✅ Good - Zod validation
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const gigSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  compensation: z.string().min(1, "Compensation is required"),
});

type GigFormValues = z.infer<typeof gigSchema>;

export function GigForm() {
  const form = useForm<GigFormValues>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      compensation: "",
    },
  });
  
  const onSubmit = async (data: GigFormValues) => {
    try {
      await createGig(data);
      form.reset();
    } catch (error) {
      console.error('Error creating gig:', error);
    }
  };
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### **API Error Handling**
```typescript
// ✅ Good - Comprehensive API error handling
const createGig = async (gigData: GigFormValues) => {
  try {
    const { data, error } = await supabase
      .from('gigs')
      .insert([gigData])
      .select()
      .single();
      
    if (error) {
      if (error.code === '23505') {
        throw new Error('A gig with this title already exists');
      }
      if (error.code === '23503') {
        throw new Error('Invalid client reference');
      }
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('Error creating gig:', error);
    throw error; // Re-throw for component handling
  }
};
```

### **Component Error Boundaries**
```typescript
// ✅ Good - Error boundary for components
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600">
            Something went wrong
          </h2>
          <p className="text-gray-600 mt-2">
            Please refresh the page and try again
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

**Follow these standards to maintain code quality and consistency across the TOTL Agency platform.**
