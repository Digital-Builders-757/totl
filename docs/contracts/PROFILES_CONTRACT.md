# Profiles Contract (App identity + public/private profile surfaces)

**Date:** December 18, 2025  
Status: ✅ VERIFIED  
Last audited: 2025-12-20  
**Status note:** truth audited; open risks called out  
**Purpose:** Define profile surfaces, canonical profile mutation paths, and which profile fields are allowed to be public.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/role-surfaces.md`

---

## Routes involved (exact paths)

### Public profile surfaces
- `/talent/[slug]` (public talent profile page)
  - **Server**: RSC page `app/talent/[slug]/page.tsx`
  - **Client**: sidebar/details `app/talent/[slug]/talent-profile-client.tsx`

### Profile management (authenticated)
- `/settings`
  - **Server**: page loader `app/settings/page.tsx`
  - **Client**: editor UI `app/settings/profile-editor.tsx`
  - **Server (mutations)**: `app/settings/actions.ts`
- `/client/profile`
  - **Server**: page `app/client/profile/page.tsx` (loads initial data)
  - **Client (VIOLATION; see Drift note)**: `components/forms/client-profile-form.tsx` writes to DB from client
- `/talent/profile`
  - **Server**: page `app/talent/profile/page.tsx` (loads initial data)
  - **Client (VIOLATION; see Drift note)**: `components/forms/talent-profile-form.tsx` writes to DB from client

### Redirect alias
- `/profile` → redirects to `/settings`
  - Evidence: `app/profile/page.tsx`

---

## Canonical server actions/services (winners)

### Profile mutations (settings)
- `app/settings/actions.ts`
  - `updateBasicProfile(formData)`
  - `updateEmail(newEmail)`
  - `changePassword(password)`
  - `upsertTalentProfile(payload)`
  - `upsertClientProfile(payload)`
  - `uploadAvatar(formData)`

### Profile bootstrap / repair
- `lib/actions/auth-actions.ts`
  - `ensureProfileExists()`

### Enforcement rule (Cursor-proof)
- **Any other write** to `public.profiles`, `public.talent_profiles`, or `public.client_profiles` **outside** the winners above is a **contract violation** and must be migrated behind these server-side primitives.

### Drift note (IMPORTANT)
- `components/forms/talent-profile-form.tsx` and `components/forms/client-profile-form.tsx` currently perform **client-side writes** to `talent_profiles` / `client_profiles` and `profiles.display_name`.
  - **This is a contract violation** vs Layer 1 (“No DB calls in client components”).
  - This contract documents the current reality so we can stop pretending; remediation should migrate these writes behind server actions (preferably reusing `app/settings/actions.ts`).

---

## Data model touched (tables / columns)

### Read/write matrix (explicit)

#### `public.profiles`
- **Reads**:
  - `id, role, account_type` (routing/terminals)
  - `display_name, avatar_url, avatar_path, email_verified` (settings UI/header)
- **Writes (canonical winner)**:
  - `display_name` via `app/settings/actions.ts#updateBasicProfile`
  - `avatar_path` via `app/settings/actions.ts#uploadAvatar`
- **Writes (violation / drift)**:
  - `display_name` via `components/forms/*-profile-form.tsx` (client-side update)

#### `public.talent_profiles`
- **Reads**:
  - Public surface `/talent/[slug]`: safe allowlist (no `phone`)
  - Editor surfaces: include `phone` for self
- **Writes (canonical winner)**:
  - Upsert via `app/settings/actions.ts#upsertTalentProfile`
- **Writes (violation / drift)**:
  - Upsert via `components/forms/talent-profile-form.tsx` (client-side upsert)

#### `public.client_profiles`
- **Reads**:
  - `/client/profile` (editor initial load)
- **Writes (canonical winner)**:
  - Upsert via `app/settings/actions.ts#upsertClientProfile`
- **Writes (violation / drift)**:
  - Upsert via `components/forms/client-profile-form.tsx` (client-side upsert)

## Minimum select sets (to prevent type regressions)

