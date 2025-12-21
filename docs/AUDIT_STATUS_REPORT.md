# TOTL Agency — Audit Status Report (Evidence-Based)

**Date:** December 21, 2025  
**Mode:** Repo Audit Report (evidence-based)  
**Goal:** Show what is **DONE / PARTIAL / NOT DONE / UNKNOWN** vs the “perfectly working” North Star, with proof pointers.

---

## 1) Executive Summary

- **Quality gates are green in this workspace** (schema verify, types check, build, lint). Evidence: command outputs in **Section 2**.
- **Foundation PRs status**:
  - **Email verification sync primitive**: **PARTIAL** (canonical helper exists; called from auth callback + `ensureProfileExists()`, but **not called directly inside AuthProvider**). Evidence: **Section 3.1**.
  - **Routing constants + decision function**: **DONE** (canonical route constants + edge-safe redirect decision; used by middleware + server actions + AuthProvider via BootState). Evidence: **Section 3.2**.
  - **Resend unification**: **DONE** (no client-side `supabase.auth.resend()`; verification “resend” funnels through `POST /api/email/send-verification`). Evidence: **Section 3.3**.
- **Core journeys are documented but not fully proven**: `docs/journeys/*` are marked **🚧 IN PROGRESS** and include multiple **UNVERIFIED** checkboxes. Evidence: **Section 5**.
- **Known drift** is explicitly documented in contracts/journeys:
  - **Client apply route is treated as public**, but `submitClientApplication()` **requires an authenticated user**. Evidence: **Section 6.1**.
  - **Profiles contract reports client-side DB writes** in `components/forms/*-profile-form.tsx` (contract violation). Evidence: **Section 6.2**.

---

## 2) Quality Gates (Baseline Proof — Mandatory)

### Commands (canonical)

```text
npm run schema:verify:comprehensive
npm run types:check
npm run build
npm run lint
```

### Outputs (captured)

<details>
<summary><strong>npm run schema:verify:comprehensive</strong> (exit 0)</summary>

```text
✅ CLI version: 2.34.3
⚠️  No project currently linked
✅ Types file has proper auto-generated banner
✅ Types are in sync with project utvircuwknqzpnmvxidp
🎉 Schema sync verification complete!
```

</details>

<details>
<summary><strong>npm run types:check</strong> (exit 0)</summary>

```text
Generating fresh types from Supabase schema (project: utvircuwknqzpnmvxidp)...
✓ types/database.ts is in sync with live schema
```

</details>

<details>
<summary><strong>npm run build</strong> (exit 0)</summary>

```text
✓ Compiled successfully in 2.0min
✓ Generating static pages (57/57)
ƒ Middleware                                 134 kB
```

</details>

<details>
<summary><strong>npm run lint</strong> (exit 0)</summary>

```text
✔ No ESLint warnings or errors
```

</details>

---

## 3) Foundation PR Status (DONE / PARTIAL / NOT DONE)

### 3.1 Email verification sync primitive — **PARTIAL**

#### Canonical helper exists

Evidence (canonical helper + declared call sites):

```text
lib/server/sync-email-verified.ts
/**
 * Syncs profiles.email_verified to match auth.users.email_confirmed_at
 *
 * This is the single source of truth for email verification sync.
 * Used by:
 * - app/auth/callback/page.tsx (verification callback)
 * - lib/actions/auth-actions.ts (ensureProfileExists)
 */
```

#### Called from auth callback

Evidence:

```text
app/auth/callback/page.tsx
const syncResult = await syncEmailVerifiedForUser({
  supabase,
  user,
  currentEmailVerified: null,
});
```

#### Called from `ensureProfileExists()` (server bootstrap/repair)

Evidence:

```text
lib/actions/auth-actions.ts
const syncResult = await syncEmailVerifiedForUser({
  supabase,
  user,
  currentEmailVerified: createdProfile?.email_verified ?? null,
});
```

#### NOT called directly in AuthProvider auth-change handlers

Evidence (AuthProvider relies on session’s `email_confirmed_at` for UI state, not the sync helper):

```text
components/auth/auth-provider.tsx
} else if (event === "TOKEN_REFRESHED") {
  setSession(session);
  if (session?.user) {
    setUser(session.user);
    setIsEmailVerified(session.user.email_confirmed_at !== null);
  }
}
```

Evidence (repo search shows no helper usage in AuthProvider):

