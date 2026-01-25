# 📕 Developer Quick Reference (Database & Type Usage)

**Last Updated:** January 15, 2025  
**Status:** Production Ready

This reference outlines how to interact with the database in our Next.js codebase, ensuring type safety and compliance with our security policies. It covers writing queries, using the generated types, creating migrations, and working with Row-Level Security (RLS).

## ⚡ Writing Database Queries (the Right Way)

- **Use the Supabase client provided:** Always import the initialized Supabase client from `lib/supabase-client.ts` (or `supabase-admin-client.ts` for privileged operations). Do not call `createClient` in your own code – the singleton clients ensure we use a consistent configuration (and user context for RLS) everywhere.  

#### **Client-Side (Browser)**
```ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/database";

const supabase = createClientComponentClient<Database>();

const { data: gigs, error } = await supabase
  .from('gigs')
  .select('id, title, description, location, compensation')
  .eq('status', 'active');
```

#### **Server Components (Read-Only)**
```ts
// Use in pages, layouts, and other Server Components
import { createSupabaseServerClient } from "@/lib/supabase-client";

const supabase = await createSupabaseServerClient();

const { data: gigs, error } = await supabase
  .from('gigs')
  .select('id, title, description, location, compensation')
  .eq('status', 'active');
```

#### **Server Actions & Route Handlers (Can Modify Cookies)**
```ts
// Use in Server Actions ('use server') and Route Handlers (app/api/**/route.ts)
import { createSupabaseActionClient } from "@/lib/supabase-client";

const supabase = await createSupabaseActionClient();

// Can perform auth operations that modify cookies
const { data: user, error } = await supabase.auth.getUser();
```

> **⚠️ Critical:** Server Components cannot modify cookies. Use `createSupabaseServerClient()` for read-only operations in pages/layouts. Use `createSupabaseActionClient()` only in Server Actions and Route Handlers where cookie modification is allowed.

In the above example, `gigs` will be strongly-typed (an array of Gig objects) because our Supabase client is configured with the generated `Database` types.

* **Never use raw SQL strings or bypass Supabase:** All queries should be via the Supabase JS client methods (`select`, `insert`, `update`, etc.). This ensures that the returned data types align with our schema. If you find a query that the JS client cannot easily express, consider creating a Postgres function and calling it via `supabase.rpc()`.
* **Handle errors and nulls:** The Supabase client returns an `{ data, error }` object. Always check for `error` and handle it (e.g., log it, throw it, or return a user-friendly message). If `error` is null, you can safely use `data` knowing it matches the expected type (or is `null` if no rows). Example:

  ```ts
  const { data: profile, error } = await supabase.from('profiles').select('*').single();
  if (error) {
    console.error("Failed to fetch profile", error);
    return;
  }
  // profile is typed as Profile (or null if not found)
  ```
* **Use `.single()` or `.maybeSingle()` appropriately:** When you expect only one row (e.g., selecting a profile by user ID which is unique), use `single()` to get a typed single object instead of an array. Use `maybeSingle()` if a missing row isn't an error (returns `data = null` instead of throwing).

## 🏷 Using Generated Types

* **Import database types when needed:** Our types file `types/database.ts` exports a `Database` interface that has all schema types. You can use this to declare variables or annotate return types. For example:

  ```ts
  import { Database } from '@/types/database';
  type Gig = Database['public']['Tables']['gigs']['Row'];
  ```

  Now `Gig` is a TypeScript type representing a row from the `gigs` table. You can do this for any table: replace `'gigs'` with the table name you need (`profiles`, `applications`, etc.).