These are the **minimum required columns** by surface. If you tighten selects, keep these in mind to avoid breaking typed consumers.

### `public.profiles`
- **Routing / authorization checks**: `id,role,account_type` (and `is_suspended` where applicable)
- **Settings header/UI**: `id,display_name,avatar_url,avatar_path,email_verified`

### `public.talent_profiles`
- **Public talent profile surface (`/talent/[slug]`)**: must include identity + display fields
  - Minimum: `id,user_id,first_name,last_name,created_at,updated_at`
- **Self/editor surfaces (`/talent/profile`, `/settings`)**:
  - Minimum: `id,user_id,first_name,last_name,created_at,updated_at`

### `public.client_profiles`
- **Client editor surface (`/client/profile`, `/settings`)**:
  - Minimum: `id,user_id,company_name,contact_email,created_at,updated_at`

## Allowed columns by surface (privacy)

Because RLS permits broad reads, privacy is enforced by **surface-level allowlists** (explicit selects + payload discipline).

### Public (anonymous) surfaces
- **Allowed** (example allowlist for `/talent/[slug]`):
  - `talent_profiles`: `id,user_id,first_name,last_name,age,location,experience,portfolio_url,height,measurements,hair_color,eye_color,shoe_size,languages,experience_years,specialties,weight,created_at,updated_at`
- **Disallowed**:
  - `talent_profiles.phone` (and any other contact or sensitive fields) must not be shipped in the public RSC payload.

### Signed-in / owner / admin surfaces
- May include sensitive fields **only when required by the UI**:
  - Example: `talent_profiles.phone` visible for **self/client/admin** (best-effort behavior; see `/talent/[slug]` implementation)

### `public.profiles`
Verified observed reads/writes:
- **Routing reads**: `role`
  - Evidence: `app/talent/profile/page.tsx`, `app/client/profile/page.tsx`
- **Settings writes**: `display_name`
  - Evidence: `app/settings/actions.ts` → `updateBasicProfile()`
- **Avatar writes**: `avatar_path`, `updated_at`
  - Evidence: `app/settings/actions.ts` → `uploadAvatar()`
- **Settings post-update select (for optimistic validation)**:
  - `id,display_name,avatar_url,avatar_path,email_verified,created_at,updated_at`
  - Evidence: `app/settings/actions.ts` (`.select(...)`)

### `public.talent_profiles`
Verified observed reads:
- **Public talent profile** `/talent/[slug]`:
  - Safe/public payload columns:
    - `id,user_id,first_name,last_name,age,location,experience,portfolio_url,height,measurements,hair_color,eye_color,shoe_size,languages,experience_years,specialties,weight,created_at,updated_at`
  - **Sensitive (best-effort)**:
    - `phone` is fetched server-side **only** when viewer is self/client/admin.
  - Evidence: `app/talent/[slug]/page.tsx`
- **Talent profile editor** `/talent/profile` (initial load):
  - `id,user_id,first_name,last_name,phone,age,location,experience,portfolio_url,height,measurements,hair_color,eye_color,shoe_size,languages,created_at,updated_at`
  - Evidence: `app/talent/profile/page.tsx`

### `public.client_profiles`
Verified observed reads:
- `/client/profile` (initial load):
  - `id,user_id,company_name,industry,website,contact_name,contact_email,contact_phone,company_size,created_at,updated_at`
  - Evidence: `app/client/profile/page.tsx`

### Storage
- Bucket: `avatars`
- Path format: `{userId}/avatar-{timestamp}.{ext}`
  - Evidence: `app/settings/actions.ts` → `uploadAvatar()`

---

## RLS expectations (truth, from migrations)

### Source migrations (canonical)
- `supabase/migrations/20250101000001_rls_policies.sql`
- `supabase/migrations/20251024182916_fix_rls_policies_only.sql`

### Verified effective policy reality (high signal)
- `public.profiles`
  - **Public SELECT is allowed** (`FOR SELECT TO anon, authenticated USING (true)`)
  - **Implication**: data protection depends on **explicit safe column selection** in app code, not RLS.