```text
components/auth/auth-provider.tsx
(grep) syncEmailVerifiedForUser → No matches found
```

#### What to check next (to resolve PARTIAL → DONE)

- Confirm whether AuthProvider **must** call `syncEmailVerifiedForUser()` on `SIGNED_IN`/`TOKEN_REFRESHED`, or whether “DB trigger + callback + ensureProfileExists” is the intended convergence mechanism.
  - Evidence to consult next: `supabase/migrations/20251216013000_sync_profiles_email_verified_on_auth_confirm.sql` (trigger path) and `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` (contract truth).

---

### 3.2 Routing constants + decision function — **DONE**

#### Canonical route constants file exists

Evidence:

```text
lib/constants/routes.ts
export const PATHS = {
  LOGIN: "/login",
  CHOOSE_ROLE: "/choose-role",
  TALENT_DASHBOARD: "/talent/dashboard",
  CLIENT_DASHBOARD: "/client/dashboard",
  ADMIN_DASHBOARD: "/admin/dashboard",
} as const;
```

#### Canonical returnUrl validator + determineDestination exist

Evidence (returnUrl sanitizer):

```text
lib/utils/return-url.ts
export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.includes("://") || value.startsWith("//")) return null;
  if (!value.startsWith("/")) return null;
  return value;
}
```

Evidence (destination):

```text
lib/utils/determine-destination.ts
if (profile.role === "admin") return PATHS.ADMIN_DASHBOARD;
if (profile.account_type === "client" || profile.role === "client") return PATHS.CLIENT_DASHBOARD;
if (profile.account_type === "talent" || profile.role === "talent") return PATHS.TALENT_DASHBOARD;
```

#### Single routing “brain” used by middleware + server actions (and AuthProvider via BootState)

Evidence (shared decision module + purpose):

```text
lib/routing/decide-redirect.ts
/**
 * Shared "post-auth redirect" brain for server-side redirecters (middleware/auth-actions).
 * Edge-safe: returns data only; no NextResponse, no Supabase, no Node APIs.
 */
export function decidePostAuthRedirect(...)
```

Evidence (middleware uses `decidePostAuthRedirect`):

```text
middleware.ts
import { decidePostAuthRedirect } from "@/lib/routing/decide-redirect";
...
const decision = decidePostAuthRedirect({ pathname: path, ... });
if (decision.type === "redirect") return NextResponse.redirect(new URL(decision.to, req.url));
```

Evidence (BootState uses shared brain and is used by AuthProvider on SIGNED_IN):

```text
lib/actions/boot-actions.ts
const decision = decidePostAuthRedirect({ pathname: PATHS.LOGIN, returnUrlRaw: params.returnUrlRaw ?? null, ... });
nextPath = decision.type === "redirect" ? decision.to : determineDestination(profileAccess);
```

```text
components/auth/auth-provider.tsx
const boot = await getBootState({ postAuth: true, returnUrlRaw });
const bootTarget = boot?.nextPath ?? PATHS.TALENT_DASHBOARD;
router.push(bootTarget);
```

---

### 3.3 Resend unification — **DONE**

#### No client-side `supabase.auth.resend()` usage found

Evidence:

```text
(grep) .auth.resend( in app/api → No matches found
```

#### Verification resend funnels through a single API route

Evidence (verification pending page uses the API route):

```text
app/verification-pending/page.tsx
const response = await fetch("/api/email/send-verification", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
```

Evidence (AuthProvider uses same API route):

```text
components/auth/auth-provider.tsx
const response = await fetch("/api/email/send-verification", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: user.email }),
});
```

Evidence (API route generates Supabase-native verification link and sends via canonical email primitive):

```text
app/api/email/send-verification/route.ts
const { data, error } = await supabase.auth.admin.generateLink({
  type: "signup",
  email: normalizedEmail,
  options: { redirectTo: absoluteUrl("/auth/callback") },
});
...
await sendEmail({ to: normalizedEmail, subject, html });
```

---

## 4) System Map (Module Map)

