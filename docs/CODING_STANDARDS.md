# TOTL Agency - Coding Standards

**Last Updated:** July 23, 2025  
**Status:** Production Ready

## Table of Contents
- [TypeScript Standards](#typescript-standards)
- [React Patterns](#react-patterns)
- [Database Patterns](#database-patterns)
- [File Organization](#file-organization)
- [Naming Conventions](#naming-conventions)
- [Error Handling](#error-handling)

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

### **Component Architecture**

#### **Server Components (Data Fetching)**
```typescript
// ✅ Good - Server component for data fetching
export default async function GigsPage() {
  const supabase = createServerComponentClient<Database>({ cookies });
  
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

// ✅ Good - Use React Query for server state (if needed)
const { data: gigs, isLoading, error } = useQuery({
  queryKey: ['gigs'],
  queryFn: fetchGigs,
});
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

#### **Server-Side**
```typescript
// ✅ Good - Server component setup
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabase = createServerComponentClient<Database>({ cookies });

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

## 🏷️ Naming Conventions

### **Variables and Functions**
```typescript
// ✅ Good - Descriptive names
const fetchUserGigs = async (userId: string) => { /* ... */ };
const handleGigApplication = async (gigId: string) => { /* ... */ };
const isGigActive = (gig: Gig) => gig.status === 'active';

// ❌ Bad - Unclear names
const fetch = async (id: string) => { /* ... */ };
const handle = async (id: string) => { /* ... */ };
const check = (g: Gig) => g.status === 'active';
```

### **Database Fields**
```typescript
// ✅ Good - Consistent naming
interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  application_deadline: string; // snake_case for DB
  created_at: string;
  updated_at: string;
}

// ❌ Bad - Inconsistent naming
interface Gig {
  id: string;
  title: string;
  description: string;
  location: string;
  compensation: string;
  applicationDeadline: string; // camelCase mixed with snake_case
  createdAt: string;
  updatedAt: string;
}
```

### **CSS Classes**
```typescript
// ✅ Good - Tailwind classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
  <h2 className="text-lg font-semibold text-gray-900">Gig Title</h2>
  <span className="text-sm text-gray-500">Location</span>
</div>

// ❌ Bad - Custom CSS classes
<div className="gig-card">
  <h2 className="gig-title">Gig Title</h2>
  <span className="gig-location">Location</span>
</div>
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