* **No custom interfaces for DB data:** Do **not** redefine an interface for a database entity (like `interface Gig { ... }`). This will likely become outdated. Instead, always derive from the generated `Database` type as shown. If you need to extend or pick only certain fields, use TypeScript's utility types on the generated type (e.g., `Partial<Gig>` for a subset, or pick specific fields).
* **Enum types:** Enums in the database become union types in TypeScript. For example, a column `status` that uses the `application_status` enum will be typed as `"pending" | "accepted" | "rejected" | "withdrawn"`. You can refer to these as needed (you might define `type ApplicationStatus = Database['public']['Enums']['application_status']` for convenience). Always use these unions instead of string literals, so if an enum value changes, TypeScript will alert us in all the places it's used.
* **Benefits of strict typing:** When you use the generated types, your IDE and the compiler will catch mistakes, such as using a wrong field name or wrong type. For instance, if you try `supabase.from('gigs').insert({ titlle: "Test" })`, TypeScript will error because `titlle` is not a known field (it's `title`). Leverage these errors to quickly correct typos or misuse.

## 🗄 Creating and Running Migrations

* **Creating a migration:** Use the Supabase CLI to generate migration files. Example:

  ```bash
  npx supabase migration new add_project_table
  ```

  This will create a SQL file in `supabase/migrations/` with a timestamp. Edit that file to add your SQL commands (CREATE TABLE, ALTER TABLE, etc.). Follow existing migration examples for formatting. Each migration should do one logical set of changes (e.g., create a new table and its related constraints).
* **Applying migrations locally:** Ensure you have Docker running, then execute `supabase db reset` to reset and seed your local database (**warning:** this will wipe local data) or use `supabase db push` to apply new migrations without resetting data. This runs all migrations against a local Postgres instance. After running, check the database (via Supabase Studio or psql) to confirm the changes match what you expect.
* **Generating types:** After running migrations, always refresh the types file:

  ```bash
  npx supabase gen types typescript --local > types/database.ts
  ```

  (If you connected the CLI to your project with `supabase link`, you can omit `--project-id` and use `--local` for local DB). Commit the updated `types/database.ts` along with the migration. Never manually edit `types/database.ts` – always regenerate it so it stays 100% faithful to the DB.
* **Reviewing migrations:** When you open a PR with a migration, double-check that `database_schema_audit.md` is updated accordingly and that the diff of `types/database.ts` only contains the changes you intended (new fields, etc.). This helps catch any unintended side-effects of the SQL changes.

## 🔐 Working with RLS (Row-Level Security)

**🚨 CRITICAL:** When creating RLS policies, PostgreSQL does NOT support `IF NOT EXISTS` with `CREATE POLICY`. Always use `DO $$` blocks with conditional checks. See `SQL_RLS_POLICY_CREATION_GUIDE.md` for complete templates and examples.

Our database tables are protected by RLS policies, meaning the database will restrict which rows a query can see or modify based on the user's role and other factors.

* **Always use the correct client:**

  * On the **frontend** and in most API routes, use the **anon** Supabase client (`supabase-client.ts`). This client uses the logged-in user's JWT token, so all queries automatically apply that user's permissions. For example, a talent user querying `applications` will only get their own applications, because the RLS policy on `applications` table filters by `talent_id = auth.uid()`.
  * Only use the **admin service-role client** (`supabase-admin-client.ts`) in secure backend contexts (Next.js Server Actions, API routes with server-side checks, etc.) where you need to bypass RLS (e.g., an admin dashboard or a background job). Remember: the admin client will return **all** data, ignoring RLS, so never expose its results directly to an end-user without filtering in code.
* **Design queries with RLS in mind:** If a certain data access isn't working, consider whether an RLS policy might be blocking it. For example, if a client tries to fetch all profiles, the `profiles` table might restrict visibility. In such cases, think "should the user be allowed to see this data?" If yes, perhaps the policy needs adjustment or the query should use a different approach (like calling a Cloud Function with elevated rights). If no, then the code should not attempt that query for that user.
* **Avoid using the service key on the client side:** Never expose the service role key in client-side code or use it in front-end requests. All normal user interactions should go through the protected anon client to enforce security. The service key (admin client) is only for server-side usage where we trust the code path (and typically restrict by additional logic).
* **Testing RLS behavior:** Use multiple accounts (or Supabase's "simulate logged in user" feature in the dashboard) to ensure that data is correctly isolated. For instance, a talent user should not be able to fetch another talent's profile or applications. Our RLS policies are defined in the database, but your application code should be written under the assumption that anything not permitted will come back as empty data (or `null`). Always handle these cases gracefully (e.g., if `apps` comes back empty because of RLS, maybe the user is not allowed to see those records).

## 🚨 Type Safety Rules

### **🚨 CRITICAL: Next.js 15+ Async Cookies**
**ALWAYS** use the correct pattern to avoid async cookies errors:

```typescript
// ✅ CORRECT - Server Components
import { createSupabaseServerClient } from "@/lib/supabase-client";
const supabase = await createSupabaseServerClient();

// ✅ CORRECT - Server Actions
import { createSupabaseActionClient } from "@/lib/supabase-client";
const supabase = await createSupabaseActionClient();

// ❌ WRONG - Causes async cookies errors
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
const supabase = createServerComponentClient<Database>({ cookies });
```

### **CRITICAL: Never Use These Patterns**
```typescript
// ❌ WRONG - Don't do this
interface TalentProfile {
  id: string;
  first_name: string;
  // ... other fields
}

// ❌ WRONG - Don't use any
const data: any = await supabase.from('profiles').select('*');

// ❌ WRONG - Don't create local interfaces for DB entities
type GigStatus = 'draft' | 'published' | 'closed';
```

### **CORRECT: Use Generated Types**
```typescript
// ✅ CORRECT - Import from generated types
import { Database } from '@/types/database';
type TalentProfile = Database['public']['Tables']['talent_profiles']['Row'];
type GigStatus = Database['public']['Enums']['gig_status'];

// ✅ CORRECT - Use proper typing
const { data, error } = await supabase.from('profiles').select('*');
// data is automatically typed as Profile[] | null
```

## 🔧 Common Patterns

### **Fetching Related Data**
```typescript
// Fetch gig with client profile
const { data: gigs } = await supabase
  .from('gigs')
  .select('*, client_profiles(company_name, industry)')
  .eq('status', 'active');

// Fetch application with gig and talent details
const { data: applications } = await supabase
  .from('applications')
  .select(`
    *,
    gigs(title, location, compensation),
    talent_profiles(first_name, last_name, location)
  `)
  .eq('talent_id', user.id);
```

### **Type-Safe Inserts**
```typescript
// Insert with proper typing
const { data, error } = await supabase
  .from('gigs')
  .insert({
    client_id: user.id,
    title: 'Photography Gig',
    description: 'Professional photo shoot',
    category: 'photography',
    location: 'New York',
    compensation: '$500',
    date: '2025-08-15',
    status: 'draft' // TypeScript will validate this enum value
  })
  .select()
  .single();
```

### **Type-Safe Updates**
```typescript
// Update with proper typing
const { data, error } = await supabase
  .from('talent_profiles')
  .update({
    first_name: 'John',
    last_name: 'Doe',
    location: 'Los Angeles'
  })
  .eq('user_id', user.id)
  .select()
  .single();
```

## ✅ Additional Tips

* **Safe query wrappers:** We have a utility `safe-query.ts` which wraps Supabase queries to handle errors consistently. Consider using it for complex operations or when you want standardized logging of failures. It will return a `{ data, error }` object just like Supabase, but with error handling (and logging) baked in.
* **No `any` – use exact types:** If you find yourself unsure of a type for a Supabase query result, refer to `types/database.ts` or use TypeScript's inference. In nearly all cases, you should **not need to cast to `any` or `unknown`**. If a type is too complex (for example, a join result), define a specific type for that response shape using the Database types as building blocks.
* **Example – Fetching with Relationships:** Suppose you want to fetch a gig along with the client's profile. You can utilize Supabase's ability to select related data:

  ```ts
  const { data: gigs } = await supabase
    .from('gigs')
    .select('*, client_profiles(company_name, industry)')
    .eq('status', 'active');
  ```

  In this query, `gigs` will be typed as an array of a combined type that includes a nested `client_profiles` object. Our generated types know about foreign keys and relationships if they are set up as such in Supabase. Use these features to your advantage to keep queries efficient (fetch related data in one round-trip) while still remaining type-safe.

## 🔍 Verification Commands

### **Pre-commit Checks**
```powershell
# Run schema verification before committing
./scripts/verify-schema-sync.ps1

# Generate types from local database
npx supabase gen types typescript --local > types/database.ts

# Reset local database
supabase db reset --yes
```

### **Type Checking**
```powershell
# Check for type errors
npm run type-check

# Build to catch type issues
npm run build
```

## 📋 Quick Reference

### **Common Type Imports**
```typescript
import { Database } from '@/types/database';

// Table types
type Profile = Database['public']['Tables']['profiles']['Row'];
type TalentProfile = Database['public']['Tables']['talent_profiles']['Row'];
type ClientProfile = Database['public']['Tables']['client_profiles']['Row'];
type Gig = Database['public']['Tables']['gigs']['Row'];
type Application = Database['public']['Tables']['applications']['Row'];

// Enum types
type UserRole = Database['public']['Enums']['user_role'];
type GigStatus = Database['public']['Enums']['gig_status'];
type ApplicationStatus = Database['public']['Enums']['application_status'];
type BookingStatus = Database['public']['Enums']['booking_status'];

// Insert types (for creating new records)
type NewGig = Database['public']['Tables']['gigs']['Insert'];
type NewApplication = Database['public']['Tables']['applications']['Insert'];

// Update types (for partial updates)
type GigUpdate = Database['public']['Tables']['gigs']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
```

### **Common Query Patterns**
```typescript
// Fetch single record
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Fetch multiple records with filtering
const { data: gigs } = await supabase
  .from('gigs')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Insert with return
const { data: newGig } = await supabase
  .from('gigs')
  .insert(gigData)
  .select()
  .single();

// Update with return
const { data: updatedProfile } = await supabase
  .from('profiles')
  .update(updateData)
  .eq('id', user.id)
  .select()
  .single();
```

This quick reference should help in day-to-day coding. By following these guidelines – using the shared Supabase clients, relying on generated types, and respecting the migration workflow – you'll write code that is robust, secure, and easy to maintain. Happy coding! 🎉 