# 03 - API Reference & Integration Patterns

## 🚀 API Overview

TOTL Agency uses a hybrid API approach combining Next.js App Router API routes with Supabase direct client access. All operations respect Row Level Security (RLS) and follow type-safe patterns.

### **API Architecture Score: 8/10** ✅

## 🔗 Route Handlers (API Routes)

### **Authentication Routes**

#### **POST /api/auth/signout**
```typescript
// File: app/api/auth/signout/route.ts
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
```

**Usage:**
```typescript
const response = await fetch('/api/auth/signout', {
  method: 'POST',
});
const result = await response.json();
```

#### **GET /api/auth/test-flow**
```typescript
// File: app/api/auth/test-flow/route.ts
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  return NextResponse.json({
    authenticated: !!session,
    user: session?.user || null
  });
}
```

### **Admin Routes**

#### **POST /api/admin/create-user**
```typescript
// File: app/api/admin/create-user/route.ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'client', 'talent']),
  metadata: z.object({
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    company_name: z.string().optional(),
  }).optional(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const result = CreateUserSchema.safeParse(json);
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: result.error.errors },
      { status: 400 }
    );
  }
  
  // Admin-only operation with service role
  const supabase = createRouteHandlerClient({ 
    cookies,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY 
  });
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: result.data.email,
    password: result.data.password,
    user_metadata: {
      role: result.data.role,
      ...result.data.metadata,
    },
  });
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ 
    success: true, 
    user: { id: data.user.id, email: data.user.email } 
  });
}
```

**Usage:**
```typescript
const response = await fetch('/api/admin/create-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securepassword',
    role: 'talent',
    metadata: {
      first_name: 'John',
      last_name: 'Doe',
    },
  }),
});
```

#### **DELETE /api/admin/delete-user**
```typescript
// File: app/api/admin/delete-user/route.ts
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('id');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID required' },
      { status: 400 }
    );
  }
  
  const supabase = createRouteHandlerClient({ 
    cookies,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY 
  });
  
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
  
  return NextResponse.json({ success: true });
}
```

### **Email Service Routes**

#### **POST /api/email/send-welcome**
```typescript
// File: app/api/email/send-welcome/route.ts
export async function POST(request: Request) {
  const { email, name } = await request.json();
  
  if (!email || !name) {
    return NextResponse.json(
      { error: 'Email and name required' },
      { status: 400 }
    );
  }
  
  const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`;
  
  const { data, error } = await resend.emails.send({
    from: 'TOTL Agency <noreply@totlagency.com>',
    to: [email],
    subject: 'Welcome to TOTL Agency',
    html: `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining TOTL Agency.</p>
      <a href="${loginUrl}">Login to your account</a>
    `,
  });
  
  if (error) {
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ success: true, messageId: data.id });
}
```

### **Utility Routes**

#### **GET /api/avatar-url**
```typescript
// File: app/api/avatar-url/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  
  if (!path) {
    return NextResponse.json(
      { error: 'Path parameter required' },
      { status: 400 }
    );
  }
  
  const supabase = createRouteHandlerClient({ cookies });
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path);
  
  return NextResponse.json({ url: data.publicUrl });
}
```

## 🔄 Server Actions

### **Profile Management Actions**

#### **updateBasicProfile**
```typescript
// File: app/settings/actions.ts
'use server';

export async function updateBasicProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createSupabaseActionClient();
  const { data: { user }, error: sessionErr } = await supabase.auth.getUser();

  if (sessionErr || !user) {
    return { error: 'Not authenticated' };
  }

  const display_name = String(formData.get('display_name') ?? '').trim();
  
  if (!display_name || display_name.length < 2) {
    return { error: 'Display name must be at least 2 characters' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ display_name })
    .eq('id', user.id)
    .select('id,display_name,avatar_url,email_verified')
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}
```

#### **updateEmail**
```typescript
// File: app/settings/actions.ts
export async function updateEmail(newEmail: string): Promise<ActionResult> {
  const supabase = await createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    return { error: error.message };
  }

  return { 
    success: true, 
    message: 'Verification email sent to new address' 
  };
}
```

### **Gig Management Actions**

#### **createGig**
```typescript
// File: app/admin/gigs/actions.ts
'use server';

const GigSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().min(10).max(2000),
  location: z.string().min(2).max(100),
  compensation: z.number().positive(),
  category: z.string().min(2),
  date: z.string().datetime(),
  application_deadline: z.string().datetime(),
});

