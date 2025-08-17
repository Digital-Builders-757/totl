# 05 - Coding Standards & Best Practices

## 🎯 Core Principles

### **Prime Directives**
1. **Think hard, answer short**: Deep analysis, concise implementation
2. **Type safety first**: No `any`, use generated database types
3. **RLS-aware always**: Row Level Security guides all database queries
4. **Explicit columns only**: Never use `select('*')`
5. **Server-first architecture**: Data fetching in Server Components

## 🏗️ Architecture Patterns

### **Component Architecture**
```typescript
// ✅ Server Component (data fetching)
async function GigList() {
  const supabase = await createSupabaseServerClient();
  const { data: gigs } = await supabase
    .from('gigs')
    .select('id,title,location,status,client_id')
    .eq('status', 'active');
  
  return <GigListClient gigs={gigs} />;
}

// ✅ Client Component (interactivity)
'use client';
interface GigListClientProps {
  gigs: Gig[];
}
function GigListClient({ gigs }: GigListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  // Interactive UI logic
}
```

### **Server Actions Pattern**
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { createSupabaseActionClient } from '@/lib/supabase-client';

export async function createGig(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseActionClient();
  
  // 1. Validate input with Zod
  const result = GigSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
  });
  
  if (!result.success) {
    return { error: 'Invalid input data' };
  }
  
  // 2. Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Authentication required' };
  }
  
  // 3. Database operation with explicit columns
  const { data, error } = await supabase
    .from('gigs')
    .insert([{ ...result.data, client_id: user.id }])
    .select('id,title,status')
    .single();
  
  if (error) {
    return { error: 'Failed to create gig' };
  }
  
  // 4. Revalidate and return success
  revalidatePath('/admin/gigs');
  return { success: true, data };
}
```

## 🔐 Database Patterns

### **Query Standards**
```typescript
// ✅ Explicit column selection with helpers
import { selectGig, selectApplication } from '@/lib/selects';

const { data: gigs } = await supabase
  .from('gigs')
  .select(selectGig)
  .eq('client_id', userId)
  .order('created_at', { ascending: false });

// ✅ Safe query wrapper
import { safe, safeOptional } from '@/lib/safe-query';

const gigs = await safe(
  supabase.from('gigs').select(selectGig).eq('status', 'active')
);

const profile = await safeOptional(
  supabase.from('profiles').select(selectProfile).eq('id', userId).single()
);
```

### **RLS-Aware Queries**
```typescript
// ✅ Policy-compliant: Users see only their data
const { data: applications } = await supabase
  .from('applications')
  .select('id,gig_id,status,created_at')
  .eq('talent_id', user.id); // RLS policy enforces this

// ✅ Admin override: Explicit role check + admin policy
const { data: allGigs } = await supabase
  .from('gigs')
  .select(selectGig); // Admin RLS policy allows viewing all

// ❌ Never bypass RLS with service role on client
```

## 📝 TypeScript Standards

### **Type Definitions**
```typescript
// ✅ Use generated database types
import type { Database } from '@/types/database';

type Gig = Database['public']['Tables']['gigs']['Row'];
type GigInsert = Database['public']['Tables']['gigs']['Insert'];
type GigUpdate = Database['public']['Tables']['gigs']['Update'];

// ✅ Component prop interfaces
interface GigCardProps {
  gig: Gig;
  onApply?: (gigId: string) => void;
  showActions?: boolean;
}

// ✅ Server Action return types
interface ActionResult<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}
```

### **Type Guards & Validation**
```typescript
// ✅ Zod schemas for validation
import { z } from 'zod';

const GigSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10),
  location: z.string().min(2),
  compensation: z.number().positive(),
});

type GigFormData = z.infer<typeof GigSchema>;

// ✅ Type assertion utilities
function assertUserId(user: { id?: string }): asserts user is { id: string } {
  if (!user.id) throw new Error('Missing user ID');
}
```

## 🎨 Component Standards

### **Component Structure**
```typescript
'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/database';

// 1. Types at top
type Gig = Database['public']['Tables']['gigs']['Row'];

interface GigListProps {
  gigs: Gig[];
  onGigSelect?: (gig: Gig) => void;
}

