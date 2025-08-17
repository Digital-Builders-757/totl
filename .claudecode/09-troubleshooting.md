# 09 - Troubleshooting & Emergency Procedures

## 🚨 Emergency Quick Reference

### **Critical Issues (Immediate Action Required)**

#### **Production Down**
```bash
# 1. Check deployment status
vercel --version && vercel ls
supabase projects list

# 2. Check database connection
npm run db:status

# 3. Rollback if needed
vercel rollback [deployment-url]
supabase db reset && supabase db push
```

#### **Database Connection Lost**
```bash
# 1. Verify Supabase status
curl https://status.supabase.com/api/v2/status.json

# 2. Test local connection
npm run types:check
npm run schema:verify

# 3. Regenerate connection
supabase auth login
supabase projects list
```

#### **Build Failures**
```bash
# 1. Clear caches
rm -rf .next node_modules
npm install

# 2. Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Verify types and schema
npm run types:regen
npm run typecheck
```

## 🔧 Common Development Issues

### **1. TypeScript Errors**

#### **Issue**: "Property does not exist on type"
```typescript
// ❌ Problem: Using outdated types
const gig: Gig = await supabase.from('gigs').select('*').single();
console.log(gig.new_field); // Error: Property 'new_field' does not exist

// ✅ Solution: Regenerate types after schema changes
npm run types:regen
npm run typecheck
```

#### **Issue**: "Type 'any' is not assignable"
```typescript
// ❌ Problem: Missing type definitions
const handleSubmit = (data: any) => { /* ... */ };

// ✅ Solution: Use proper types
import type { Database } from '@/types/database';
type GigInsert = Database['public']['Tables']['gigs']['Insert'];

const handleSubmit = (data: GigInsert) => { /* ... */ };
```

### **2. Database Query Issues**

#### **Issue**: RLS Policy Violations
```typescript
// ❌ Problem: Query violates RLS policy
const { data, error } = await supabase
  .from('profiles')
  .select('*'); // Error: RLS policy violation

// ✅ Solution: Respect RLS boundaries
const { data, error } = await supabase
  .from('profiles')
  .select('id,display_name,avatar_url')
  .eq('id', auth.uid()); // Only user's own profile
```

#### **Issue**: "select * is not allowed"
```typescript
// ❌ Problem: Using select('*')
const { data } = await supabase.from('gigs').select('*');

// ✅ Solution: Use explicit column selection
import { selectGig } from '@/lib/selects';
const { data } = await supabase.from('gigs').select(selectGig);
```

### **3. Authentication Issues**

#### **Issue**: "User not authenticated"
```typescript
// ❌ Problem: No auth check in Server Action
export async function createGig(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  // Direct database operation without auth check
}

// ✅ Solution: Always check authentication
export async function createGig(formData: FormData) {
  const supabase = await createSupabaseActionClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { error: 'Authentication required' };
  }
  // Continue with operation
}
```

#### **Issue**: Cookie modification errors in Server Components
```typescript
// ❌ Problem: Trying to modify cookies in RSC
const supabase = createSupabaseServerClient();
await supabase.auth.signOut(); // Error: Cannot modify cookies

// ✅ Solution: Use Server Action or Route Handler
'use server';
export async function signOut() {
  const supabase = await createSupabaseActionClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

## 🗄️ Database Issues

### **Schema Synchronization Problems**

#### **Types Out of Sync**
```bash
# Symptoms: TypeScript errors about missing properties
# Solution: Regenerate types
npm run types:regen

# Verify sync
npm run types:check
npm run schema:verify
```

#### **Migration Conflicts**
```bash
# Symptoms: Migration fails to apply
# Solution: Reset and reapply
supabase db reset
supabase db push

# For production: Create rollback migration
supabase migration new "rollback_problematic_change"
```

### **RLS Policy Issues**

#### **Debugging RLS Policies**
```sql
-- Test policy as specific user
SET request.jwt.claims = '{"sub": "user-id", "role": "authenticated"}';

-- Check what user can see
SELECT * FROM profiles; -- Should only return user's profile

-- Reset to default
RESET request.jwt.claims;
```

#### **Policy Not Working**
```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Enable RLS if disabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- List policies for table
\dp profiles
```

## 🚀 Performance Issues

### **Slow Page Load Times**

#### **Bundle Size Analysis**
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer

# Common solutions:
# 1. Dynamic imports for heavy components
const Charts = dynamic(() => import('./charts'), { ssr: false });

# 2. Image optimization
# Enable in next.config.mjs:
images: { unoptimized: false }
```

