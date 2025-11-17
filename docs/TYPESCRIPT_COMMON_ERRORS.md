# TypeScript Common Errors & Solutions

**Created:** November 2, 2025  
**Purpose:** Quick reference for fixing common TypeScript errors in TOTL Agency  
**Status:** Living Document

---

## 🎯 Quick Reference

This guide provides instant solutions to the most common TypeScript errors you'll encounter in the TOTL Agency codebase.

---

## 🔴 **Error: Property 'X' does not exist on type 'never'**

### Cause:
Supabase client type isn't properly inferred, making all query results `never`.

### Solution:
```typescript
// ❌ WRONG
const supabase = createSupabaseBrowser();
const { data } = await supabase.from('table').select(); // Returns never

// ✅ CORRECT - Option 1: Use useSupabase() hook (client components)
import { useSupabase } from '@/lib/hooks/use-supabase';
const supabase = useSupabase(); // Guaranteed non-null with types

// ✅ CORRECT - Option 2: Proper null check (when hook causes issues)
const supabase = createSupabaseBrowser();
if (!supabase) return; // TypeScript now knows supabase is non-null below
```

---

## 🔴 **Error: Could not find the relation between X and Y**

### Cause:
Trying to join tables that don't have a direct foreign key relationship.

### Common Examples:
```typescript
// ❌ WRONG - No FK from applications.talent_id to talent_profiles
.select('*, talent_profiles!talent_id(...)') 

// ✅ CORRECT - Use the actual FK path
.select('*, profiles!talent_id(...)') // applications.talent_id → profiles.id

// OR query separately
const { data: talentProfile } = await supabase
  .from('talent_profiles')
  .select('first_name, last_name')
  .eq('user_id', application.talent_id)
  .single();
```

### Foreign Key Map:
- `applications.talent_id` → `profiles.id` (not talent_profiles!)
- `applications.gig_id` → `gigs.id`
- `gigs.client_id` → `profiles.id`
- `talent_profiles.user_id` → `profiles.id`
- `client_profiles.user_id` → `profiles.id`

---

## 🔴 **Error: Property 'X' does not exist on 'profiles'**

### Cause:
Querying fields that don't exist in the database schema.

### Common Field Issues:
```typescript
// ❌ WRONG - These fields DON'T exist
profile.bio          // Use talent_profiles.experience instead
profile.email        // Stored in auth.users, not profiles
profile.full_name    // Use profile.display_name instead
profile.skills       // Use talent_profiles.specialties instead

// ✅ CORRECT - Use actual schema fields
profile.display_name       // Main name field
profile.avatar_url         // Profile picture
profile.role               // user_role enum
talent_profile.experience  // Bio/description text
talent_profile.specialties // Array of skills
```

### Reference:
Always check [`database_schema_audit.md`](../database_schema_audit.md) for accurate field names.

---

## 🔴 **Error: Type 'X' is not assignable to type 'Y' enum**

### Cause:
Using display labels instead of database enum values.

### Application Status Enum:
```typescript
// ❌ WRONG - These are NOT valid enum values
'pending'
'completed'
'in progress'

// ✅ CORRECT - Valid application_status values
'new'
'under_review'
'shortlisted'
'rejected'
'accepted'
```

### Booking Status Enum:
```typescript
// ✅ Valid booking_status values
'pending'
'confirmed'
'completed'
'cancelled'
```

---

## 🔴 **Error: Conversion of type X to type Y may be a mistake**

### Cause:
Supabase SSR clients return slightly different types than standard `SupabaseClient<Database>`.

### Solution:
```typescript
// For both browser and server clients
import type { SupabaseClient } from '@supabase/supabase-js';

// Browser client
const client = createBrowserClient<Database>(
  url,
  key,
  { /* config */ }
) as unknown as SupabaseClient<Database>;

// Server client  
const client = createServerClient<Database>(
  url,
  key,
  { /* config */ }
) as unknown as SupabaseClient<Database>;
```