// 2. Component with proper memo when needed
export const GigList = React.memo(function GigList({
  gigs,
  onGigSelect
}: GigListProps) {
  // 3. State declarations
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  
  // 4. Memoized calculations
  const filteredGigs = useMemo(() => {
    return gigs.filter(gig => 
      gig.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [gigs, searchTerm]);
  
  // 5. Event handlers with useCallback
  const handleGigClick = useCallback((gig: Gig) => {
    onGigSelect?.(gig);
  }, [onGigSelect]);
  
  // 6. Early returns
  if (gigs.length === 0) {
    return <EmptyState message="No gigs available" />;
  }
  
  // 7. Render
  return (
    <div className="space-y-4">
      {/* Component JSX */}
    </div>
  );
});
```

### **Performance Optimizations**
```typescript
// ✅ Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const AdminCharts = dynamic(() => import('./admin-charts'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

// ✅ Memoization for expensive calculations
const expensiveData = useMemo(() => {
  return gigs.reduce((acc, gig) => {
    // Heavy calculation
    return acc;
  }, {});
}, [gigs]);

// ✅ Callback memoization for prop drilling
const handleAction = useCallback((id: string) => {
  // Action logic
}, [dependency]);
```

## 🔄 Form Handling

### **Form Patterns with Server Actions**
```typescript
// Server Action
'use server';
export async function updateProfile(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  // Validation and processing
}

// Client Component
'use client';
import { useFormState } from 'react-dom';

export function ProfileForm() {
  const [state, formAction] = useFormState(updateProfile, { success: false });
  
  return (
    <form action={formAction}>
      <input name="display_name" required />
      <SubmitButton />
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
    </form>
  );
}
```

### **React Hook Form Integration**
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function GigForm() {
  const form = useForm<GigFormData>({
    resolver: zodResolver(GigSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });
  
  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    
    const result = await createGig(formData);
    if (result.error) {
      // Handle error
    }
  });
  
  return (
    <form onSubmit={onSubmit}>
      {/* Form fields with register */}
    </form>
  );
}
```

## 🎯 Error Handling

### **Error Boundaries**
```typescript
'use client';
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} />;
    }
    
    return this.props.children;
  }
}
```

### **API Error Handling**
```typescript
// Route Handler
export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json({ data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Server Action Error Handling
export async function createGig(formData: FormData): Promise<ActionResult> {
  try {
    // Process formData
    return { success: true, data: result };
  } catch (error) {
    console.error('Create gig error:', error);
    return { error: 'Failed to create gig' };
  }
}
```

## 🔒 Security Standards

### **Input Validation**
```typescript
// ✅ Server-side validation (never trust client)
export async function updateGig(formData: FormData) {
  const result = GigUpdateSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
  });
  
  if (!result.success) {
    return { error: 'Invalid input' };
  }
  
  // Continue with validated data
}

// ✅ Sanitize user inputs
import DOMPurify from 'isomorphic-dompurify';

const cleanDescription = DOMPurify.sanitize(userInput);
```

### **Authentication Checks**
```typescript
// ✅ Server Action auth check
export async function adminAction(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Authentication required' };
  }
  
  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    return { error: 'Admin access required' };
  }
  
  // Continue with admin operation
}
```

## 📱 Responsive Design

### **Tailwind CSS Patterns**
```typescript
// ✅ Mobile-first responsive design
<div className="
  w-full 
  px-4 sm:px-6 lg:px-8 
  py-4 sm:py-6 lg:py-8
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 
  gap-4 md:gap-6 lg:gap-8
">
  {/* Content */}
</div>

// ✅ Responsive typography
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Title
</h1>

// ✅ Conditional rendering for mobile
<div className="block md:hidden">Mobile content</div>
<div className="hidden md:block">Desktop content</div>
```

## ♿ Accessibility Standards

### **ARIA and Semantic HTML**
```typescript
// ✅ Proper semantic structure
<main role="main">
  <section aria-labelledby="gigs-heading">
    <h2 id="gigs-heading">Available Gigs</h2>
    <div role="list">
      {gigs.map(gig => (
        <article key={gig.id} role="listitem">
          <h3>{gig.title}</h3>
          <button
            onClick={() => handleApply(gig.id)}
            aria-label={`Apply to ${gig.title} position`}
          >
            Apply
          </button>
        </article>
      ))}
    </div>
  </section>
</main>

// ✅ Form accessibility
<form>
  <label htmlFor="gig-title">Gig Title</label>
  <input
    id="gig-title"
    name="title"
    required
    aria-describedby="title-help"
  />
  <div id="title-help">Enter a descriptive title for your gig</div>
</form>
```

## 🧪 Code Quality Enforcement

### **ESLint Configuration**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### **Pre-commit Checks**
```bash
# Required to pass before commit
npm run lint           # ESLint validation
npm run typecheck      # TypeScript checking
npm run format         # Prettier formatting
npm run build          # Build verification
```

## 📋 Code Review Checklist

### **Before Submitting PR**
- [ ] No `any` types used
- [ ] Database queries use explicit column selection
- [ ] RLS policies respected in all queries
- [ ] Server Actions used for all mutations
- [ ] Error handling implemented
- [ ] TypeScript strict mode compliance
- [ ] Accessibility attributes added
- [ ] Performance optimizations applied
- [ ] Tests written (if applicable)
- [ ] Documentation updated

### **Security Review**
- [ ] Input validation on server side
- [ ] Authentication checks in Server Actions
- [ ] No service role key exposure to client
- [ ] Sensitive data not logged
- [ ] CORS properly configured

---

**Code Quality Score**: 9/10 (with these standards)
**Maintenance Overhead**: Low (automated tooling)
**Learning Curve**: Medium (comprehensive but well-documented)
**Last Updated**: 2025-01-17

*These standards ensure maintainable, secure, and performant code across the TOTL Agency platform.*