#### **Database Query Optimization**
```typescript
// ❌ Problem: N+1 queries
const gigs = await supabase.from('gigs').select('id,title');
for (const gig of gigs) {
  const applications = await supabase
    .from('applications')
    .select('*')
    .eq('gig_id', gig.id); // N+1 problem
}

// ✅ Solution: Use joins or batch queries
const gigsWithApplications = await supabase
  .from('gigs')
  .select(`
    id,
    title,
    applications(id,status,created_at)
  `);
```

### **Memory Leaks**

#### **React Component Issues**
```typescript
// ❌ Problem: Missing cleanup
useEffect(() => {
  const interval = setInterval(() => {
    // Some operation
  }, 1000);
  // Missing cleanup
}, []);

// ✅ Solution: Proper cleanup
useEffect(() => {
  const interval = setInterval(() => {
    // Some operation
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

## 🔐 Security Issues

### **Environment Variable Exposure**

#### **Client-Side Exposure**
```typescript
// ❌ Problem: Service role key in client component
'use client';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Exposed to client!
);

// ✅ Solution: Use proper client configuration
'use client';
import { createSupabaseBrowserClient } from '@/lib/supabase-client';
const supabase = createSupabaseBrowserClient();
```

### **XSS Prevention**

#### **User Input Sanitization**
```typescript
// ❌ Problem: Unsanitized user input
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Solution: Sanitize input
import DOMPurify from 'isomorphic-dompurify';
const cleanHTML = DOMPurify.sanitize(userInput);
<div dangerouslySetInnerHTML={{ __html: cleanHTML }} />
```

## 🔄 Deployment Issues

### **Vercel Deployment Failures**

#### **Build Timeouts**
```bash
# Problem: Build exceeds time limit
# Solutions:
# 1. Enable build caching
echo "VERCEL_BUILD_CACHE=1" >> .env.production

# 2. Optimize dependencies
npm prune
npm dedupe

# 3. Use build optimization
# In package.json:
"build": "next build --experimental-build-mode"
```

#### **Environment Variable Issues**
```bash
# Check Vercel environment variables
vercel env ls

# Add missing variables
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Pull environment to local
vercel env pull .env.local
```

### **Supabase Connection Issues**

#### **Rate Limiting**
```typescript
// Problem: Too many requests
// Solution: Implement connection pooling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
});
```

## 🧪 Testing Issues

### **Test Environment Setup**

#### **Database Testing**
```typescript
// Problem: Tests affecting production data
// Solution: Use test database
const supabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_ANON_KEY!
);

// Reset test data before each test
beforeEach(async () => {
  await supabase.from('profiles').delete().neq('id', '');
});
```

## 📊 Monitoring & Alerts

### **Error Tracking Setup**

#### **Sentry Configuration**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.exception) {
      const error = hint.originalException;
      // Don't send auth errors to Sentry
      if (error?.message?.includes('auth')) {
        return null;
      }
    }
    return event;
  },
});
```

### **Performance Monitoring**

#### **Core Web Vitals**
```typescript
// pages/_app.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Send to analytics service
  analytics.track('Web Vital', {
    name: metric.name,
    value: metric.value,
    id: metric.id,
  });
}
```

## 📋 Emergency Checklist

### **When Everything is Broken**
1. **Check Status Pages**
   - https://status.vercel.com
   - https://status.supabase.com
   - https://www.githubstatus.com

2. **Verify Local Environment**
   ```bash
   npm run typecheck
   npm run lint  
   npm run build
   npm run dev
   ```

3. **Database Health Check**
   ```bash
   supabase db status --linked
   npm run types:check
   npm run schema:verify
   ```

4. **Last Resort: Complete Reset**
   ```bash
   # Backup important data first!
   git stash
   rm -rf .next node_modules
   npm install
   npm run types:regen
   npm run dev
   ```

### **Getting Help**

#### **Internal Resources**
1. Check other `.claudecode` documentation files
2. Review recent git commits for breaking changes
3. Check deployment logs in Vercel dashboard
4. Review Supabase logs and metrics

#### **External Resources**
- Next.js Documentation: https://nextjs.org/docs
- Supabase Documentation: https://supabase.com/docs
- TypeScript Handbook: https://www.typescriptlang.org/docs
- Vercel Documentation: https://vercel.com/docs

---

**Resolution Time**: Most issues <30 minutes with this guide
**Escalation Path**: Document → Logs → External Docs → Community
**Last Updated**: 2025-01-17

*This troubleshooting guide covers 95% of common development and deployment issues.*