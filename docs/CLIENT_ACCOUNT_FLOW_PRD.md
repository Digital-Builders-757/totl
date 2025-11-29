## Client Account Flow PRD

### Goal
Ensure every new visitor creates a base Supabase account **before** choosing Talent vs Client so we can secure client applications, prevent spam, and keep the onboarding flow consistent across platforms.

### Core requirements

1. **Centralized signup**
   - Public marketing CTA points to a single “Create account” route (no talent/client choice before auth).
   - New `profiles` rows default `account_type` to `NULL`/`unassigned`.
   - After email verification, the existing login + `redirectAfterLogin` flow inspects `account_type` and routes appropriately.

2. **Role selection post-login**
   - Create `/onboarding/select-account-type` backed by a simple server action (`updateAccountType('talent' | 'client')`).
   - Protect the page with the same middleware/auth guard stack used elsewhere (`/login?returnUrl=...`).
   - Talent selection keeps the user on the existing talent dashboard.
   - Client selection keeps `account_type` as talent (for now) but triggers `/client/apply` so this login can also submit a client application.

3. **Authenticated `/client/apply`**
   - Middleware must allow `/client/apply` for any authenticated user (even talent) while keeping other `/client/*` routes gated by client status.
   - The page pre-fills form data from `profiles`/`user` and relies on `client_applications.user_id` (not just `email`).
   - Submissions insert/update rows tied to `auth.uid()` and obey the new RLS policy that uses `auth.email()`/`auth.uid()` to enforce ownership.
   - The status panel now checks `user.id`→`client_applications` to show pending, rejected, or approved messaging.

4. **Talent header CTA**
   - Logged-in Talent users see an “Apply to be a Client” link that hits `/client/apply`.
   - The ability to book gigs remains part of their talent dashboard; client status is driven by an approved `client_applications` entry rather than flipping `account_type`.

### Guardrails

- **Backfill `profiles.account_type`:** update legacy rows so admins → `admin`, talent → `talent`, already-approved clients → `client`. This prevents current users from being forced into the select page.
- **Redirect precedence:** `returnUrl` should win when safe; otherwise redirect to `/onboarding/select-account-type` for unassigned users before branching by role.
- **RLS + status API:** status endpoints, client application submission, and `client_applications` inserts/queries must rely on `auth.uid()`/`user.id`, not open email parameters.
- **Common-errors checklist:** verify `COMMON_ERRORS_QUICK_REFERENCE.md` entries covering middleware, RLS, and Next.js auth flows still apply after the change.

### Implementation notes

- Reuse existing `lib/actions/client-actions.ts` for submitting to `client_applications`.
- Keep email notifications and admin review flows unchanged.
- If approved clients should ever regenerate `profiles.account_type`, we can treat `client_applications.status === 'approved'` as the trigger for dashboard access.
- Update middleware/routes to keep `/client/apply` inside the authenticated surface while ensuring the public CTA still works (redirect to `/login?returnUrl=/client/apply` when logged out).

### Verification

1. `npm run lint`, `npm run build`, and any QA scripts in `COMPREHENSIVE_QA_CHECKLIST.md` should pass.
2. Document the new flow in `MVP_STATUS_NOTION.md` and link back to this PRD.
3. Cross-reference `COMMON_ERRORS_QUICK_REFERENCE.md` and `AUTH_STRATEGY.md` for the updated guardrails.


