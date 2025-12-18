# Auth Bootstrap Contract (PR #3)

**Goal:** make it impossible for auth to land in a “user exists but profile missing” limbo, and make Career Builder (client) a *promoted state* (not a signup choice).

## Single source of truth

### 1) Database trigger = Talent bootstrap only

**When:** `AFTER INSERT ON auth.users` (`on_auth_user_created`)

**Guarantees (must always hold for new users):**
- `public.profiles` row exists
- `profiles.role = 'talent'`
- `profiles.account_type = 'talent'`
- `public.talent_profiles` row exists
- **Never** creates `client_profiles`
- Idempotent: safe to re-run without duplicates (`ON CONFLICT`)

**Authoritative migration:**
- `supabase/migrations/20251216190000_auth_bootstrap_contract_handle_new_user.sql`

### 2) Runtime repair = Talent-only (unless already promoted)

**Primitive:** `ensureProfileExists()` (`lib/actions/auth-actions.ts`)

**When:**
- Signed-in user is missing `profiles` due to drift/manual deletion

**Guarantees:**
- If `profiles` is missing, it is created as **Talent**:
  - `role = 'talent'`
  - `account_type = 'talent'`
  - `talent_profiles` created
- `user_metadata.role` is **never** trusted for privilege.
- Client status is inferred only from existing promoted state (e.g., `client_profiles` already exists).

### 3) Client promotion = admin approval only

**Primitive:** `approveClientApplication()` (`lib/actions/client-actions.ts`)

**When:**
- Admin approves a row in `client_applications`

**Guarantees:**
- `client_applications.status = 'approved'` is persisted
- Promoted user is updated to:
  - `profiles.role = 'client'`
  - `profiles.account_type = 'client'`
- `client_profiles` exists for the promoted user (idempotent create)

**Hard rule:** any generic role admin tooling must not be able to set `role='client'`.

## Non-goals / explicitly forbidden
- **No client signup** via auth metadata.
- **No middleware writes** (middleware gates only).
- **No client-side DB writes**.

## Quick verification queries

```sql
-- New users should never be missing profiles
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- New users should always be talent/talent
SELECT id, role, account_type
FROM public.profiles
ORDER BY created_at DESC
LIMIT 25;

-- Talent bootstrap should always include talent_profiles
SELECT p.id
FROM public.profiles p
LEFT JOIN public.talent_profiles tp ON tp.user_id = p.id
WHERE p.role = 'talent' AND tp.user_id IS NULL;
```
