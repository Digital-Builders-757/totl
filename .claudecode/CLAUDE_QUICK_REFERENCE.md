# Claude Quick Reference - TOTL Agency

## 🚀 Essential Commands & Patterns

### **Critical Rules** ⚠️
1. **Think hard, answer short** - Deep analysis, concise solutions
2. **Always update documentation** when making code changes
3. **Never use** `select('*')` - always explicit columns
4. **RLS-aware** - respect Row Level Security in all queries
5. **Server Actions only** for database mutations

## 📋 Daily Checklist

### **Before Any Code Change**
- [ ] Read `05-coding-standards.md` patterns
- [ ] Check `11-security-checklist.md` requirements
- [ ] Verify database schema in `02-database-schema.md`
- [ ] Review troubleshooting in `09-troubleshooting.md`

### **After Code Changes**
- [ ] Update `12-project-evolution.md` changelog
- [ ] Update relevant documentation files
- [ ] Run `npm run lint && npm run typecheck`
- [ ] Test RLS policies work correctly

## 🔧 Copy-Paste Code Patterns

### **Server Component Data Fetching**
```typescript
async function DataComponent() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('table_name')
    .select('id,column1,column2') // Explicit columns
    .eq('status', 'active');
  
  if (error) {
    console.error('Query error:', error);
    return <ErrorComponent />;
  }
  
  return <ClientComponent data={data} />;
}
```

### **Server Action Pattern**
```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { createSupabaseActionClient } from '@/lib/supabase-client';

export async function actionName(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseActionClient();
  
  // 1. Auth check
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Authentication required' };
  }
  
  // 2. Validate input
  const data = {
    field: formData.get('field'),
  };
  
  // 3. Database operation
  const { error: dbError } = await supabase
    .from('table')
    .insert([data]);
  
  if (dbError) {
    return { error: 'Operation failed' };
  }
  
  // 4. Revalidate and return
  revalidatePath('/path');
  return { success: true };
}
```

### **Client Component with Optimization**
```typescript
'use client';
import React, { useState, useMemo, useCallback } from 'react';

const ComponentName = React.memo(function ComponentName({ 
  data, 
  onAction 
}: Props) {
  const [state, setState] = useState('');
  
  const memoizedData = useMemo(() => {
    return data.filter(/* expensive operation */);
  }, [data]);
  
  const handleAction = useCallback((id: string) => {
    onAction?.(id);
  }, [onAction]);
  
  return <div>{/* Component JSX */}</div>;
});
```

## 🗄️ Database Quick Commands

### **Schema Operations**
```bash
# Create migration
supabase migration new "description"

# Test locally
supabase db reset && supabase db push

# Regenerate types
npm run types:regen

# Verify schema
npm run schema:verify

# Deploy to production
supabase db push --linked
```

### **Query Helpers**
```typescript
// Use predefined selects
import { selectGig, selectProfile } from '@/lib/selects';

// Safe query wrapper
import { safe, safeOptional } from '@/lib/safe-query';
const data = await safe(supabaseQuery);
const optionalData = await safeOptional(supabaseQuery);
```

## 🔐 Security Quick Checks

### **RLS Policy Testing**
```sql
-- Test as specific user
SET request.jwt.claims = '{"sub": "user-id", "role": "authenticated"}';
SELECT * FROM table_name; -- Verify results
RESET request.jwt.claims;
```

### **Input Validation**
```typescript
import { z } from 'zod';

const Schema = z.object({
  field: z.string().min(2).max(100),
});

const result = Schema.safeParse(input);
if (!result.success) {
  return { error: 'Invalid input' };
}
```

## 🎯 Performance Quick Wins

### **Dynamic Imports**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <Skeleton />,
  ssr: false,
});
```

### **Image Optimization**
```typescript
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={400}
  height={300}
  priority={isAboveFold}
/>
```

## 🚨 Emergency Procedures

### **Build Broken**
```bash
rm -rf .next node_modules
npm install
npm run types:regen
npm run build
```

### **Database Issues**
```bash
supabase db status --linked
npm run schema:verify
supabase db reset && supabase db push
```

### **Auth Problems**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
npm run dev
# Navigate to /debug page
```

## 📚 Documentation Update Rules

### **Always Update These Files**
- `12-project-evolution.md` - Add to changelog
- Relevant technical documentation
- `PROJECT_DESCRIPTION.md` if architecture changes

### **Update Template**
```markdown
### [Date] - [Type]: Description
#### Changed
- What was modified
#### Impact  
- Performance/security/breaking changes
#### Documentation Updated
- [x] List of files updated
```

## 🎨 Component Patterns

### **Form with Server Action**
```typescript
// Server Action
'use server';
export async function formAction(formData: FormData) {
  // Validation, auth check, database operation
}

// Component
export function FormComponent() {
  return (
    <form action={formAction}>
      <input name="field" required />
      <SubmitButton />
    </form>
  );
}
```

### **Error Boundary**
```typescript
'use client';
export class ErrorBoundary extends React.Component {
  // Standard error boundary implementation
}

// Usage
<ErrorBoundary fallback={ErrorFallback}>
  <Component />
</ErrorBoundary>
```

## 🔍 Debugging Commands

### **Development Health Check**
```bash
npm run typecheck && echo "✅ TypeScript" || echo "❌ TypeScript"
npm run lint && echo "✅ ESLint" || echo "❌ ESLint"
npm run build && echo "✅ Build" || echo "❌ Build"
npm run schema:verify && echo "✅ Schema" || echo "❌ Schema"
```

### **Performance Analysis**
```bash
ANALYZE=true npm run build
npx lighthouse http://localhost:3000
```

---

**Last Updated**: 2025-01-17
**Keep This Handy**: Pin this file for daily reference
**Critical Files**: Always check security checklist before changes

*This quick reference covers 90% of daily development tasks for TOTL Agency.*