- `public.talent_profiles`
  - **Public SELECT is allowed** (`FOR SELECT TO anon, authenticated USING (true)`)
  - **Implication**: UI “hiding” sensitive fields is **not security**. Treat RLS as permissive.
- `public.client_profiles`
  - **SELECT is allowed to any authenticated user** (`FOR SELECT TO authenticated USING (true)`)
  - **Implication**: `client_profiles` reads are **not owner-scoped** by RLS; application code must treat this table as broadly readable by signed-in users.

### App-level safety rules (required because RLS is permissive)
- Public pages MUST:
  - select only safe columns
  - avoid shipping sensitive fields in RSC/client props
- Sensitive fields (e.g., phone) must be treated as **private by convention**, not by DB enforcement, until RLS/schema is tightened.

### Forbidden (contract-level, enforceable claims)
- `public.profiles` / `public.talent_profiles` / `public.client_profiles` **DELETE** is not permitted under current RLS (no delete policy in migrations).
- Public surfaces MUST NOT select or serialize `talent_profiles.phone` (or other contact/sensitive fields) to anonymous viewers.
- Any write to profile tables from **client components** is forbidden by Layer 1 (currently violated; see Drift note).

---

## Known failure modes

1) **Avatar upload succeeds but profile doesn’t update**
- Symptom: file exists in storage, UI still shows old avatar.
- Likely cause: storage upload succeeded but `profiles.avatar_path` update failed.

2) **Public profile leaks sensitive info**
- Symptom: anon can see phone/contact data.
- Likely cause:
  - selecting too many columns under permissive RLS, or
  - shipping sensitive fields in a public RSC payload / client props.
- Mitigation implemented (best-effort):
  - `/talent/[slug]` does not include `phone` in the public select; it is fetched conditionally server-side for authorized viewers.

3) **Build/type drift when removing `select('*')`**
- Symptom: Type errors when passing partial rows into typed components expecting full table row shapes.
- Fix pattern:
  - keep explicit selects at call sites
  - narrow component props to the actual fields used (do not force full Row)
  - Evidence: `components/forms/talent-profile-form.tsx` now accepts a field-level pick for `initialData`

4) **Profile missing on first login (bootstrap gap)**
- Symptom: user is authenticated but profile pages/terminals bounce or error.
- Likely cause: bootstrap trigger didn’t run, or profile row was deleted.
- Canonical repair: `lib/actions/auth-actions.ts#ensureProfileExists()` (see `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`).

5) **Role/account_type defaults incorrectly**
- Symptom: user routed into wrong terminal.
- Likely cause: drift in bootstrap trigger / profile repair logic.
- Canonical truth: `supabase/migrations/20251216190000_auth_bootstrap_contract_handle_new_user.sql` forces new users to Talent.

---

## Proof (acceptance + test steps)

### Acceptance checklist
- Talent can update their own profile + avatar.
- Client can update their own profile.
- Public `/talent/[slug]` renders without requiring auth.
- Public `/talent/[slug]` does not ship `phone` unless viewer is self/client/admin (best-effort mitigation while RLS remains permissive).

### Tests
- Playwright: `tests/integration/talent-public-profile.spec.ts` (public profile surface).
- Playwright (sentinel): `tests/integration/profiles-privacy-sentinel.spec.ts` (asserts public profile does not render phone, but owner can).
- Manual: update profile in `/settings` and refresh.
- Manual (sensitive field check):
  - Visit `/talent/[slug]` logged out and ensure phone is not present in rendered UI.
  - Visit `/talent/[slug]` as client/admin/self and ensure phone appears (if stored).

**PROOF:** Partially automated (Playwright) + manual verification steps above.

---

## Related docs (reference)
- `docs/PROFILE_IMAGE_UPLOAD_SETUP.md` (should be reduced to a pointer once fully migrated)
- `docs/CLIENT_TALENT_VISIBILITY.md`
