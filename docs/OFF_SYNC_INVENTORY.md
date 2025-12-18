# Off-Sync Primitives Inventory (Winners Declared)

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Identify duplicate/conflicting primitives across the repo, declare the canonical "winner" for each, and list remediation tasks.  

> **Evidence rule:** If a claim cannot be tied to a file/migration/type, it must be marked **UNVERIFIED** and added to the Drift Report.

---

## Canonical references (Layer 1)
- `docs/ARCHITECTURE_CONSTITUTION.md` (global laws)
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` (canonical modules)
- Diagrams:
  - `docs/diagrams/airport-model.md`
  - `docs/diagrams/infrastructure-flow.md`
  - `docs/diagrams/signup-bootstrap-flow.md`

---

## 1) Email sending paths (multiple “send brains”)

### Observed patterns
- **Direct send (server action → Resend wrapper)**
  - `lib/actions/client-actions.ts` imports `sendEmail` + `logEmailSent` from `lib/email-service.ts`.
- **Indirect send (server action → internal HTTP fetch → API route → sendEmail)**
  - `app/gigs/[id]/apply/actions.ts` uses `fetch(.../api/email/send-application-received)` and `fetch(.../api/email/send-new-application-client)`.
  - `lib/actions/booking-actions.ts` uses `fetch(.../api/email/send-application-rejected)`.

### Winner (canonical)
- **Winner:** `lib/email-service.ts` + `lib/services/email-templates.tsx`
  - Allowed callers: **Server Actions** and **Route Handlers**.
  - Rule: do **not** call internal `/api/email/*` via `fetch()` from server actions.

### Why
- Avoids duplicate logic and avoids environment drift (`NEXT_PUBLIC_SITE_URL` in server fetches).
- Keeps email as a Staff-layer side effect (Server Action/Route Handler), consistent with `docs/diagrams/infrastructure-flow.md`.

### Remediation tasks
- Convert server-actions that `fetch('/api/email/*')` into direct calls to `sendEmail(...)` + template generator.
- Standardize template generator imports to **one module**: `lib/services/email-templates.tsx`.

---

## 2) Admin privileges in server code (service role vs anon)

### Observed patterns
- **Correct:** admin operations use `createSupabaseAdminClient()` (`lib/supabase-admin-client.ts`).
  - Example: `lib/actions/client-actions.ts` uses `createSupabaseAdminClient()` to list users.
- **Potentially off-sync:** server action calls `supabase.auth.admin.*` on the non-admin server client.
  - Example: `lib/actions/booking-actions.ts` calls `supabase.auth.admin.getUserById(...)`.

### Winner (canonical)
- **Winner:** `lib/supabase-admin-client.ts` (`createSupabaseAdminClient`) for any `auth.admin.*` or privileged table writes.

### Remediation tasks
- Replace `supabase.auth.admin.*` usage in server actions that use `createSupabaseServer()`.

---

## 3) Auth bootstrap contract vs onboarding/profile creation code

### Observed patterns
- **Contract:** New users bootstrap as Talent; Client is promotion by admin approval.
  - Source: `docs/AUTH_BOOTSTRAP_CONTRACT.md` + migration `supabase/migrations/20251216190000_auth_bootstrap_contract_handle_new_user.sql`.
- **Off-sync implementation:** onboarding action inserts `profiles.role` from form input.
  - `app/onboarding/actions.ts` inserts `profiles` with `role: formData.role` (can be `client`).

### Winner (canonical)
- **Winner:** Auth bootstrap contract (trigger + runtime repair) 
  - Trigger: `supabase/migrations/20251216190000_auth_bootstrap_contract_handle_new_user.sql`
  - Repair: `lib/actions/auth-actions.ts` (`ensureProfileExists`, `handleLoginRedirect`)
  - Promotion: `lib/actions/client-actions.ts` (`approveClientApplication`)

### Remediation tasks
- Onboarding/profile creation actions must not allow elevating role/account_type to client.

---

## Hard invariant (security spine): Role Promotion Boundary

**No writes to `profiles.role` / `profiles.account_type` outside:**
1. DB bootstrap trigger `public.handle_new_user()` sets initial `role/account_type` to `talent`.\n   - Evidence: `supabase/migrations/20251216190000_auth_bootstrap_contract_handle_new_user.sql`\n2. Admin-only promotion path `approveClientApplication()` updates `role/account_type` to `client`.\n   - Evidence: `lib/actions/client-actions.ts` (`approveClientApplication`)\n3. Admin user creation is via Supabase backend tooling (no UI promotion to admin).\n\n**Detection checklist (must pass before merge):**\n- Search for `.update({ role:` / `.update({ account_type:` and confirm every hit is one of the allowed paths above.\n\n**Canonical reference:** `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` → “Role Promotion Boundary”.\n\n---\n+
## 4) Query shape primitives (explicit select vs select(*))

### Observed patterns
- **Canonical helper exists:** `lib/utils/selects.ts` defines consistent explicit column lists.
- **Off-sync occurrences:** several server actions use `.select()` without specifying columns.
  - Examples: `app/gigs/[id]/apply/actions.ts`, `app/admin/gigs/create/actions.ts`, `lib/actions/portfolio-actions.ts`.

### Winner (canonical)
- **Winner:** explicit select strings (prefer `lib/utils/selects.ts`), and no `select('*')` in app code.

### Remediation tasks
- Replace bare `.select()` with explicit selects, ideally using `lib/utils/selects.ts`.

---

## 5) Schema truth drift (audit vs types/migrations)

### Observed patterns
- `database_schema_audit.md` is declared as schema truth, but its `profiles` section omits `account_type`.
  - Code + types clearly use `profiles.account_type`.

### Winner (canonical)
- **Winner:** `supabase/migrations/**` + generated `types/database.ts`.
- `database_schema_audit.md` must be kept **in sync** with these.

### Remediation tasks
- Audit and update `database_schema_audit.md` to match the generated types.

---

## Tracking
- Add any mismatches discovered during audits to the **Drift Report** section in `docs/DOCUMENTATION_INDEX.md` (or an equivalent tracking doc) until resolved.