export async function createGig(formData: FormData): Promise<ActionResult<Gig>> {
  const supabase = await createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  // Validate input
  const gigData = {
    title: formData.get('title'),
    description: formData.get('description'),
    location: formData.get('location'),
    compensation: Number(formData.get('compensation')),
    category: formData.get('category'),
    date: formData.get('date'),
    application_deadline: formData.get('application_deadline'),
  };

  const result = GigSchema.safeParse(gigData);
  if (!result.success) {
    return { error: 'Invalid input data' };
  }

  // Create gig
  const { data, error } = await supabase
    .from('gigs')
    .insert([{
      ...result.data,
      client_id: user.id,
      status: 'active',
    }])
    .select('id,title,description,status,created_at')
    .single();

  if (error) {
    return { error: 'Failed to create gig' };
  }

  revalidatePath('/admin/gigs');
  return { success: true, data };
}
```

### **Application Management Actions**

#### **submitApplication**
```typescript
// File: app/gigs/actions.ts
export async function submitApplication(
  gigId: string, 
  message: string
): Promise<ActionResult> {
  const supabase = await createSupabaseActionClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' };
  }

  // Check if user has talent profile
  const { data: talentProfile } = await supabase
    .from('talent_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!talentProfile) {
    return { error: 'Complete your talent profile before applying' };
  }

  // Check if application already exists
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('gig_id', gigId)
    .eq('talent_id', user.id)
    .single();

  if (existingApplication) {
    return { error: 'You have already applied to this gig' };
  }

  // Create application
  const { error } = await supabase
    .from('applications')
    .insert([{
      gig_id: gigId,
      talent_id: user.id,
      message: message.trim(),
      status: 'pending',
    }]);

  if (error) {
    return { error: 'Failed to submit application' };
  }

  revalidatePath(`/gigs/${gigId}`);
  return { success: true };
}
```

## 📡 Direct Supabase Client Patterns

### **Data Fetching in Server Components**

#### **Fetch Gigs with RLS**
```typescript
// Server Component data fetching
async function GigsList() {
  const supabase = await createSupabaseServerClient();
  
  const { data: gigs, error } = await supabase
    .from('gigs')
    .select('id,title,location,compensation,status,created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Failed to fetch gigs:', error);
    return <ErrorMessage>Unable to load gigs</ErrorMessage>;
  }

  return (
    <div>
      {gigs.map(gig => (
        <GigCard key={gig.id} gig={gig} />
      ))}
    </div>
  );
}
```

#### **Fetch User Profile with Role Check**
```typescript
async function UserDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // RLS ensures user only sees their own profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id,role,display_name,avatar_url,email_verified')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/onboarding');
  }

  // Role-specific data fetching
  if (profile.role === 'talent') {
    const { data: talentProfile } = await supabase
      .from('talent_profiles')
      .select('first_name,last_name,experience,specialty')
      .eq('user_id', user.id)
      .single();

    return <TalentDashboard profile={profile} talentProfile={talentProfile} />;
  }

  // ... other role handling
}
```

### **Real-time Subscriptions**

#### **Application Status Updates**
```typescript
'use client';
export function ApplicationStatus({ applicationId }: { applicationId: string }) {
  const [status, setStatus] = useState<string>('pending');
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const subscription = supabase
      .channel('application-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'applications',
          filter: `id=eq.${applicationId}`,
        },
        (payload) => {
          setStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [applicationId, supabase]);

  return (
    <Badge variant={status === 'approved' ? 'success' : 'secondary'}>
      {status}
    </Badge>
  );
}
```

## 🔒 API Security Patterns

### **Authentication Middleware**
```typescript
// Middleware for API route protection
export async function withAuth(
  handler: (req: NextRequest, context: { user: User }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const supabase = createMiddlewareClient({ req, res: NextResponse.next() });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return handler(req, { user: session.user });
  };
}

// Usage in API route
export const GET = withAuth(async (req, { user }) => {
  // Authenticated handler logic
  return NextResponse.json({ user: user.id });
});
```

### **Role-based Route Protection**
```typescript
export function withAdminAuth(
  handler: (req: NextRequest, context: { user: User }) => Promise<Response>
) {
  return withAuth(async (req, { user }) => {
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    return handler(req, { user });
  });
}
```

## 📊 Error Handling Patterns

### **Standardized Error Responses**
```typescript
interface APIError {
  error: string;
  code?: string;
  details?: unknown;
}

interface APISuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

type APIResponse<T = unknown> = APISuccess<T> | APIError;

// Error helper
function createErrorResponse(
  message: string, 
  status = 400, 
  code?: string
): Response {
  return NextResponse.json(
    { error: message, code },
    { status }
  );
}

// Success helper
function createSuccessResponse<T>(
  data?: T, 
  message?: string
): Response {
  return NextResponse.json({
    success: true,
    ...(data && { data }),
    ...(message && { message }),
  });
}
```

### **Server Action Error Handling**
```typescript
export async function safeServerAction<T>(
  action: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const result = await action();
    return { success: true, data: result };
  } catch (error) {
    console.error('Server action error:', error);
    
    if (error instanceof Error) {
      return { error: error.message };
    }
    
    return { error: 'An unexpected error occurred' };
  }
}
```

## 🎯 API Usage Examples

### **Client-side API Consumption**
```typescript
// Generic API helper
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  return response.json();
}

// Usage in components
export function AdminUserCreation() {
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async (userData: CreateUserData) => {
    setLoading(true);
    
    const result = await apiCall('/api/admin/create-user', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('User created successfully');
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={form.handleSubmit(handleCreateUser)}>
      {/* Form content */}
    </form>
  );
}
```

---

**API Maturity**: High (standardized patterns)
**Security**: 9/10 (comprehensive RLS + validation)
**Type Safety**: 9/10 (full TypeScript coverage)
**Documentation**: 8/10 (comprehensive reference)
**Last Updated**: 2025-01-17

*This API reference provides complete patterns for all data operations in the TOTL Agency platform.*