**Why `as unknown as`?**  
The SSR client types are structurally compatible but TypeScript's type system requires double assertion for safety.

---

## 🔴 **Error: Parameter implicitly has 'any' type**

### Cause:
TypeScript can't infer parameter types in callbacks.

### Solution:
```typescript
// ❌ WRONG
supabase.auth.onAuthStateChange(async (event, session) => {
  // Error: event and session are 'any'
});

// ✅ CORRECT
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
  // Types are explicit
});
```

---

## 🔴 **Error: Object literal may only specify known properties**

### Cause:
Trying to insert/update fields that don't exist in the table schema.

### Solution:
```typescript
// ❌ WRONG - These fields were removed
await supabase.from('portfolio_items').insert({
  talent_id: id,
  image_url: url,
  is_primary: true,        // ❌ Doesn't exist
  display_order: 0,        // ❌ Doesn't exist
  image_path: path,        // ❌ Removed - use image_url
});

// ✅ CORRECT - Only valid fields
await supabase.from('portfolio_items').insert({
  talent_id: id,
  image_url: url,  // ✅ Valid
  title: title,    // ✅ Valid
  caption: caption // ✅ Valid
});
```

---

## 🔴 **Error: Type 'TalentProfile[]' is not assignable (two different types)**

### Cause:
Multiple type definitions with the same name in different files.

### Solution:
```typescript
// ❌ WRONG - Custom interface that duplicates Database type
interface TalentProfile {
  // ... fields
}

// ✅ CORRECT - Use Database type or match query exactly
type TalentProfile = Database['public']['Tables']['talent_profiles']['Row'];

// ✅ CORRECT - Or create custom type that matches partial select
type TalentProfile = {
  id: string;
  first_name: string;
  last_name: string;
  // Only fields you actually SELECT
};
```

**Rule:** If using custom types, ensure they're imported from a shared location, not redefined per file.

---

## 📋 **Pre-Flight Checklist**

Before pushing code, always run:

```bash
# 1. Type check
npm run typecheck

# 2. Build verification  
npm run build

# 3. Lint check
npm run lint

# 4. Schema verification (if database changes)
npm run schema:verify:comprehensive
```

---

## 🛠️ **Quick Fixes**

### Fix All Import Order Warnings:
```bash
npm run import-order:fix
```

### Regenerate Types After Schema Change:
```bash
npm run types:regen:dev
```

### Check for Common Type Issues:
```bash
npm run type-safety:check:verbose
```

---

## 📚 **Learn More**

- [TYPE_SAFETY_IMPROVEMENTS.md](./TYPE_SAFETY_IMPROVEMENTS.md) - Comprehensive guide
- [database_schema_audit.md](../database_schema_audit.md) - Schema source of truth
- [PRE_PUSH_CHECKLIST.md](./PRE_PUSH_CHECKLIST.md) - Required checks

---

## 🔴 **Error: MCP Server Connection Failures**

### Cause:
Playwright MCP server fails to connect due to corrupted npx cache or missing local installation.

### Solution:
```powershell
# 1. Install packages locally
npm install --save-dev playwright @playwright/test @playwright/mcp --legacy-peer-deps
npx playwright install --with-deps chromium

# 2. Update Cursor MCP config to use --no-install flag
# File: c:\Users\young\.cursor\mcp.json
{
  "playwright": {
    "command": "npx",
    "args": ["--no-install", "@playwright/mcp", "--browser=chromium", "--headless"]
  }
}

# 3. Verify command works
npx --no-install @playwright/mcp --help

# 4. Restart Cursor completely
```

**Key:** `--no-install` forces npx to use local `node_modules` instead of corrupted temp cache.

**Related:** See `docs/MCP_PLAYWRIGHT_TROUBLESHOOTING.md` for complete guide.

---

**Last Updated:** November 16, 2025  
**Quick Reference:** Keep this open while coding!

