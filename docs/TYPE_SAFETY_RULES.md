# 🎯 Type Safety Rules - MANDATORY

**Last Updated:** November 1, 2025  
**Status:** 🚨 **CRITICAL - MUST FOLLOW**

## 📜 The Golden Rule

> **NEVER create custom interfaces or types for database entities. ALWAYS use generated types from `@/types/supabase`.**

---

## 🚫 FORBIDDEN PATTERNS

### ❌ NEVER DO THIS:

```typescript
// ❌ FORBIDDEN - Custom interface for database entity
interface Application {
  id: string;
  status: string;
  created_at: string;
}

// ❌ FORBIDDEN - Custom type for database entity
type Gig = {
  id: string;
  title: string;
  category: string;
};

// ❌ FORBIDDEN - Plain string for enum
const status: string = "pending";

// ❌ FORBIDDEN - Hardcoded enum values without type
if (application.status === "pending") { }

// ❌ FORBIDDEN - Using 'any' for database data
const application: any = await supabase.from("applications").select();
```

---

## ✅ ALWAYS DO THIS:

### ✅ Import Database Types

```typescript
import { Database } from "@/types/supabase";
```

### ✅ Use Generated Table Types

```typescript
// For full row type
type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type GigRow = Database["public"]["Tables"]["gigs"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// For partial row type (Pick specific fields)
type GigPreview = Pick<
  Database["public"]["Tables"]["gigs"]["Row"],
  "id" | "title" | "category" | "location"
>;

// For insert operations
type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];

// For update operations
type ApplicationUpdate = Database["public"]["Tables"]["applications"]["Update"];
```

### ✅ Use Generated Enum Types

```typescript
// For enum types
type ApplicationStatus = Database["public"]["Enums"]["application_status"];
type BookingStatus = Database["public"]["Enums"]["booking_status"];
type GigStatus = Database["public"]["Enums"]["gig_status"];
type UserRole = Database["public"]["Enums"]["user_role"];

// Use in function signatures
const getStatusColor = (status: ApplicationStatus) => {
  switch (status) {
    case "new": return "yellow";
    case "under_review": return "blue";
    case "shortlisted": return "purple";
    case "accepted": return "green";
    case "rejected": return "red";
  }
};
```

### ✅ Extend Types for Joined Data

```typescript
// When you need to add joined/related data
type ApplicationWithGig = Database["public"]["Tables"]["applications"]["Row"] & {
  gigs?: Database["public"]["Tables"]["gigs"]["Row"] | null;
};

// Or with partial related data
type ApplicationWithClient = Database["public"]["Tables"]["applications"]["Row"] & {
  gigs?: {
    title: string;
    client_profiles?: Pick<
      Database["public"]["Tables"]["client_profiles"]["Row"],
      "company_name"
    > | null;
  };
};
```

---

## 📊 Database Enum Values Reference

**Always use these EXACT values. Any other values will cause bugs!**

### Application Status
```typescript
type ApplicationStatus = 
  | "new"           // ✅ Initial state when talent applies
  | "under_review"  // ✅ Client is reviewing
  | "shortlisted"   // ✅ Talent made the shortlist
  | "rejected"      // ✅ Application declined
  | "accepted"      // ✅ Application accepted

// ❌ COMMON MISTAKE: "pending" does NOT exist!
```

### Booking Status
```typescript
type BookingStatus = 
  | "pending"      // ✅ Booking created, awaiting confirmation
  | "confirmed"    // ✅ Booking confirmed
  | "completed"    // ✅ Work completed
  | "cancelled"    // ✅ Booking cancelled
```

### Gig Status
```typescript
type GigStatus = 
  | "draft"     // ✅ Not published yet
  | "active"    // ✅ Live and accepting applications
  | "closed"    // ✅ No longer accepting applications
  | "featured"  // ✅ Featured/promoted gig
  | "urgent"    // ✅ Urgent hiring
```

### User Role
```typescript
type UserRole = 
  | "talent"  // ✅ Talent/model/actor
  | "client"  // ✅ Client/brand/casting director
  | "admin"   // ✅ Platform administrator
```

---

## 🔍 How to Check Your Code

### Before Creating a Component

1. **Ask yourself:** "Does this component use database data?"
2. **If YES:** Import types from `@/types/supabase`
3. **If NO:** You can use custom interfaces

### Self-Audit Checklist

```bash
# Check for forbidden patterns in your file
grep -n "interface Application" your-file.tsx
grep -n "interface Gig" your-file.tsx
grep -n "interface Profile" your-file.tsx
grep -n "interface Booking" your-file.tsx
grep -n "type Application =" your-file.tsx
grep -n "type Gig =" your-file.tsx

# If any of these return results, you need to fix them!
```