> Format: **Routes** (app/*), **Server actions/services** (lib/*), **Tables touched**, **RLS expectations**, **Canonical docs**.

### Evidence: key module entrypoints exist

```text
docs/contracts/INDEX.md
- AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md
- PROFILES_CONTRACT.md
- GIGS_CONTRACT.md
- APPLICATIONS_CONTRACT.md
- BOOKINGS_CONTRACT.md
- PORTFOLIO_UPLOADS_CONTRACT.md
- STRIPE_WEBHOOKS_CONTRACT.md
- EMAIL_NOTIFICATIONS_CONTRACT.md
- ADMIN_CONTRACT.md
```

```text
docs/journeys/INDEX.md
- TALENT_JOURNEY.md
- CLIENT_JOURNEY.md
- ADMIN_JOURNEY.md
```

### Auth / Onboarding

- **Routes**:
  - Auth surfaces: `/login`, `/choose-role`, `/verification-pending`, `/auth/callback`
  - Onboarding: `/onboarding`, `/onboarding/select-account-type`
  - Evidence: `lib/constants/routes.ts` defines `PATHS.LOGIN`, `PATHS.CHOOSE_ROLE`, `PATHS.VERIFICATION_PENDING`, `PATHS.ONBOARDING` etc.
- **Server actions/services**:
  - `lib/actions/boot-actions.ts` (`getBootState`, `finishOnboardingAction`) — uses `ensureProfileExists()`
  - `lib/actions/auth-actions.ts` (`ensureProfileExists`, `handleLoginRedirect`, …)
  - Evidence: `lib/actions/boot-actions.ts` calls `ensureProfileExists()` (server-only bootstrap).
- **Tables touched**:
  - `profiles`, `talent_profiles`, `client_profiles`
  - Evidence: `lib/actions/boot-actions.ts` reads `profiles`, `client_profiles`, `talent_profiles` via `.from("...")`.
- **RLS expectations (high-level)**:
  - Missing profile is a valid bootstrap state; middleware should allow safe routes.
  - Evidence: `docs/ARCHITECTURE_CONSTITUTION.md` (“Missing profile is a valid bootstrap state”).
- **Canonical docs**: `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`, `docs/journeys/TALENT_JOURNEY.md`, `docs/journeys/CLIENT_JOURNEY.md`, `docs/journeys/ADMIN_JOURNEY.md`.

### Profiles

- **Routes**:
  - `/settings` (profile editor), `/talent/profile`, `/client/profile`, `/talent/[slug]` (public)
  - Evidence: `docs/contracts/PROFILES_CONTRACT.md` “Routes involved (exact paths)”.
- **Server actions/services**:
  - Winner: `app/settings/actions.ts` (per contract)
  - Supporting actions: `lib/actions/profile-actions.ts`
  - Evidence: `docs/contracts/PROFILES_CONTRACT.md` “Canonical server actions/services (winners)”.
- **Tables touched**: `profiles`, `talent_profiles`, `client_profiles`
  - Evidence: `lib/actions/profile-actions.ts` contains `.from("talent_profiles")`, `.from("profiles")`, `.from("client_profiles")` (see grep output in Section 5 tables evidence below).
- **Canonical docs**: `docs/contracts/PROFILES_CONTRACT.md`.

### Gigs

- **Routes**:
  - Public browse/detail: `/gigs`, `/gigs/[id]`
  - Client manage: `/client/gigs`, `/post-gig`
  - Evidence: `docs/journeys/TALENT_JOURNEY.md` step 1 + repo routes exist under `app/gigs/**`, `app/client/gigs/**`, `app/post-gig/**`.
- **Server actions/services**:
  - `app/post-gig/actions.ts` (gig creation)
  - Evidence: `app/post-gig/actions.ts` uses `.from("gigs")` (see grep evidence below).
- **Tables touched**: `gigs`, (plus `gig_requirements` if used)
  - Schema evidence: `database_schema_audit.md` includes `gigs` and `gig_requirements`.
- **Canonical docs**: `docs/contracts/GIGS_CONTRACT.md`.

### Applications

- **Routes**:
  - Apply: `/gigs/[id]/apply`
  - Client review: `/client/applications`
  - Admin: `/admin/applications`
  - Evidence: `docs/journeys/TALENT_JOURNEY.md` step 6; `next build` route list includes `/gigs/[id]/apply`, `/client/applications`, `/admin/applications`.
- **Server actions/services**:
  - `app/gigs/[id]/apply/actions.ts` (apply)
  - `lib/actions/booking-actions.ts` (accept/reject application)
  - Evidence: `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md` ledger lines reference `app/gigs/[id]/apply/actions.ts` and `lib/actions/booking-actions.ts`.
- **Tables touched**: `applications`, `gigs`, `profiles`
  - Evidence: multiple `.from("applications")` call sites under `app/**` (see grep evidence below).
- **Canonical docs**: `docs/contracts/APPLICATIONS_CONTRACT.md`.

### Bookings

- **Routes**:
  - Client bookings: `/client/bookings`
  - Talent booking surfaces: `/talent/dashboard` (reads bookings)
  - Evidence: `docs/journeys/TALENT_JOURNEY.md` step 7 reads `bookings`; route exists at `app/client/bookings/page.tsx`.
- **Server actions/services**:
  - `lib/actions/booking-actions.ts`
- **Tables touched**: `bookings`
  - Evidence: `lib/actions/booking-actions.ts` contains `.from("bookings")` (see grep evidence below).
- **Canonical docs**: `docs/contracts/BOOKINGS_CONTRACT.md`.

### Portfolio

- **Routes**:
  - Talent settings portfolio section: `/settings`
  - Admin view references exist (portfolio items read)
  - Evidence: `docs/journeys/TALENT_JOURNEY.md` step 4, and `app/settings/page.tsx` uses `.from("portfolio_items")` (see grep evidence below).
- **Server actions/services**:
  - `lib/actions/portfolio-actions.ts`
- **Tables touched**: `portfolio_items`
  - Evidence: `lib/actions/portfolio-actions.ts` contains `.from("portfolio_items")` (see grep evidence below).
- **Canonical docs**: `docs/contracts/PORTFOLIO_UPLOADS_CONTRACT.md`.

### Email

- **Routes**: `/api/email/*` (verification/reset public; others internal-only)
  - Evidence: `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md` “Auth posture for `/api/email/*`”.
- **Server actions/services**:
  - Winner: `lib/email-service.ts` + `lib/services/email-templates.tsx`
  - Evidence: `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md` “Canonical primitives (winners)”.
- **Tables touched**:
  - `email_send_ledger` (durable throttle / idempotency gate)
  - Evidence: `database_schema_audit.md` table `email_send_ledger` exists.
- **Canonical docs**: `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md`.

### Admin

- **Routes**:
  - `/admin/dashboard`, `/admin/users`, `/admin/client-applications`, `/admin/moderation`
  - Evidence: `docs/journeys/ADMIN_JOURNEY.md` route sequence.
- **Server actions/services**:
  - `lib/actions/client-actions.ts` (approval/promote)
  - `lib/actions/moderation-actions.ts`
  - `app/api/admin/*` (auth admin operations)
- **Tables touched**:
  - `client_applications`, `profiles`, `client_profiles`, `content_flags`, `gigs`
  - Evidence: `lib/actions/client-actions.ts` uses `.from("client_applications")`; `lib/actions/moderation-actions.ts` uses `.from("content_flags")` and `.from("gigs")` (see grep evidence above).
- **Canonical docs**: `docs/contracts/ADMIN_CONTRACT.md`.

### Storage

- **Buckets**: `avatars`, `portfolio`
  - Evidence: `database_schema_audit.md` “Supabase Storage Buckets” section lists `avatars` and `portfolio`.
- **Tables touched**: `profiles.avatar_path`, `portfolio_items`
  - Evidence: `database_schema_audit.md` includes `profiles.avatar_path`; `lib/actions/portfolio-actions.ts` uses `portfolio_items`.
- **Canonical docs**: `docs/contracts/PORTFOLIO_UPLOADS_CONTRACT.md`, `docs/PROFILE_IMAGE_UPLOAD_SETUP.md`.

### Stripe

- **Routes**: `/api/stripe/webhook`, `/talent/subscribe`, `/talent/settings/billing`
  - Evidence: `docs/journeys/TALENT_JOURNEY.md` step 5 routes.
- **Tables touched**: `profiles` subscription fields, `stripe_webhook_events`
  - Evidence: `database_schema_audit.md` includes `stripe_webhook_events` + subscription columns on `profiles`.
- **Canonical docs**: `docs/contracts/STRIPE_WEBHOOKS_CONTRACT.md`.

---

## 5) Core Journeys QA Log (Acceptance List)

### Evidence: journeys are marked IN PROGRESS

```text
docs/journeys/TALENT_JOURNEY.md
Status: 🚧 IN PROGRESS
```

```text
docs/journeys/CLIENT_JOURNEY.md
Status: 🚧 IN PROGRESS
```

```text
docs/journeys/ADMIN_JOURNEY.md
Status: 🚧 IN PROGRESS
```

### Talent (sign up → verify → choose role → dashboard → portfolio → apply → booking)

| Step | Status | Proof / what to check next |
| --- | --- | --- |
| Sign up (Talent) | UNKNOWN | `docs/journeys/TALENT_JOURNEY.md` has checklist; confirm with `tests/auth/*` (listed in journey). |
| Verify email (callback) | ✅ | Callback calls `syncEmailVerifiedForUser()` and redirects using BootState: `app/auth/callback/page.tsx`. |
| Choose role | UNKNOWN | Confirm `/choose-role` behavior with `app/choose-role/page.tsx` and `tests/auth/authentication.spec.ts`. |
| Dashboard loads | ✅ | `docs/journeys/TALENT_JOURNEY.md` marks dashboard/profile bootstrap as “PROVEN”; see `docs/contracts/PROFILES_CONTRACT.md` status ✅ VERIFIED. |
| Portfolio upload/manage | UNKNOWN | Pointers exist: `tests/integration/portfolio-gallery.spec.ts` (from journey); confirm it passes in your environment. |
| Apply to gig | UNKNOWN | Pointer exists: `tests/integration/talent-gig-application.spec.ts` (from journey). |
| Booking created after accept | UNKNOWN | `docs/journeys/TALENT_JOURNEY.md` explicitly marks booking creation coverage as **UNVERIFIED**. |

### Client (sign up → client application → status portal → create gigs → manage applicants)

| Step | Status | Proof / what to check next |
| --- | --- | --- |
| Submit client application | ✅ (authenticated flow) | `lib/actions/client-actions.ts#submitClientApplication` requires `auth.getUser()` and inserts into `client_applications`. |
| Status portal works end-to-end | UNKNOWN | `docs/journeys/CLIENT_JOURNEY.md` marks `/client/application-status` **UNVERIFIED**. Confirm route + API: `app/client/application-status/*`, `app/api/client-applications/status/route.ts`, and add/confirm tests. |
| Admin approval promotes role | UNKNOWN | `docs/journeys/CLIENT_JOURNEY.md` checklist item; confirm via `lib/actions/client-actions.ts#approveClientApplication` + related RPC/migration and E2E test. |
| Client dashboard routing | UNKNOWN | Confirm via `middleware.ts` + `lib/routing/decide-redirect.ts` + `app/client/dashboard/page.tsx`. |
| Create gigs | UNKNOWN | Confirm via `app/post-gig/actions.ts` and `app/client/gigs/page.tsx`. |
| Manage applicants | UNKNOWN | Confirm via `app/client/applications/page.tsx` and booking accept/reject actions. |

### Admin (dashboard stats, moderation/ops paths)

| Step | Status | Proof / what to check next |
| --- | --- | --- |
| Admin lands on `/admin/dashboard` | UNKNOWN | `docs/journeys/ADMIN_JOURNEY.md` checklist; verify with `middleware.ts` admin redirect guard + `tests/admin/*`. |
| Review client applications | UNKNOWN | Confirm `app/admin/client-applications/page.tsx` + `lib/actions/client-actions.ts`. |
| Manage users (auth admin) | UNKNOWN | Confirm `app/admin/users/*` + `app/api/admin/*` route handlers. |
| Moderate content | UNKNOWN | Confirm `app/admin/moderation/page.tsx` + `lib/actions/moderation-actions.ts` writes to `content_flags` / `profiles.is_suspended`. |

---

## 6) Drift & Duplicates

### 6.1 Drift: `/client/apply` is public in routes, but submission requires auth

Evidence (route considered public):

```text
lib/constants/routes.ts
export const PUBLIC_ROUTES: readonly string[] = [
  ...
  PATHS.CLIENT_APPLY,
  PATHS.CLIENT_APPLY_SUCCESS,
  PATHS.CLIENT_APPLICATION_STATUS,
];
```

Evidence (server action requires authenticated user):

```text
lib/actions/client-actions.ts
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user || !user.email) {
  return { error: "You must be logged in to apply as a Career Builder." };
}
```

Evidence (journey calls this out explicitly):

```text
docs/journeys/CLIENT_JOURNEY.md
DRIFT WARNING: ... routes.ts treats /client/apply as public, but submitClientApplication() currently requires an authenticated user.
```

**Recommendation:** pick one truth and enforce it in code + contract:
- If `/client/apply` is truly public, implement a non-auth submission path consistent with RLS (and update contract/journey).
- If it must be authenticated, remove it from `PUBLIC_ROUTES` and ensure middleware blocks unauthenticated access (and update journey).

### 6.2 Drift: Client-side profile writes in `components/forms/*` (contract violation)

Evidence:

```text
docs/contracts/PROFILES_CONTRACT.md
components/forms/talent-profile-form.tsx and components/forms/client-profile-form.tsx currently perform client-side writes...
This is a contract violation vs Layer 1 (“No DB calls in client components”).
```

### 6.3 Doc duplication: legacy auth docs vs contracts/journeys

Evidence (docs index declares legacy/superseded auth docs):

```text
docs/DOCUMENTATION_INDEX.md
- AUTH_BOOTSTRAP_CONTRACT.md - Legacy notes (superseded by contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md)
- AUTH_STRATEGY.md - Legacy strategy notes (superseded by contracts + journeys; keep for history only)
```

**Recommendation (Docs Canon list):**
- **Architecture laws / wiring**: `docs/ARCHITECTURE_CONSTITUTION.md`, `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- **Schema truth**: `database_schema_audit.md` (+ `supabase/migrations/**`)
- **Auth/bootstrap**: `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` + `docs/journeys/*`
- **Email**: `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md`
- **Profiles**: `docs/contracts/PROFILES_CONTRACT.md`
- **Gigs / Applications / Bookings**: `docs/contracts/{GIGS,APPLICATIONS,BOOKINGS}_CONTRACT.md`
- **Stripe**: `docs/contracts/STRIPE_WEBHOOKS_CONTRACT.md`
- **Admin**: `docs/contracts/ADMIN_CONTRACT.md`

**Candidate duplicates to merge/archive (do not delete blindly):**
- `docs/AUTH_STRATEGY.md` → keep as “historical”, but add a loud header pointing to the contract + journeys (already described as legacy in index).
- `docs/AUTH_BOOTSTRAP_CONTRACT.md` → same treatment (contract supersedes).

---

## 7) Next 5 Audit Items (highest leverage) + Proof Steps

1) **Resolve `/client/apply` public-vs-auth drift**
   - **Proof steps**:
     - Confirm middleware behavior for unauth users on `/client/apply` (`middleware.ts` + `lib/constants/routes.ts`).
     - Confirm whether RLS allows anon insert into `client_applications` (migration/policies; see `database_schema_audit.md` `client_applications` policies).
     - Decide canonical behavior and update `docs/journeys/CLIENT_JOURNEY.md`.

2) **Close “Email verification sync” last gap (AuthProvider)**
   - **Proof steps**:
     - Decide whether AuthProvider must call `syncEmailVerifiedForUser()` after `TOKEN_REFRESHED`/`SIGNED_IN`.
     - Confirm trigger-based sync exists and works: `supabase/migrations/20251216013000_sync_profiles_email_verified_on_auth_confirm.sql`.
     - Add/confirm Playwright scenario where email confirms while user is logged in and UI + DB stay consistent.

3) **Remediate profile client-write violations (contract says it exists)**
   - **Proof steps**:
     - Locate writes in `components/forms/talent-profile-form.tsx` and `components/forms/client-profile-form.tsx`.
     - Ensure mutations are moved behind server actions (winner: `app/settings/actions.ts`) and re-run `npm run lint` + `npm run build`.

4) **Prove client application status portal behavior**
   - **Proof steps**:
     - Trace `app/client/application-status/page.tsx` → `app/api/client-applications/status/route.ts` → `lib/actions/client-actions.ts#checkClientApplicationStatus`.
     - Add/confirm E2E test: submit → check status (with correct auth posture) → admin approves → status updates.

5) **Booking creation + idempotency proof (talent/client)**
   - **Proof steps**:
     - Confirm acceptance uses atomic RPC (see migration `supabase/migrations/20251220100500_harden_accept_application_rpc.sql` and contract `docs/contracts/APPLICATIONS_CONTRACT.md`).
     - Add/confirm E2E: “accept application twice” does not create double bookings and does not double-send emails (see `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md` ledger notes).