---

## 📝 Real-World Examples

### Example 1: Application Details Component

```typescript
// ❌ WRONG
interface Application {
  id: string;
  status: string;
  message: string | null;
}

// ✅ CORRECT
import { Database } from "@/types/supabase";

type ApplicationRow = Database["public"]["Tables"]["applications"]["Row"];
type GigRow = Database["public"]["Tables"]["gigs"]["Row"];

interface Application extends ApplicationRow {
  gigs?: GigRow | null;
}
```

### Example 2: Gig List Component

```typescript
// ❌ WRONG
type Gig = {
  id: string;
  title: string;
  location: string;
};

// ✅ CORRECT
import { Database } from "@/types/supabase";

type Gig = Pick<
  Database["public"]["Tables"]["gigs"]["Row"],
  "id" | "title" | "location" | "compensation" | "date"
>;
```

### Example 3: Status Badge Component

```typescript
// ❌ WRONG
interface BadgeProps {
  status: string; // Too generic!
}

// ✅ CORRECT
import { Database } from "@/types/supabase";

type ApplicationStatus = Database["public"]["Enums"]["application_status"];

interface BadgeProps {
  status: ApplicationStatus; // Type-safe!
}

function StatusBadge({ status }: BadgeProps) {
  // TypeScript will autocomplete and validate enum values
  if (status === "new") { /* ... */ }
  if (status === "pending") { /* ❌ TypeScript ERROR - 'pending' doesn't exist */ }
}
```

### Example 4: Form Submission

```typescript
// ❌ WRONG
const data = {
  status: "submitted", // ❌ Not a valid enum value!
};

// ✅ CORRECT
import { Database } from "@/types/supabase";

type ApplicationInsert = Database["public"]["Tables"]["applications"]["Insert"];

const data: ApplicationInsert = {
  gig_id: gigId,
  talent_id: talentId,
  status: "new", // ✅ Type-safe enum value
  message: coverLetter,
};
```

---

## 🛠️ Helper Types Available

You can also use the helper types from `types/database-helpers.ts`:

```typescript
import {
  ApplicationRow,
  GigRow,
  ProfileRow,
  ApplicationStatus,
  BookingStatus,
  GigStatus,
  UserRole,
} from "@/types/database-helpers";

// These are pre-defined aliases for convenience
```

---

## 🚨 When You See This in Code Review

### Red Flags to Look For:

1. ✋ Any `interface Application`, `interface Gig`, `interface Profile`
2. ✋ Any `type Application = { ... }` with custom fields
3. ✋ Any `status: string` without enum type
4. ✋ Any hardcoded status values like `"pending"`, `"submitted"`, etc.
5. ✋ Any `any` types for database data

### How to Fix:

1. Import `Database` from `@/types/supabase`
2. Replace custom interface with generated type
3. Use proper enum types for status fields
4. Verify enum values match database schema

---

## 📋 Verification Commands

Run these before committing:

```bash
# Search for forbidden patterns
npm run lint
npm run build

# Manual checks
grep -r "interface Application" components/ app/ lib/
grep -r "interface Gig" components/ app/ lib/
grep -r "status.*===.*\"pending\"" components/ app/ lib/

# If any results found, fix them!
```

---

## 🎓 Learning Resources

- **Generated Types:** `types/database.ts` (auto-generated, don't edit)
- **Helper Types:** `types/database-helpers.ts` (convenient aliases)
- **Audit Report:** `docs/TYPE_SAFETY_AUDIT_REPORT.md` (real examples)
- **Database Schema:** `database_schema_audit.md` (single source of truth)

---

## ⚡ Quick Reference Card

**Copy this and keep it visible while coding:**

```typescript
// ✅ ALWAYS START WITH THIS:
import { Database } from "@/types/supabase";

// ✅ FOR TABLE DATA:
type MyData = Database["public"]["Tables"]["table_name"]["Row"];

// ✅ FOR ENUMS:
type MyStatus = Database["public"]["Enums"]["enum_name"];

// ✅ FOR PARTIAL DATA:
type MyPartial = Pick<TableRow, "field1" | "field2">;

// ✅ FOR EXTENDED DATA:
type MyExtended = TableRow & { related?: OtherTableRow };

// ❌ NEVER:
// - interface MyEntity { ... }
// - type MyEntity = { ... }
// - status: string
// - any for database data
```

---

**Remember:** These rules exist to prevent runtime bugs, type mismatches, and data inconsistencies. Following them makes your code safer, more maintainable, and easier to refactor!

🎯 **When in doubt, check `types/database.ts` or `docs/TYPE_SAFETY_AUDIT_REPORT.md`**

