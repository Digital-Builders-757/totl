# 🚨 CRITICAL ERROR PREVENTION - MANDATORY CHECKS

**BEFORE PUSHING ANY CODE TO DEVELOP OR MAIN, YOU MUST:**

## **1. SCHEMA & TYPES VERIFICATION**
```bash
# ALWAYS run these commands before pushing
npm run schema:verify:comprehensive
npm run types:check
npm run build
```

## **2. IMPORT PATH VERIFICATION**
**❌ NEVER USE THESE INCORRECT PATHS:**
- `@/lib/supabase/supabase-admin-client` (WRONG - extra `/supabase/`)
- `@/types/database` (WRONG - should be `/types/supabase`)

**✅ ALWAYS USE THESE CORRECT PATHS:**
- `@/lib/supabase-admin-client` (CORRECT)
- `@/types/supabase` (CORRECT)

## **3. COMMON ERRORS TO AVOID**
- **Sentry: `TypeError: fetch failed` on `/gigs/[id]` logged as “Gig not found” (TOTLMODELAGENCY-3R-style):** The Supabase client can fail at the transport layer (`fetch failed`) while the gig may still exist. Treating **any** query error like a missing row returns **404** and mislabels Sentry.
  - **Fix:** On `.single()` gig loads, **`PGRST116`** only → **`notFound()`** without **`logger.error`**; all other errors → **`logger.error("Failed to load gig", …, { gigId })`** and **rethrow** so the route can surface an error boundary / **5xx**.
  - **Prevention:** Do not treat every failed `.single()` like a missing row (for example `if (error || !gig) { logger.error("not found"); notFound(); }`); branch on **`error.code`** (and keep invalid id guards, e.g. **`isValidUuid`**, separate from DB outages).
- **Public gig pages leaked full title/description to guests:** `getGigDisplayTitle` / `getGigDisplayDescription` used to return real copy for any non-talent viewer, so **guests** on **`/gigs/[id]`** saw the full DB strings. **Fix:** Gate on **`canViewFullGigMarketingCopy`** (subscribed talent, client, admin only); use **`GigReferenceLinksGate`** for external reference URLs. **Prevention:** Do not render raw **`gig.title`** / **`gig.description`** on marketing surfaces; keep apply-page headers on the same helpers as detail.
- **Portfolio finalize falsely fails after upload (`storage.list` + 1000 limit):** Verifying an upload by listing the user folder can miss the new object when many files exist (prefix sort / pagination). **Fix:** Use **`storage.from(bucket).exists(fullPath)`** (or `info(path)`) for an O(1) check on the exact key. **Prevention:** Do not rely on `list(..., { limit: N })` to prove a specific object exists.
- **Portfolio finalize shows “verify upload” when the file is actually missing:** In some supabase-js versions, **`storage.exists()`** can return **`data: false`** together with a **non-null `error`** for a non-existent object ([supabase-js#1363](https://github.com/supabase/supabase-js/issues/1363)). **Fix:** If **`data === false`**, treat as “not in storage” (user-facing re-upload path) **before** treating **`error`** as an infra failure. **Prevention:** Do not branch on **`error` alone** after `exists()` without considering **`data === false`**.
- **Supabase head count query looks like “zero rows” on failure:** `.select("id", { count: "exact", head: true })` can return **`error`** with **`count: null`**. Using **`result.count ?? 0`** hides outages and wrong-sides UX (e.g. missing “existing applicants” warning).
  - **Fix:** Check **`result.error`**, log it, and choose a **fail-safe** (e.g. assume count > 0 for warnings) or return an error state—not **`?? 0`** alone.
  - **Prevention:** Any **`head: true`** count used for gating or warnings must branch on **`error`** first.
- **Sentry / Admin: `AuthApiError: Database error deleting user` on `POST /api/admin/delete-user` (TOTLMODELAGENCY-2Z / 3T-style):** GoTrue wraps the underlying Postgres failure; common cause is a **foreign key** blocking cascade when deleting `auth.users` (e.g. `public.content_flags.assigned_admin_id` still **`NO ACTION`** and points at the talent profile being removed).
  - **Fix:** Apply migration `20260414120000_repair_fks_for_auth_user_delete.sql` (`ON DELETE SET NULL` on `assigned_admin_id`, cascade repairs). Use **`supabase/diagnostics/auth-user-delete-fk-audit.sql`** in the Supabase SQL editor to list FK `delete_rule` to `auth.users` / `profiles(id)`; check Postgres logs for **`23503`** and constraint name.
  - **API behavior:** Route logs structured details + Sentry context; generic wrapped message maps to **409** with guidance to **Suspend User** if delete still cannot complete.
  - **Prevention:** Do not rely on `CREATE TABLE IF NOT EXISTS` alone to upgrade FKs; use explicit `ALTER TABLE ... DROP/ADD CONSTRAINT` migrations when delete semantics change.
- **Admin API routes return 401/403:** `POST /api/admin/create-user`, `GET /api/admin/test-connection`, `GET /api/admin/check-auth-schema` require authenticated admin.
  - **Fix:** Ensure caller is signed in with `profiles.role = 'admin'`. Use `requireAdmin()` from `@/lib/api/require-admin` for new admin routes.
  - **Prevention:** All admin API routes must call `requireAdmin()` (or equivalent) before performing admin operations.
- **Admin Playwright tests fail at `ensureAdminUser` / `expect(res.ok()).toBeTruthy()`:** Tests used to call `POST /api/admin/create-user` to bootstrap admin; that endpoint now requires admin auth.
  - **Fix:** Admin tests rely on `test:qa:route-users:preflight` (`ensure-ui-audit-users.mjs`) which creates admin@totlagency.com via Supabase service role before Playwright runs. Do not call create-user from tests.
  - **Prevention:** `tests/helpers/admin-auth.ts` `loginAsAdmin()` logs in with pre-seeded credentials; preflight must run before admin route specs.
- **Schema Sync Errors:** `types/database.ts is out of sync with remote schema`
  - **Fix:** Run `npm run types:regen:dev` (development) or `npm run types:regen:prod` (production)
  - **Prevention:** After applying migrations to remote, always regenerate types and commit. Manual type edits drift from remote.
- **Types stay stale after adding a migration:** Code references a new column but `npm run types:check` still fails.
  - **Fix:** Apply migrations to the target Supabase project first (`supabase db push --linked` or your deploy pipeline), then run `npm run types:regen:dev` and commit the regenerated `types/database.ts`.
  - **Prevention:** Do not patch `types/database.ts` by hand for schema you have not pushed yet; the generator is the source of truth once the column exists remotely.
- **`tsc` / `npm run typecheck` fails with missing `app/.../page.js` under `.next/types` after deleting or moving App Router routes:** Stale Next.js generated types still reference removed files.
  - **Fix:** Delete the `.next` folder and run `npm run typecheck` (or `npm run build`) again so types regenerate from the current `app/` tree.
  - **Prevention:** After removing routes locally, run a fresh build or remove `.next` before relying on `tsc` in an old workspace.
- **Next.js production build: webpack pack cache ENOENT / missing `.next/server/pages-manifest.json` (often Windows + long paths):** Persistent webpack filesystem cache can fail mid-build on some setups.
  - **Fix:** Repo **`next.config.mjs`** disables webpack persistent cache for **`!dev`** on **`win32`** only (and when **`DISABLE_NEXT_WEBPACK_CACHE=1`**). On a non-Windows machine hitting the same failure, set **`DISABLE_NEXT_WEBPACK_CACHE=1`** for that build.
  - **Prevention:** Do not force **`config.cache = false`** for all platforms unless necessary; it slows CI and Vercel.
- **Radix Dialog / drawer: full-screen dim overlay but no visible panel (“black screen”):** `DialogContent` is **`fixed`** + **`z-50`** in **`components/ui/dialog.tsx`**, but **`.panel-frosted`** in **`app/globals.css`** sets **`position: relative`** in **`@layer utilities`** after **`@tailwind utilities`**, so **`relative` can win** over **`fixed`** on the same node. The overlay stays **`fixed inset-0`**, while the panel is not stacked as intended.
  - **Fix:** On affected **`DialogContent`** instances, add **`!fixed z-[51]`** (or any **`z` strictly above the overlay**) so the panel stays fixed and paints above the backdrop. Used for admin/client mobile nav drawers and admin users disable/delete confirmations.
  - **Prevention:** Prefer a composable surface class that does not set **`position`** when used on portaled overlays, or document that **`panel-frosted` + Dialog** must pair with **`!fixed`**.
- **Radix Select / opportunity form: generic client-side exception on create or edit:** A controlled **`Select`** from **`components/ui/select.tsx`** must use **`value={undefined}`** when nothing is selected (never **`""`**), and the **`value` must match a `SelectItem`**. DB categories such as **`other`** are not in **`VISIBLE_GIG_CATEGORIES`**, so loading them into **`value`** without mapping can crash the page.
  - **Fix:** Use **`selectValueFromCategory`** and **`categoryForOpportunitySelect`** from **`lib/opportunity-form-helpers.ts`** (see **`PostGigClient`** and admin/client edit **`initialValues`**).
  - **Prevention:** Normalize legacy / non-visible categories before binding the Select; keep server-side validation in **`createGigAction`** / **`updateGigAction`** aligned with the same rules.
- **Import Path Errors:** `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'`
  - **Fix:** Use correct path `@/lib/supabase-admin-client`
- **Missing Import Errors:** `ReferenceError: createNameSlug is not defined`
  - **Fix:** Add `import { createNameSlug } from "@/lib/utils/slug";` at top of file
  - **Prevention:** When using utility functions, always verify import exists
  - **Check:** Run `grep -r "createNameSlug" <file>` and verify import line exists
- **Admin Profile Viewing Blocked:** Admin clicking "View Talent Profile" or "View Career Builder Profile" redirects to dashboard
  - **Fix:** Ensure middleware exception allows `/client/profile?userId=<uuid>` for admins (UUID validated)
  - **Fix:** Ensure `/client/profile/page.tsx` accepts `userId` param and allows admin override
  - **Fix:** Ensure non-admin clients cannot view other clients (force `targetUserId = user.id` for non-admins)
  - **Prevention:** See `docs/ADMIN_VISIBILITY_AUDIT_REPORT.md` for full audit and fixes
- **View Profile 404 / wrong person / breaks on special characters:** "View Profile" links using name slugs (`createNameSlug`) can fail for single-word names, empty parts, special chars (José, François), or duplicate names.
  - **Fix:** Use `user_id` (UUID) for all View Profile links: `/talent/${user_id}`. Talent profile route supports UUID via `user_id.eq.${slug}`. Internal links in admin (talent, users, applications), client (applications, bookings), and talent dashboard now use UUID.
  - **Prevention:** Never use `createNameSlug` for internal View Profile links; always use `user_id` or `talent_id` (profiles.id).
- **Moderation Queue Fails to Load:** `/admin/moderation` throws "relation content_flags does not exist"
  - **Root Cause:** Missing `public.content_flags` table in the target Supabase project
  - **Fix:** Apply the moderation migration (`supabase db push`) that creates `content_flags` + policies
  - **Prevention:** Verify `to_regclass('public.content_flags')` returns non-null after deploy
- **Notification badge/dropdown empty or errors:** "relation user_notifications does not exist"
  - **Root Cause:** Migration `20260313120000_add_user_notifications.sql` not applied yet
  - **Fix:** Run `supabase db push` (or `supabase db reset` for local) to apply the migration
  - **Prevention:** Apply migration before deploying notification feature code
- **Duplicate welcome / admin alert emails for one talent signup:** Two overlapping **`getBootState`** / **`getBootStateRedirect`** invocations could both see **`welcome_email_sent_at`** (or admin timestamp) still **null** and send twice before updating **`profiles`**.
  - **Fix:** `processTalentOnboardingSideEffects` uses **claim-then-send**: **`UPDATE ... WHERE id = ? AND welcome_email_sent_at IS NULL`** (same for admin column), **`select("id")`**, send only when **exactly one row** is returned.
  - **Prevention:** Do not send onboarding emails based only on an in-memory profile snapshot; always serialize “first send” via the conditional update (or an equivalent DB RPC).
- **Admin “new member” notifications / boot email columns missing:** Postgres errors on **`new_member_signup`**, **`welcome_email_sent_at`**, or **`admin_new_member_email_sent_at`**
  - **Root Cause:** Migration `20260417180000_new_member_admin_notifications.sql` not applied to the target database
  - **Fix:** `supabase db push --linked` (or your pipeline), then `npm run types:regen` and commit `types/database.ts`
  - **Prevention:** Ship schema before or with app code that selects those columns or uses the new enum label
- **Portfolio images not loading (404 or broken):** `portfolio_items.image_url` stores the **storage path** (e.g. `user-id/portfolio-123.jpg`), not the full URL.
  - **Fix:** Use `publicBucketUrl("portfolio", item.image_url)` when building image URLs for display. Applied in Settings page, portfolio-actions, admin talent dashboard.
  - **Prevention:** All portfolio display paths must convert storage path to full URL via `publicBucketUrl`.
- **Portfolio upload: finalize step says file not found in storage:** After `uploadToSignedUrl`, the server lists `portfolio/{userId}/` to confirm the object before inserting `portfolio_items`. RLS/list limits or a slow write can make this fail even when the upload succeeded.
  - **Fix:** Retry once; verify Storage policies allow the authenticated user to **list** objects under their prefix (see `supabase/migrations/20260314031246_ensure_portfolio_bucket_exists.sql`). See `docs/contracts/PORTFOLIO_UPLOADS_CONTRACT.md`.
- **Admin cannot close gig — `42501` RLS on `gigs` (TOTLMODELAGENCY-3N):** `closeGigAsAdminAction` or similar returns “new row violates row-level security policy for table \"gigs\"”.
  - **Root Cause:** Legacy admin policies that subquery `profiles` under RLS can deny the **updated** row’s `WITH CHECK` in some cases.
  - **Fix:** Apply migration `20260411220101_fix_admin_gigs_rls_and_helpers.sql` (adds `public.totl_user_is_admin()` and explicit admin gig policies). Run `supabase db push` on the target project.
  - **Prevention:** Prefer `SECURITY DEFINER` admin helpers + explicit `USING`/`WITH CHECK` on admin `UPDATE` policies for tables clients also update.
- **Admin delete gig fails (RLS) even though `DELETE` on `gigs` is allowed — often cascaded `bookings`:** Deleting a row in `public.gigs` cascades to `public.bookings` (`ON DELETE CASCADE`). Under RLS, **each** cascaded `DELETE` must pass that table’s policies; `bookings` historically had **no** `DELETE` policy, so the whole statement could fail.
  - **Fix:** Apply migration `20260412180000_admin_delete_bookings_for_gig_cascade.sql` (`Admins can delete bookings` using `public.totl_user_is_admin()`).
  - **Prevention:** When adding `ON DELETE CASCADE` children of RLS-protected parents, ensure admins have a `DELETE` policy (or a single `SECURITY DEFINER` RPC) for child tables that will be cascade-deleted.
- **Admin UI used to block “Delete permanently” when `applications_count > 0`:** Product + server action intentionally prevented hard delete so listings with applicants were only closed.
  - **Current behavior:** Admin confirm can delete the gig and cascade-remove applications (destructive). Use **Close** when history must be kept.
  - **Prevention:** Train ops: confirm dialog text includes application counts; prefer **`docs/runbooks/production-gig-cleanup.md`** for bulk SQL in production.
- **Sentry: `[cron/booking-reminders] CRON_SECRET is not configured` (TOTLMODELAGENCY-3K):** Preview or branch deploys hit the cron URL without `CRON_SECRET`.
  - **Fix:** Set `CRON_SECRET` on environments that should run reminders; ignore noise from previews or disable cron there. Code path uses `console.warn` (not `logger.warn`) so this no longer opens Sentry issues for expected misconfig.
  - **Prevention:** Document required cron env vars in Vercel project settings.
- **Next.js `UnrecognizedActionError` / failed to find server action on `/admin/gigs/create` (TOTLMODELAGENCY-3G):** Client bundle references a stale server-action id after deploy or uses a client-wrapped action.
  - **Fix:** Bind forms to an exported server action from a `"use server"` module (e.g. `useActionState(createGigFormAction, null)`); include file fields via named `<input type="file" name="...">` where possible. Users with old tabs may need a hard refresh after deploy.
  - **Prevention:** Avoid inline client `useActionState` wrappers that indirectly invoke server actions for critical submits.
- **Admin create gig: cover preview shows but `gig_image` missing on submit (drag-and-drop):** Dropping a file updates React preview state but not the native `<input type="file">`, so multipart **`FormData`** has no file for **`formFieldName`**.
  - **Fix:** After accepting a dropped file, assign it to the input with `DataTransfer` (`items.add(file)` then `input.files = dataTransfer.files`). Implemented in `components/gigs/gig-image-uploader.tsx` as `syncNativeFileInput`.
  - **Prevention:** Any custom drop handler that participates in native form submission must keep the hidden file input in sync, not only `FileReader` preview state.
- **StorageApiError: Bucket not found (TOTLMODELAGENCY-3B):** Portfolio upload on POST /settings fails with "Bucket not found".
  - **Root Cause:** The `portfolio` storage bucket does not exist in the production Supabase project (migration not applied or project set up before portfolio migration).
  - **Fix:** Run `supabase db push` to apply migration `20260314031246_ensure_portfolio_bucket_exists.sql` which creates the portfolio bucket and policies idempotently.
  - **Prevention:** Ensure all storage bucket migrations are applied to production before deploying portfolio upload features.
- **Import Order Errors:** `import/order` warnings in linting
  - **Fix:** Run `npm run lint -- --fix` or manually reorder imports
- **MVP tracker date is stale despite new updates:** `MVP_STATUS_NOTION.md` footer still shows an old "Last Updated" date
  - **Root Cause:** Session updates were added in-body, but the footer metadata block was not updated in the same commit
  - **Fix:** Whenever `MVP_STATUS_NOTION.md` changes, update the footer lines at the end of the file (`Last Updated`, `Current Status`, `Next Review`) before ship
  - **Prevention:** Treat footer metadata sync as a required pre-push checklist item for all MVP doc edits
- **CI typecheck step fails:** Build job fails at "Run type checking" step
  - **Fix:** Run `npm run typecheck` locally to reproduce; fix TypeScript errors before pushing
  - **Prevention:** CI now enforces typecheck as a real gate (no longer continue-on-error); run `npm run typecheck` as part of pre-push
- **Type Errors:** `Property 'role' does not exist on type 'never'`
  - **Fix:** Ensure Database type is imported from `@/types/supabase`
- **Stripe API Version Errors:** `Invalid Stripe API version format with unsupported '.clover' suffix`
  - **Fix:** If you hit this at runtime, use a plain `YYYY-MM-DD` version in production code. If you hit a **TypeScript** error like `TS2322: Type '"2024-06-20"' is not assignable to type '"2025-11-17.clover"'`, align the constant with the installed Stripe typings (or update Stripe deps to remove the mismatch).
- **Stripe Property Access Errors:** `Property 'current_period_end' does not exist on type 'Subscription'`
  - **Fix:** Use subscription items: read `current_period_end` from `subscription.items.data[n]` and fall back to legacy property only if available.
- **Profile Type Mismatch Errors:** `Type 'Partial<Profile>' is missing required properties`
- **Fix:** Do **not** widen queries to `select("*")`. Instead, **narrow the component prop type** to the columns it actually uses (e.g., `Pick<Profile, "role" | "subscription_status">`) and keep **explicit column selects** in the query.
- **Subscription Plan Detection Errors:** Silent fallback to `'monthly'` when `subscription.items` missing or price IDs not matched
  - **Fix:** Check every subscription item, fall back to `subscription.metadata.plan`, and if still unknown retain the existing `profiles.subscription_plan` value to avoid data loss.
- **Redirect Errors Intercepted in try/catch Blocks:** `redirect()` throws special error that gets swallowed by `try/catch` in Server Components or Client Components
  - **Fix:** Use `isRedirectError(error)` helper from `@/lib/is-redirect-error` and rethrow when true so Next.js can continue the redirect
  - **Example:** In Server Components with try-catch, check `if (isRedirectError(error)) throw error;` before handling other errors
- **Middleware Always Sees `userId: null` After Login:** Middleware logs show `userId: null` even after successful login, causing redirect loops
  - **Root Cause:** Browser client was using `createClient` (localStorage-only) instead of `createBrowserClient` from `@supabase/ssr` (cookie-based). Middleware can't read localStorage.
  - **Fix:** Switch browser client to `createBrowserClient` from `@supabase/ssr` in `lib/supabase/supabase-browser.ts`
  - **Additional Fix:** Ensure middleware preserves cookies on redirects using `redirectWithCookies` helper (prevents cookie loss during navigation)
  - **Prevention:** Always use `createBrowserClient` from `@supabase/ssr` for browser clients when middleware needs to read session state
  - **Verification:** After login, check DevTools → Cookies → Should see `sb-*` cookies. Middleware logs should show `userId` not null.
- **Login Redirect Not Happening / Tests Timing Out:** User stuck on login page after successful sign-in, Playwright tests timeout waiting for redirect
  - **Symptom:** Login succeeds but redirect doesn't happen, user stays on `/login` page
  - **Root Cause:** SIGNED_IN event may not fire, cookies may not be set, or middleware may not receive cookies
  - **Fix:** Use "three truths" logging to diagnose:
    1. Check browser console for `[auth.signIn]` and `[auth.onAuthStateChange]` logs
    2. Verify `cookieSb: true` in `[auth.onAuthStateChange]` log
    3. Set `DEBUG_ROUTING=1` and check server logs for `[totl][middleware] cookie names` with `hasSb: true`
  - **Prevention:** See `docs/AUTH_THREE_TRUTHS_LOGGING_IMPLEMENTATION.md` for complete logging implementation
  - **Prevention:** Run `tests/auth/three-truths-logging.spec.ts` to verify all three truths are proven
  - **Verification:** All three truths must be true: SIGNED_IN fires, cookies exist in browser, middleware receives cookies
- **UI screenshot automation fails with `login_failed:remained_on_login`:** Capture manifests show route failures even when server is running
  - **Symptom:** `scripts/capture-ui-audit.mjs` logs many `login_failed:remained_on_login` rows (often non-admin only)
  - **Symptom:** manifest rows show `login_failed:page.waitForSelector` with `locator('body') ... hidden` and capture can hang in a long-running process
  - **Root Cause:** Seeded credentials are missing/stale for target roles, or login submit runs before hydration marker reaches `ready`
  - **Fix:** Wait for `[data-testid="login-hydrated"]` text `ready` before submit, increase redirect wait, and validate credentials manually per role in the same environment
  - **Fix:** run `node scripts/ensure-ui-audit-users.mjs` immediately before rerun, then rerun capture; if process hangs, stop it and retry after validating login manually
  - **Fix:** Use `scripts/capture-admin-evidence.mjs` to unblock admin evidence while re-seeding non-admin accounts
  - **Verification:** Run `node scripts/capture-ui-audit.mjs` and confirm failures are not auth-related before treating as UI regressions
- **Loading states flash white and break dark immersion:** Route loading skeletons used `bg-white`/`bg-gray-50`/`via-white` gradients, causing jarring white flashes during navigation.
  - **Fix:** Use `bg-black page-ambient` for loading wrappers; skeletons use `bg-white/10`; spinners use `text-white`. Applied to talent dashboard, client gigs, settings, auth callback, talent signup, dashboard, about, update-password, reset-password, verification-pending.
- **Invalid input syntax for type uuid on /gigs/[id]:** Crawlers/bots hit /gigs/2, /gigs/4, etc. Supabase throws because `id` is not a valid UUID.
  - **Fix:** Validate UUID format before querying in `app/gigs/[id]/page.tsx`. If invalid, call `notFound()` immediately. Sentry: TOTLMODELAGENCY-3C.
- **[cron/booking-reminders] Unauthorized cron request (TOTLMODELAGENCY-3D):** Vercel Cron invokes the endpoint without `Authorization: Bearer <CRON_SECRET>` because `CRON_SECRET` is not set in Vercel Production env.
  - **Fix:** Add `CRON_SECRET` to Vercel → Settings → Environment Variables (Production). Generate with `openssl rand -hex 32`. Redeploy. See `docs/troubleshooting/CRON_SECRET_SETUP.md`.
- **[totl][email] password reset link generation failed (TOTLMODELAGENCY-3A):** User requests password reset for an email not in the system. Supabase returns "User with this email not found". Expected; route returns success to avoid leaking user existence.
  - **Fix:** Filtered in Sentry via `shouldFilterExpectedEmailLinkGenerationNoise`. No code change needed; this is expected user behavior.
- **[totl][email] verification link generation failed (TOTLMODELAGENCY-39):** User requests verification for an already-registered email. Supabase returns "A user with this email address has already been registered". Expected; route returns success.
  - **Fix:** Filtered in Sentry via `shouldFilterExpectedEmailLinkGenerationNoise`. No code change needed; this is expected user behavior.
- **Gig card images not showing on /gigs:** After adding spotlight glow border, images disappeared. Root causes: (1) Spotlight pseudo-elements (`::before`/`::after`) stacked above card content — add `z-index: -1` so glow sits behind; (2) `aspect-4-3` class only defined in `@media (max-width: 768px)` — on desktop the image container had no aspect ratio and collapsed. Fix: use Tailwind `aspect-[4/3]` for all viewports.
- **Hydration error: `<a> cannot be a descendant of <a>`:** Gig card had outer Link wrapping the card and inner Link on View Details button. Fix: For browse/featured variants, render the button as a `<span>` (no Link) since the parent card Link handles navigation.
- **Gig detail right sidebar overlays main content:** On `/gigs/[id]`, the Apply/Quick Info sidebar overlaps Gig Details and Client Information when scrolling.
  - **Root Cause:** Apply card used `sticky top-6`; sticky inside grid causes the sidebar to float over the main column.
  - **Fix:** Remove `sticky top-6` from the Apply card; add `lg:self-start` to the sidebar wrapper for top alignment without overlay.
  - **Prevention:** Avoid `position: sticky` in grid layouts unless parent has no `overflow: hidden/auto` and proper containment.
- **Duplicate signup shows no browser feedback:** User tries to sign up with an existing email but sees nothing in the UI (error only in console).
  - **Root Cause:** Form checked only for "User already exists"; Supabase returns "User already registered" when confirmations are disabled. When confirmations are enabled, Supabase returns a fake user (empty `identities`) with no error.
  - **Fix:** Talent signup form now detects all duplicate-email variants and the fake-user case; shows toast + inline alert with "Sign in" link.
  - **Prevention:** See `components/forms/talent-signup-form.tsx` — `isDuplicateFromError` and `hasFakeUserFromDuplicate` logic.
- **Client Dashboard Error State Not Displayed:** Error state (`supabaseError`) is set but never rendered, leaving users with blank dashboard
  - **Fix:** Add error display banner/alert component that shows when `supabaseError` is set, with retry button to call `fetchDashboardData()` again
  - **Prevention:** Always render error states in UI, even if error handling exists in code
  - **See:** `docs/BUGBOT_FIXES_PLAN.md` for full implementation details
- **Form Stuck in Submitting State:** Dynamic Sentry import fails, blocking `setError()` and `setSubmitting(false)` execution
  - **Fix:** Wrap dynamic Sentry import (`await import("@sentry/nextjs")`) in try-catch block to ensure error handling always completes
  - **Fix:** Wrap `logger.error()` in try-catch inside catch blocks so logging failures never block UI recovery (setError, setSubmitting)
  - **Prevention:** Always wrap dynamic imports in error handling, especially in catch blocks
  - **See:** `docs/BUGBOT_FIXES_PLAN.md` for full implementation details
- **Playwright strict mode: "resolved to 2 elements" for getByPlaceholder:** Test fails with `strict mode violation: getByPlaceholder(...) resolved to 2 elements`
  - **Symptom:** mobile-guardrails CI fails on client-applications route; loading skeleton and page content share same placeholder
  - **Fix (option A):** Use a distinct placeholder in loading.tsx (e.g. "Search...") so the test locator matches only the real content
  - **Fix (option B):** Append `.first()` to the locator when multiple elements are expected (e.g. skeleton + real content): `page.getByPlaceholder("...").first()`
- **Upcoming only filter hides gigs for non-UTC users:** Sentry/bugbot reports "Upcoming only" uses server UTC date, hiding gigs that are still "today" for users in other timezones
  - **Symptom:** User in New York at 11 PM March 12th sees no gigs for March 12th (server UTC is already March 13th)
  - **Fix:** Pass user's local date from client on form submit; use `local_date` query param when valid YYYY-MM-DD; fall back to UTC for direct links/pagination
  - **Implementation:** Client component adds hidden `local_date` input on submit via `new Date().toLocaleDateString("en-CA")`; server reads `local_date` from searchParams when `upcoming` is true
- **compensation_numeric regex crashes gig INSERT:** Migration regex `[\d,\.]+` matches dot-only (e.g. "Negotiable.") or invalid numbers ("1.2.3"), causing ::numeric cast to fail
  - **Symptom:** Gig creation fails when compensation text contains only punctuation or multiple decimal points
  - **Fix:** Use regex `[0-9][0-9,]*(?:\.[0-9]+)?` — requires at least one digit, at most one decimal; use non-capturing `(?:...)` so regexp_match [1] returns full match
  - **Migration:** Create new migration to drop and re-add compensation_numeric with the safer regex (never edit existing migrations)
- **compensation_numeric capture group breaks pay range:** Pattern `(\.[0-9]+)?` creates a capture group; PostgreSQL regexp_match [1] returns only that group (decimal part), not full number
  - **Symptom:** Integer compensations (e.g. "$1,500") produce NULL; decimals (e.g. "$1,500.50") produce 0.50 instead of 1500.50; pay range filter returns wrong/empty results
  - **Fix:** Use non-capturing group `(?:\.[0-9]+)?` so [1] returns the full matched number
  - **Migration:** `20260312211447_fix_compensation_numeric_regex_non_capturing.sql`
- **"Lowest pay first" sort shows unknown-pay gigs first:** pay_low used `nullsFirst: true`, placing NULL compensation_numeric at top
  - **Fix:** Use `nullsFirst: false` for both pay_high and pay_low so unknown-compensation gigs appear last
- **Saved search "name already used":** Unique constraint on (user_id, name) prevents duplicate names
  - **Fix:** Choose a different name or delete the existing saved search with that name
- **Saved search "You can save up to 25 searches":** Max limit per user to keep list usable
  - **Fix:** Delete one or more saved searches via Manage dialog
- **Pay range "Under $500" excludes 499.01–499.99:** Filter used `max: 499` with `.lte()`, creating a gap
  - **Fix:** Use `max: 499.99` in `getPayRangeBounds` for `under_500` case
  - **Prevention:** Loading skeletons should not duplicate exact placeholder text from the real form inputs; or use `.first()` in specs when both are present
- **Logger error wrapping defeats structured extraction (Cursor Bugbot):** Pattern `err instanceof Error ? err : new Error(String(err))` passed to `logger.error()` loses Supabase error fields (message, code, details, hint)
  - **Symptom:** Sentry shows "[object Object]" or generic messages instead of PostgrestError details
  - **Fix:** Pass the raw error directly: `logger.error("message", err)` — the logger's `toError` and `safeExtraFromError` handle non-Error objects correctly
  - **Avoid:** Manual wrapping; server-side files (boot-actions, portfolio-actions) correctly pass errors directly
- **Dashboard Infinite Loading:** `useSupabase()` hook excluded from useEffect dependencies, causing effect to run once with null client and never re-run when client initializes
  - **Fix:** Include `supabase` in useEffect dependency array to handle null → non-null transition
  - **Prevention:** Always include hooks that return null initially in dependencies, even if they're "memoized singletons"
  - **See:** `docs/BUGBOT_FIXES_PLAN.md` for full implementation details
- **Infinite Loading Spinner on Dashboard:** Dashboard stuck in loading state when data queries fail
  - **Fix:** Always call `setLoading(false)` in `finally` blocks to prevent infinite spinner
  - **Fix:** Decouple widget loading states from dashboard shell (e.g., separate `applicationsLoading`/`applicationsError` states)
  - **Fix:** Ensure `createSupabaseBrowser()` throws in production if env vars missing (no null returns)
  - **Prevention:** See `docs/TALENT_DASHBOARD_UPGRADES_IMPLEMENTATION.md` for complete implementation guide
  - **Prevention:** Always check for redirect errors before handling other errors in catch blocks that contain `redirect()` calls
- **Auth Timeout / Infinite Loading from Stale Tokens:** Dashboard shows infinite loading spinner in normal browser but works in incognito
  - **Symptom:** Auth bootstrap never completes, loading spinner never stops, but incognito works fine
  - **Root Cause:** Stale Supabase auth tokens in localStorage/cookies cause auth bootstrap to hang
  - **Fix:** Implement 8-second timeout guard in `AuthProvider` that shows recovery UI with "Clear Session" button
  - **Fix:** Recovery UI component (`auth-timeout-recovery.tsx`) clears localStorage and redirects to login
  - **Prevention:** See `docs/AUTH_TIMEOUT_RECOVERY_IMPLEMENTATION.md` for complete implementation guide
  - **Prevention:** Add breadcrumb logging at critical auth checkpoints for production debugging
- **Supabase auth-js lock AbortError noise:** `AbortError: signal is aborted without reason` from `@supabase/auth-js/.../locks.js`
  - **Symptom:** Sentry shows unhandled AbortError during navigation/redirects (often alongside `auth.bootstrap` abort breadcrumbs)
  - **Root Cause:** Supabase auth lock is aborted during navigation; expected behavior, not a functional error
  - **Fix:** Filter this specific AbortError in `instrumentation-client.ts` by stack frame (auth-js locks) and add a breadcrumb for counting
  - **Prevention:** Keep auth bootstrap single-runner + avoid duplicate clients; rely on `getUser()` for bootstrap
- **Reset Password Page White-on-White Text:** Reset password page heading and labels are invisible (white text on white background)
  - **Symptom:** Users cannot read "Reset Password" heading or form labels on `/reset-password` page
  - **Root Cause:** Missing text color classes on heading and Label components
  - **Fix:** Add `text-gray-900` class to `<h1>` heading and `<Label>` components
  - **Prevention:** Always specify text colors explicitly on white backgrounds, especially in form pages
- **Password reset link lands in broken `/update-password` state (`missing credentials`):**
  - **Symptom:** User opens reset link and sees "missing credentials" while still seeing a password form, or gets redirected away unexpectedly.
  - **Root Cause:** Recovery tokens can arrive in URL hash with different shapes (`access_token` + `refresh_token` OR `token_hash`), and the gate handled only one shape or rendered the form before token readiness.
  - **Fix:** In `app/update-password/update-password-client-gate.tsx`, implement a strict gate state machine (`checking`/`ready`/`failed`) and support both hash token modes:
    - `setSession({ access_token, refresh_token })` when both are present
    - `verifyOtp({ type: "recovery", token_hash })` when only `token_hash` is present
  - **Prevention:** Keep `/update-password` form rendering behind token-readiness gate only; never render form during failed token validation.
- **Password recovery bounces off `/update-password` after `SIGNED_IN`:**
  - **Symptom:** User clicks a valid reset link, page briefly loads `/update-password`, then gets redirected to login/dashboard before they can submit a new password.
  - **Root Cause:** `/update-password` is intentionally in `AUTH_ROUTES`; once `setSession()`/`verifyOtp()` emits `SIGNED_IN`, generic auth-route redirect logic can treat the page as a normal signed-in redirect surface.
  - **Fix:** Add a narrow, intent-scoped exception in both redirect owners:
    - `components/auth/auth-provider.tsx`: skip signed-in auth-route redirect only when `pathname === "/update-password"` and active recovery intent exists.
    - `middleware.ts`: allow signed-in `/update-password` requests through (refresh/hard-nav path).
    - Scope the exception using `sessionStorage` recovery marker + `?recovery=1`, and clear marker on successful password update.
  - **Prevention:** Keep `/update-password` in `AUTH_ROUTES` (semantic correctness), but gate exceptions by explicit recovery intent and short TTL to avoid broad redirect bypass.
- **Suspended users can access `/update-password` due to middleware check ordering:**
  - **Symptom:** A suspended signed-in user reaches `/update-password` instead of being redirected to `/suspended`.
  - **Root Cause:** An early middleware return for `PATHS.UPDATE_PASSWORD` runs before profile fetch and `is_suspended` enforcement.
  - **Fix:** In `middleware.ts`, keep `/update-password` allow-through only after:
    - `auth.getUser()` confirms signed-in user
    - profile query fetches `role, account_type, is_suspended`
    - suspension redirect check runs (`is_suspended -> /suspended`)
  - **Prevention:** Treat `/update-password` as a terminal-like exception only after security gates; never place this exception before suspension enforcement.
- **Stale password recovery intent suppresses expected auth-route redirects after failed token exchange:**
  - **Symptom:** User hits invalid/expired reset link, but stale recovery intent can linger and alter auth-route behavior for the TTL window.
  - **Root Cause:** Recovery intent marker is set before token exchange and not cleared on all failure branches.
  - **Fix:** In `app/update-password/update-password-client-gate.tsx`, clear `PASSWORD_RECOVERY_INTENT_KEY` on all failure paths (`missing_token`, `invalid_token`, and outer catch); only keep intent when gate reaches `ready`.
  - **Prevention:** Use one cleanup helper in the recovery gate and call it on every non-ready exit path.
- **AuthSessionMissingError Sentry noise:** Sentry reports many `AuthSessionMissingError` events from authentication bootstrap
  - **Symptom:** Sentry shows `AuthSessionMissingError` events from guest mode on public pages (like `/`)
  - **Root Cause:** Bootstrap calls `getUser()` even when no session exists, causing `AuthSessionMissingError` to be thrown
  - **Fix:** Add `getSession()` gate before `getUser()` to check for session existence first. Exit early if no session (normal on public pages)
  - **Fix:** Handle `AuthSessionMissingError` gracefully without throwing (only on public pages)
  - **Fix:** Narrow Sentry filter to only filter `AuthSessionMissingError` when breadcrumbs prove guest mode on public pages
  - **Prevention:** See `docs/troubleshooting/AUTH_SESSION_MISSING_ERROR_FIX.md` for complete implementation guide
  - **Prevention:** Always check `getSession()` before calling `getUser()` in auth bootstrap
- **Supabase "No API key found" Errors:** Supabase client fails to initialize or queries fail with API key errors
  - **Symptom:** Errors like "No API key found" or Supabase client returns null in production
  - **Root Cause:** Environment variables missing at build time or runtime, or client created without env vars
  - **Fix:** Add environment presence beacon in `lib/supabase/supabase-browser.ts` that logs env var status on initialization
  - **Fix:** Use `/api/health/supabase` endpoint to verify Supabase client initialization and env var presence
  - **Fix:** Ensure `createSupabaseBrowser()` throws in production if env vars missing (no silent null returns)
  - **Fix:** Add comprehensive Sentry error logging with context (error codes, details, hints, session state)
  - **Prevention:** See `docs/SUPABASE_API_KEY_FIX_IMPLEMENTATION.md` for complete implementation guide
  - **Prevention:** Use Network tab Initiator column to identify any direct REST calls bypassing Supabase client
- **Billing Portal Session URL Missing:** `redirect(undefined)` when session URL is absent
  - **Fix:** Verify `session.url` exists before redirect and throw a descriptive error if Stripe fails to return a URL.
- **Webhook Acknowledges Failure:** Stripe receives `{ received: true }` even when Supabase updates fail
  - **Fix:** Bubble up failures from `handleSubscriptionUpdate()` and return HTTP 500 so Stripe retries when the database update does not succeed.
- **Stripe Webhook Duplicate Concurrency (in-flight double processing):** Same `event.id` delivered twice concurrently can cause double side effects if the second request proceeds while the first is still `processing`.
  - **Fix:** Use a DB-backed webhook ledger with a unique constraint on `event_id`, and **short-circuit** when the existing ledger row status is `processing` (treat as in-flight duplicate). Ensure the handler still returns **500** on failures so Stripe retries safely.
- **Stripe Signature Verification Fails Even Though Env Vars Look Correct:** Sentry reports `No signatures found matching the expected signature for payload` for `/api/stripe/webhook`.
  - **Root Cause (common):** request not sent directly by Stripe, wrong endpoint/secret pairing (test vs live), or payload mutation by a forwarder.
  - **Fix:** Use route failure telemetry (`signatureTimestamp`, `signatureHeaderLength`, `webhookSecretPresent`, `bodyLength`, `contentLengthHeader`, `contentType`, `userAgent`) to classify origin and mismatch cause, then verify Stripe dashboard endpoint secret matches production `STRIPE_WEBHOOK_SECRET`.
  - **Prevention:** Keep webhook verification on raw `req.text()` only, never log raw signature/secret values, and maintain endpoint-secret parity during rotations.
- **Navigation/Discoverability Surfaces Violate Policy:** UI surfaces advertise "Browse Talent Directory" or "Browse Gigs" when policy requires sign-in or no directory exists.
  - **Fix:** Remove directory links from signed-out navigation, update CTAs to reflect sign-in requirements, align footer links with policy matrix. Reference: `docs/POLICY_MATRIX_APPROACH_B.md`
  - **Prevention:** Before adding nav/footer/CTA links, verify against policy matrix. Signed-out users should not see links to gated directories.
- **Profile-Missing Bootstrap Redirect Loop:** Signed-in users without profile get redirected to login when accessing `/gigs`, causing redirect loops.
  - **Fix:** Allow `/gigs` in `isSafeForProfileBootstrap` for signed-in users without profile. AuthProvider handles profile creation, and page can gate by profile if needed.
  - **Prevention:** When adding route restrictions, ensure bootstrap-safe routes (signed-in but profile missing) are handled correctly. Reference: `docs/ARCHITECTURE_CONSTITUTION.md` (missing profile is valid bootstrap state).
- **Invite link bounces to `/login` instead of completing `/auth/callback`:**
  - **Symptom:** Invite URL lands on `/login?returnUrl=/auth/callback` or callback fails to establish a session before redirecting.
  - **Root Cause:** Server-only callback handling misses invite variants where Supabase sends credentials in URL hash (`#access_token`, `#refresh_token`, `#token_hash`), and query-only handlers can fail to establish app session.
  - **Fix:** Keep `/auth/callback` in canonical `AUTH_ROUTES` and use a client callback gate in `app/auth/callback/page.tsx` that supports all invite token variants:
    - query `code` -> `exchangeCodeForSession(code)`
    - query `token_hash + type` -> `verifyOtp({ token_hash, type })`
    - hash `access_token + refresh_token` -> `setSession(...)`
    - hash `token_hash + type` -> `verifyOtp({ token_hash, type })`
  - **Fix:** After session establishment, clear callback tokens from the URL and resolve destination via `getBootStateRedirect({ postAuth: true, returnUrlRaw })` with bounded retries.
  - **Prevention:** Never assume invite tokens are query-only; always support hash delivery modes and keep `returnUrl` handling safe (`safeReturnUrl`) with a local fallback route.
- **Sentry noise: invalid login, cron 401, Stripe “no profile” retries:**  
  - **Invalid login (`AuthApiError: Invalid login credentials`):** Filtered in `beforeSend` when the message matches — expected failed login, not an app bug (issues ~38, ~3H).  
  - **Cron `Unauthorized`:** Wrong/missing `CRON_SECRET` on ping — booking-reminders uses `logger.info` for bad secret; missing env still `logger.warn` (issue ~3D).  
  - **Stripe webhook “No profile found for customer”:** `handleSubscriptionUpdate` no longer emits `logger.error` on every retry; checkout completion still errors once; live orphan emits a single `logger.warn` after max attempts (issue ~3J).

- **Career Builder already approved but UI still says “Apply to be a Career Builder” (`/client/apply`, Settings, talent profile):**
  - **Symptom:** `profiles.role` is **`client`** but the user still sees the application form, “apply” CTAs, or **Apply as Career Builder** on a public talent profile.
  - **Root Cause:** **`GET /api/client-applications/status`** only looked up **`client_applications`** by **`user_id`**, so rows keyed mainly by **email** (or legacy linkage gaps) returned **`status: null`**. The talent profile CTA also treated every non-**talent** role as “needs to apply.”
  - **Fix (shipped April 2026):** Status route loads by **user_id then email**, and if **`profiles.role === client`** returns **`approved`**. Apply page and related flows redirect or guard; talent profile shows **Career Builder dashboard** for **`client`**.
  - **Prevention:** Any new “application status” UI must treat **`profiles.role === client`** as terminal Career Builder access, not only `client_applications.status`.

- **Career Builder submit fails right after successful invite acceptance (`unexpected error` / `must be logged in`):**
  - **Symptom:** User reaches `/client/apply` from invite callback, fills form, then submit fails with auth-like error or generic unexpected failure.
  - **Root Cause:** Callback can establish browser session before server-side cookie visibility fully converges; server action `submitClientApplication()` calls `auth.getUser()` and may read `null` during this race.
  - **Fix:** In callback gate, wait for server session readiness before redirecting:
    - add `GET /api/auth/session-ready` that validates server `auth.getUser()`
    - retry the probe with **bounded** exponential backoff + jitter (~tens of seconds cap) before leaving `/auth/callback` (mobile Safari often needs more than a few seconds)
    - on `/client/apply`, use the same probe with a similar cap **before** `submitClientApplication()`; show “Finishing sign-in…” instead of failing on the first 401 from the probe
    - each probe `fetch` uses an **AbortController** per attempt (~12s default) so a stalled connection cannot hang until the overall budget elapses
    - `GET /api/auth/session-ready` returns JSON **`reason`**: `no_session` (401), `auth_error` / `server_exception` (500) for client-side distinction; **`logger.warn`** on server for auth/exception paths (no user PII)
    - `waitForServerSessionReady` returns a **structured result** (`terminal`: `not_ready` | `server_error` | `fetch_timeout` | `network`) for apply/callback copy + **`logger.warn`** fields on exhaustion
  - **Fix:** Add structured diagnostics in `submitClientApplication()` with `traceId` across auth lookup, duplicate check, insert, and email side-effects to isolate branch failures quickly.
  - **Prevention:** For invite-linked auth flows, verify both browser and server session convergence before navigating users into server-action submit pages.
- **Career Builder apply shows “Unable to load your application status” while the user is already editing the form:**
  - **Symptom:** Status banner clears when the user types, then a generic error banner appears even though sign-in is fine.
  - **Root Cause:** The status-check **`useEffect`** aborts its **`fetch`** **`AbortController` on cleanup, but a long-running **`waitForServerSessionReady`** call kept polling; when it finished, the next **`fetch`** used an already-aborted signal (**`AbortError`**), and the **`catch`** path set the generic error message.
  - **Fix:** Pass the effect’s **`signal`** into **`waitForServerSessionReady`** so polling and inter-attempt delays stop when aborted; treat **`{ ok: false, aborted: true }`** as a silent no-op for UI; ignore **`AbortError`** in the status **`catch`** block. On **`/auth/callback`**, use an **`AbortController`** for the same pattern so boot polling does not continue after unmount.
  - **Prevention:** Any long-lived async helper paired with **`fetch(..., { signal })`** in an effect should honor the **same** **`AbortSignal`** (or equivalent cancellation) end-to-end.
- **Career Builder hard delete fails with FK error (`SQLSTATE 23503`, `client_applications_user_id_fkey`):**
  - **Symptom:** Admin attempts to delete a Career Builder and the database rejects deleting `auth.users` because `client_applications.user_id` still references that user.
  - **Root Cause:** Career Builder accounts can own dependent rows that are not safe to remove via auth-user deletion from the Admin Users workflow.
  - **Fix:** Use **Suspend User** from `/admin/users` (`profiles.is_suspended = true`; reversible). Career Builder hard delete stays blocked (409) with guidance to **suspend** instead of delete.
  - **Prevention:** Do not use hard delete for Career Builder accounts in admin UX unless a future scoped cleanup flow first proves FK-safe dependency handling.
- **Mobile route contract suite fails with `Login failed: Invalid credentials` across many Client/Talent specs:**
  - **Symptom:** `test:qa:mobile-guardrails`, `client-routes`, or `talent-routes` fail before route assertions run, often across many specs at once.
  - **Root Cause:** Local seeded Client/Talent personas drifted or were not repaired before auth-protected Playwright route specs ran.
  - **Fix:** Run `node scripts/ensure-ui-audit-users.mjs` before those route suites, or use the hardened npm scripts that now include route-user preflight.
  - **Prevention:** Treat broad Client/Talent login failures as auth-baseline/test-fixture drift first, not as route UI regressions, until seeded personas are revalidated.
- **`mobile-guardrails` CI job fails immediately with `Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`:**
  - **Symptom:** GitHub Actions fails during `npm run test:qa:route-users:preflight` before Playwright starts, while local runs still pass.
  - **Root Cause:** The `develop` GitHub environment may have the Supabase secrets, but `.github/workflows/ci.yml` did not map them into the `mobile-guardrails` job `env`, so `scripts/ensure-ui-audit-users.mjs` sees an empty `process.env`.
  - **Fix:** Add these secrets to `Settings -> Environments -> develop -> Environment secrets` and inject them into the `mobile-guardrails` job:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - map `SUPABASE_URL` and `SUPABASE_ANON_KEY` from the same hosted project values in workflow `env`
  - **Prevention:** Do not rely on `.env.local` existing in GitHub Actions; the `dotenv` log line is expected, but CI must satisfy these values through workflow `env` + GitHub environment secrets.
- **`mobile-guardrails` CI job fails with `browserType.launch: Executable doesn't exist`:**
  - **Symptom:** Seed preflight succeeds and the Next app boots, but every Playwright spec fails immediately at `browserType.launch` with a missing `chrome-headless-shell` path on the GitHub runner.
  - **Root Cause:** `npm ci` installs the Playwright package only; it does not guarantee the Chromium browser binary is installed on a fresh CI runner.
  - **Fix:** Add an explicit workflow step before the mobile suite:
    - `npx playwright install --with-deps chromium`
  - **Prevention:** Treat missing browser executables as CI runner setup drift, not as route regressions; ensure browser-backed Playwright jobs install the required browser explicitly.
- **`mobile-guardrails` CI job fails with `Missing PLAYWRIGHT_CLIENT_EMAIL...` or `Missing PLAYWRIGHT_TALENT_EMAIL...`:**
  - **Symptom:** Admin mobile specs pass, but every client/talent mobile spec aborts immediately before route assertions run.
  - **Root Cause:** `tests/helpers/auth.ts` intentionally requires explicit CI auth credentials for client/talent personas, but `.github/workflows/ci.yml` did not inject those env vars into the `mobile-guardrails` job.
  - **Fix:** Map the seeded route-audit personas into the workflow job `env`:
    - `PLAYWRIGHT_CLIENT_EMAIL=cameron.seed@thetotlagency.local`
    - `PLAYWRIGHT_CLIENT_PASSWORD=Password123!`
    - `PLAYWRIGHT_TALENT_EMAIL=emma.seed@thetotlagency.local`
    - `PLAYWRIGHT_TALENT_PASSWORD=Password123!`
  - **Workflow guard:** `mobile-guardrails` now validates those env vars before the suite runs, so future drift should fail once at workflow setup instead of surfacing as many repeated spec failures.
  - **Prevention:** If `ensure-ui-audit-users.mjs` is the canonical source for seeded auth-backed route personas, keep CI Playwright credential env aligned with those same seeded accounts.
- **`/continue` keeps looping even though the next honest move is ship or PR creation:**
  - **Symptom:** The agent keeps proposing tiny status-only or local-only follow-ups after the work is already ready to deliver.
  - **Root Cause:** `/continue` had no explicit delivery handoff rule for the “develop-ready batch” or “clean-and-green, ready for `develop -> main` PR” states.
  - **Fix:** Teach `/continue` to auto-handoff:
    - to `/ship` when the intended batch is complete and develop-ready
    - to `/pr` when the batch is already shipped, `develop` is clean, relevant CI is green, and PR creation is the next honest action
  - **Prevention:** When no meaningful local implementation step remains, do not keep using `/continue` for status-only turns; deliver via `/ship` or `/pr`.
- **Mobile Settings avatar upload card feels like a desktop dropzone shoved into mobile:**
  - **Symptom:** On `/settings`, the tall dashed “Drag and drop or click to upload” box dominates the profile header card and reads awkwardly on narrow screens.
  - **Root Cause:** The same drag/drop presentation was used on mobile and desktop, even though mobile only needs a compact file-picker affordance.
  - **Fix:** Keep the dashed dropzone for `md+`, but on mobile replace it with:
    - avatar preview
    - one primary `Change photo` / `Upload photo` button
    - small helper caption under the button
  - **Prevention:** For mobile account/profile surfaces, prefer compact upload controls and keep helper text outside tall bordered boxes unless drag/drop is a primary interaction.
- **Mobile Settings tabs feel cramped under the profile header:**
  - **Symptom:** The settings section switcher looks compressed or awkward on narrow screens even after the profile header card is cleaned up.
  - **Root Cause:** A desktop-style multi-column tabs grid was still being forced into mobile instead of using a compact horizontal rail.
  - **Fix:** On mobile, replace the grid tabs layout with a horizontally scrollable compact tab rail; keep the full grid layout for `md+`.
  - **Prevention:** When tab labels must compete for width on mobile, prefer the same compact mobile rail pattern already used on dashboard surfaces instead of forcing a narrow multi-column grid.
- **Client Talent Phone Access Leak:** Clients can see sensitive talent fields (phone/email) on any public marketing profile without relationship check.
  - **Fix:** Implement relationship-bound access check using `canClientSeeTalentSensitive()` helper. Client can only see sensitive fields if talent applied to client's gig OR client has booking with talent. Reference: `docs/POLICY_MATRIX_APPROACH_B.md` (relationship-bound access).
  - **Prevention:** Never grant blanket client access to sensitive fields. Always check for relationship (applicant/booking) before exposing phone/email. Use explicit queries instead of PostgREST relationship inference.
- **Client Component Reintroduces Access Leak:** Client components compute access client-side (e.g., `user.role === 'client'`) which bypasses server-side relationship checks.
  - **Fix:** Remove client-side access logic. Accept safe prop types (public fields + optional phone). Render based on what server sends (if phone exists, show it; else show locked state). Server determines access, client only renders. Reference: `docs/POLICY_MATRIX_APPROACH_B.md` (relationship-bound access must be server-side).
  - **Prevention:** Never compute sensitive field access in client components. Server determines access and includes/excludes sensitive fields in props. Client components should only render what they receive.
- **Non-idempotent application acceptance (duplicate bookings / double emails):** Clicking “Accept” twice (or retries) creates multiple bookings and/or sends duplicate acceptance emails.
  - **Fix:** Move acceptance into a single DB primitive `public.accept_application_and_create_booking(...)` + enforce uniqueness on `bookings(gig_id, talent_id)` and only send “accepted” emails when the RPC returns `did_accept=true`.
- **Build Failures:** Any build that doesn't pass locally
  - **Fix:** Never push code that doesn't build locally
- **`no-console` build blocker in client utilities/components:** `next build` fails on `Error: Unexpected console statement. no-console`
  - **Fix:** Replace `console.log/debug` with `logger.info/debug` from `@/lib/utils/logger` (or remove log if unnecessary).
  - **Prevention:** If temporary diagnostics are needed, use project logger utilities instead of direct console calls.
- **Module not found after chunk-splitting (`Can't resolve './tabs/...` or `./components/...`):**
  - **Symptom:** `next build` fails immediately after dynamic-import refactors.
  - **Root Cause:** One or more extracted files were not created/moved with the expected path used in `dynamic(() => import("..."))`.
  - **Fix:** Verify the imported module path and confirm files exist on disk for every dynamic import target before ship.
  - **Prevention:** After each split pass, run `npm run build` (not only route-scoped lint) to catch missing-module regressions early.
- **Server Action 400 on File Upload:** Upload request fails before action runs (Network shows 400, no server logs)
  - **Root Cause:** Server Actions body limit defaults to 1MB
  - **Fix:** Set `experimental.serverActions.bodySizeLimit` in `next.config.mjs` (e.g., `4mb`), align client/server validation caps, and redeploy
- **ChunkLoadErrorHandler infinite reload loop:** App reloads repeatedly, user locked out
  - **Root Cause:** Broad error matcher (e.g. `msg.includes("reading 'call')`) matched unrelated bugs; no reload guard allowed repeated reload attempts
  - **Fix:** ChunkLoadErrorHandler now uses exact matcher `"Cannot read properties of undefined (reading 'call')"` only; sessionStorage guard allows max 1 reload per 60s
  - **Prevention:** Do not widen chunk error matchers; keep reload guard in place

## **6. REGRESSION GUARDS (AUDIT FINISH LINE)**
- **Guard failure: `select('*')` reintroduced**
  - **Symptom:** `guard:no-select-star` fails (pre-commit or CI)
  - **Fix:** Replace `.select("*")` or `*, relation(...)` selects with explicit column lists.
  - **Command:** `npm run guard:select-star`
- **Schema verification fails: `any` type usage or `select('*')` violations**
  - **Symptom:** `npm run schema:verify` fails with errors about `any` types or `select('*')` usage
  - **Fix for `any` types:** Replace `as any` casts with proper Database types:
    - Use `Database["public"]["Tables"]["table_name"]["Update"]` for updates
    - Use `Database["public"]["Tables"]["table_name"]["Insert"]` for inserts
    - Use proper type definitions instead of `any` for component props
  - **Fix for `select('*')`:** Replace `.select()` without arguments or `.select('*')` with explicit column lists
  - **Example:** Change `.select()` to `.select("id,title,status")` with explicit columns
  - **Prevention:** Run `npm run schema:verify` before committing to catch violations early
- **Guard failure: client-side DB write**
  - **Symptom:** `guard:no-client-writes` fails on a `"use client"` file
  - **Fix:** Move the mutation into a **Server Action** or **API route** and call that from the client component.
  - **Command:** `npm run guard:client-writes`

### **CI/DX drift: passes locally, fails later**
- **Symptom:** You ran `lint`/`build` manually, but a later gate fails on guards/schema/policies.
- **Fix:** Use the canonical commands:
  - **Daily loop:** `npm run verify-fast`
  - **Before push/PR:** `npm run verify-all` (CI-parity gate)

### **Playwright admin helper fails: `invalid JWT signature`**
- **Symptom:** Playwright specs that call `POST /api/admin/create-user` fail early with `500` and `invalid JWT: ... signature is invalid`.
- **Root cause:** `SUPABASE_SERVICE_ROLE_KEY` does **not** belong to the same Supabase project as the URL being used by the server (`SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` mismatch).
- **Fix:** Align env vars so they refer to the same project:
  - `SUPABASE_URL` == `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` is copied from that same project’s dashboard
  - Restart `next dev` / `next start` before rerunning tests

### **Next.js EPERM on Windows/OneDrive (`.next\\trace`)**
- **Symptom:** `EPERM: operation not permitted, open '...\\.next\\trace'` during `next build` or when Playwright starts a dev server.
- **Root cause:** Windows file-locking + OneDrive sync contention on `.next` artifacts (especially `trace`).
- **Fix (safe, local-only):**
  - Stop all running `node`/Next processes
  - Delete `.next/` and rerun `npm run build`
  - For Playwright, prefer running against `next start` (build → start) to reduce trace-write flakiness.
- **Prevention:** Keep `.next/` and `playwright-report/` ignored (already in `.gitignore`); avoid running `next dev` and `next build` concurrently.

### **Playwright flake on Windows (too many workers / hydration never completes)**
- **Symptom:** Random timeouts like `choose-role-hydrated = loading` / `browserContext.newPage timeout` / auth suite passes only sometimes.
- **Root cause:** Local parallelism (many Chromium workers) + Windows/OneDrive file contention + `next start` server load.
- **Fix:**
  - Run Playwright with fewer workers (recommended default is now 2):
    - `set PW_WORKERS=2` (PowerShell: `$env:PW_WORKERS="2"`)
  - Re-run:
    - `npx playwright test tests/auth --project=chromium --retries=0 --reporter=list`
- **Notes:** The repo Playwright config now defaults to **2 workers** locally; CI remains **1**.

### **Playwright runs against stale build (next start)**
- **Symptom:** UI changes (e.g. new `data-testid`) don’t show up in Playwright, but work in dev.
- **Root cause:** Playwright webServer uses `next start` and may not rebuild automatically between edits.
- **Fix:** Run a fresh build before Playwright:
  - `npm run build`
  - then `npx playwright test tests/auth --project=chromium --retries=0 --reporter=list`

### **Playwright webServer command works locally but fails in CI shell**
- **Symptom:** Playwright tests fail before execution with shell parsing/quoting errors (`/bin/sh` syntax issues, env var chaining failures, or command not found).
- **Root cause:** `playwright.config.ts` `webServer.command` is shell-specific (`cmd` chaining, inline `set`, or quoting assumptions) and does not run consistently across Windows + Linux shells.
- **Fix:** Route startup through a Node launcher script (e.g., `node scripts/playwright-webserver.mjs`) that:
  - sets env vars in JS,
  - conditionally runs `npm run build` when `.next/BUILD_ID` is missing,
  - then runs `npm run start`.
- **Prevention:** Keep `webServer.command` shell-neutral and avoid inline shell conditionals in Playwright config.

### **CI static guard false-positive: `next/headers` import flagged in client code when none exists**
- **Symptom:** CI build fails at static guard step with `Found next/headers import in client code!` while repo search shows no `next/headers` usage in `"use client"` files.
- **Root cause:** Shell-dependent `grep` + glob patterns in workflow (`app/**/*.tsx`) can behave inconsistently across environments and do not model `"use client"` boundaries.
- **Fix:** Replace the workflow grep check with `node scripts/guard-no-next-headers-in-client.mjs`, which scans only `"use client"` modules under `app` and `components`.
- **Prevention:** For policy-style CI checks, prefer deterministic script guards over shell/glob pipelines.

### **Playwright strict-mode locator violations after UI copy/layout refresh**
- **Symptom:** Assertions fail with strict mode errors like “locator resolved to multiple elements” or hidden duplicate matches.
- **Root cause:** Broad text locators (`getByText("...")`) match subtitles, hidden tab labels, or repeated counters after UI refreshes.
- **Fix:** Use role-scoped and semantic locators (`getByRole("heading", { name: ... })`, `getByRole("link", { name: ... })`) or container-scoped locators tied to stable page sections.
- **Prevention:** When modernizing specs, avoid legacy global text-only selectors; prefer contract-level locators aligned with current route/page ownership.

### **CRLF ↔ LF warnings / noisy diffs on Windows**
- **Symptom:** Git warns about line endings or shows whitespace-only diffs.
- **Fix:** Ensure `.gitattributes` is present (repo enforces LF for code/docs and CRLF for Windows scripts).
- **Normalize once (if needed):**
  - `git add --renormalize .`
- **Schema Truth Failure (merging to `main`):** `types/database.ts is out of sync with remote schema (Environment: production)`
  - **Root Cause:** `types/database.ts` was regenerated from the dev project while `main` CI compares against the production Supabase project.
  - **Fix:** Before merging to `main`, set `SUPABASE_PROJECT_ID=<prod_project_ref>`, apply pending migrations to production (`npx supabase@2.34.3 db push --db-url ...`), then run `npm run types:regen:prod`. Commit the regenerated file only after prod schema matches.
  - **Prevention:** Never run `npm run types:regen` right before a production merge unless you are targeting the production project ref. Keep a checklist item for "regen types from prod + run schema truth" in every release PR.
- **.env Encoding Errors:** `unexpected character '»' in variable name` when running Supabase CLI
  - **Root Cause:** `.env.local` saved as UTF-8 **with BOM**; the hidden BOM bytes (`ï»¿`) confuse the CLI dotenv parser.
  - **Fix:** In VS Code choose “File → Save with Encoding → UTF-8” (no BOM) for `.env.local`. Before running CLI commands also set `SUPABASE_INTERNAL_NO_DOTENV=1` or temporarily rename `.env.local` to keep smart quotes/BOM characters from breaking the parser.
  - **Prevention:** Keep `.env.local` plain UTF-8, avoid smart quotes, and always pass through the `cmd /d /c "set SUPABASE_INTERNAL_NO_DOTENV=1 && …"` wrapper already baked into the npm scripts.
- **Seed fails: `duplicate key value violates unique constraint "talent_profiles_user_id_key"` (SQLSTATE 23505)**
  - **Root Cause:** The `on_auth_user_created` trigger creates `profiles` and `talent_profiles` when users are inserted into `auth.users`. The seed then inserts into `talent_profiles` for the same users, causing a duplicate key error.
  - **Fix:** The seed uses `ON CONFLICT (user_id) DO NOTHING` on `talent_profiles` inserts — idempotent. If you see this error, ensure `supabase/seed.sql` has that clause. Run `npm run db:reset` again.
- **403 Unauthorized / "alg" (Algorithm) Header Parameter value not allowed**
  - **Symptom:** Supabase local stack fails at "Restarting containers…" or requests fail with `403 Unauthorized` / JWT error about algorithm header not allowed.
  - **Root Cause (primary):** Supabase CLI **v2.71.1+** changed the default JWT signing algorithm for local dev from **HS256 → ES256**. Kong/auth/anything expecting the legacy HS256 flow rejects ES256 tokens. ([GitHub #4726](https://github.com/supabase/cli/issues/4726))
  - **Root Cause (secondary):** Keys/env mismatch — local URL with prod keys, or system env vars (`JWT_SECRET`, `SUPABASE_AUTH_JWT_SECRET`, `GOTRUE_JWT_*`) leaking into the process.
  - **Absolute Rule:** Local URL must pair with **local keys**. Prod URL must pair with **prod keys**.
  - **Step 1 — Confirm algorithm:** Run `supabase status`, copy the anon key, then decode the JWT header:
    ```powershell
    $token = "<PASTE_ANON_KEY_HERE>"
    $h = $token.Split('.')[0].Replace('-','+').Replace('_','/')
    switch ($h.Length % 4) { 2 {$h+='=='} 3 {$h+='='} }
    [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($h))
    ```
    You'll see `{"alg":"ES256",...}` or `{"alg":"HS256",...}`.
  - **Step 2 — Fix (recommended): Pin CLI to 2.71.0 (HS256 legacy)** so `db:reset` stops breaking:
    - **Scoop:** `scoop uninstall supabase` → `scoop install supabase@2.71.0`
    - **Chocolatey:** `choco uninstall supabase-cli` → `choco install supabase-cli --version=2.71.0`
    - Then hard reset:
    ```powershell
    supabase stop
    Remove-Item -Recurse -Force .supabase, supabase\.temp -ErrorAction SilentlyContinue
    supabase start
    npm run db:reset
    ```
  - **Alternative (Option B):** Stay on latest CLI and migrate everything that expects HS256 to support ES256. See [GitHub #4726](https://github.com/supabase/cli/issues/4726).
  - **Trap — env leak:** Even with `SUPABASE_INTERNAL_NO_DOTENV=1`, system env vars can leak. Check and clear:
    ```powershell
    Get-ChildItem Env: | Where-Object { $_.Name -match "SUPABASE|GOTRUE|JWT" } | Format-Table -Auto
    Remove-Item Env:JWT_SECRET -ErrorAction SilentlyContinue
    Remove-Item Env:SUPABASE_AUTH_JWT_SECRET -ErrorAction SilentlyContinue
    ```
    Then retry `supabase stop` → `supabase start` → `npm run db:reset`.
- **UI audit screenshots mislabeled by viewport (false evidence risk)**
  - **Symptom:** screenshot filenames say `390x844` / `360x800`, but actual image dimensions are `1600x900`.
  - **Root Cause:** browser automation captures with default viewport while filenames are generated from intended viewport labels.
  - **Fix:** enforce explicit viewport before capture and validate files before merge:
    - `await page.setViewportSize({ width, height })`
    - run a dimension check script (Pillow/ImageMagick) to compare filename label vs actual file dimensions.
  - **Prevention:** treat screenshot evidence as invalid unless filename labels and pixel dimensions match exactly.

## **4. BRANCH-SPECIFIC REQUIREMENTS**
- **DEVELOP Branch:** Use `npm run types:regen:dev` if needed
- **MAIN Branch:** Use `npm run types:regen:prod` if needed
- **Both Branches:** Must pass `npm run build` before pushing

## **5. EMERGENCY FIXES**
If you encounter these errors:
```bash
# Schema sync error
npm run types:regen && npm run build

# Import path errors - find and fix manually
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# Build failures - fix locally first
npm run build
```

**🚨 CRITICAL RULE: NEVER PUSH CODE THAT DOESN'T BUILD LOCALLY!**

## **7. EMAIL VERIFICATION & PUBLIC ROUTE ERRORS**

### **Email Verification Not Showing in Admin Dashboard**
- **Error:** Admin dashboard shows "Unverified" even after email is verified
- **Fix:** Admin dashboard now auto-syncs from `auth.users.email_confirmed_at` on page load
- **Prevention:** Always sync `email_verified` from `auth.users.email_confirmed_at` in callback handlers

### **Career Builder Application Success Page Redirects to Talent Dashboard**
- **Error:** After submitting Career Builder application, user redirected to `/talent/dashboard` instead of success page
- **Fix (LAW):** Career Builder application is **AUTH REQUIRED**. Signed-out users should be redirected to:\n  - `/login?returnUrl=/client/apply`\n\n  The routing allowlist should **not** treat `/client/apply`, `/client/apply/success`, or `/client/application-status` as public.
- **Prevention:** Keep auth posture consistent: if a flow requires auth, remove it from `PUBLIC_ROUTES` and enforce ownership via RLS.

### `42501 permission denied for table users` during Career Builder submission/status

- **Symptom:** Career Builder submission or status checks fail with:

```text
permission denied for table users
```

- **Root cause:** `client_applications` RLS referenced `auth.users` (forbidden for normal `authenticated` role).
- **Fix:** Replace policy logic with ownership by `user_id = auth.uid()` and remove anon access.\n  - See migrations:\n    - `supabase/migrations/20251221123500_rebuild_client_applications_policies_no_auth_users.sql`

### **Public Route Access Denied**
- **Error:** Public pages redirecting to login when they shouldn't
- **Fix:** Ensure route is in `publicRoutes` array in both `middleware.ts` and `auth-provider.tsx`
- **Check:** Verify route is excluded from `needsClientAccess()` or `needsTalentAccess()` checks

### **Public email routes double-send / spam-click floods Resend**
- **Symptom:** Clicking “Resend verification email” or “Password reset” multiple times results in multiple emails or provider rate limiting.
- **Fix:** Public routes are now enforced by a DB-backed ledger (`public.email_send_ledger`) + server-side claim gate (`lib/server/email/claim-email-send.ts`) so **one click → one send** per cooldown bucket across multi-instance/serverless.
- **Sanity check (Supabase SQL editor):**
  - Confirm no duplicates exist:
    - `SELECT purpose, recipient_email, cooldown_bucket, COUNT(*) FROM public.email_send_ledger GROUP BY 1,2,3 HAVING COUNT(*) > 1;`
  - Confirm no user-facing policies exist:
    - `SELECT * FROM pg_policies WHERE schemaname='public' AND tablename='email_send_ledger';`
- **Admin debug (optional):** `GET /api/admin/email-ledger-debug?purpose=verify_email&email=<email>` (admin-only) returns the computed key/bucket and the matching ledger row if present.

### **Logout looks “stuck” until refresh/click (redirect race)**
- **Symptom:** After clicking Sign Out (often from `/settings`), the UI still looks logged in until you click/refresh, or you bounce off `/login`.
- **Root cause:** Competing redirects during the transient cookie/session-clearing window (e.g., landing on `/login` without `signedOut=true` while middleware still sees a user).
- **Fix:** Ensure sign-out always converges to **`/login?signedOut=true`** and only one layer owns navigation for user-initiated sign-out.
- **Where to check:** `components/auth/auth-provider.tsx` (manual sign-out owner + SIGNED_OUT safety net), `middleware.ts` (allow `/login` when `signedOut=true`), `components/navbar.tsx` (avoid post-signOut competing redirects).

### **Mobile page scrolls sideways / text goes off-screen (horizontal overflow)**
- **Symptom:** On mobile, you can pan the entire page left/right, or long IDs/emails/URLs push content off-screen.
- **Root cause:** Long unbroken tokens + flex children that can’t shrink (`min-w-0` missing), or “silent spacing hacks” (e.g., global rules that add margins to `gap-*` layouts).
- **Fix:** Prefer shrink/wrap correctness over global clamping:
  - Use `components/ui/long-token.tsx` (`LongToken`) for UUID/email/url rendering
  - Add `min-w-0` to flex text containers that must shrink
  - Wrap tables in `components/layout/data-table-shell.tsx` (`DataTableShell`)
  - Remove global spacing hacks that duplicate Tailwind spacing behavior
  - Keep Playwright mobile overflow sentinel green (`tests/integration/mobile-overflow-sentinel.spec.ts`)
- **Where to check:** `docs/UI_LAYOUT_CONTRACT.md` (Terminal Kit rules), `app/globals.css`, and any affected page/section components.

## **6. PRE-COMMIT CHECKLIST REFERENCE**

**ALWAYS run this checklist before pushing:**
1. ✅ `npm run schema:verify:comprehensive`
2. ✅ `npm run build`
3. ✅ `npm run lint`
4. ✅ Check import paths are correct
5. ✅ Verify branch-specific types are generated
6. ✅ Read `docs/PRE_PUSH_CHECKLIST.md` for detailed guidance

**If ANY step fails, DO NOT PUSH until it's fixed!**

---

# 🚨 COMMON ERRORS QUICK REFERENCE

## ⚡ EMERGENCY FIXES - COPY & PASTE COMMANDS

### **0. “No project currently linked” during `schema:verify:comprehensive`**

**Meaning:** This is **not an error** for schema drift verification.  
The drift check is deterministic because it targets a project explicitly via `--project-id`.

**Evidence (script behavior):**
- `scripts/verify-schema-sync-comprehensive.mjs` prints link status for awareness, then verifies drift against `TARGET_PROJECT_ID` (defaults to `utvircuwknqzpnmvxidp` unless `SUPABASE_PROJECT_ID` is set).

**When linking is actually required:**
- For `supabase db *` workflows (e.g., `db push`, `db reset`, `db status --linked`).

**Optional strict mode (seatbelt):**

```bash
# Fails if no link is detected (intended for release prep / onboarded devs / dedicated CI jobs)
npm run schema:verify:linked
```

**How to fix (if you want to link):**

```bash
# Dev project
npm run link:dev

# Prod project (requires SUPABASE_PROJECT_ID env var)
# PowerShell: $env:SUPABASE_PROJECT_ID="<prod_project_ref>"
npm run link:prod
```

### **1. Schema Sync Error**
```bash
# Error: types/database.ts is out of sync with remote schema
npm run types:regen
npm run build
git add types/database.ts
git commit -m "Fix schema sync: regenerate types"
```

### **1c. PostgREST 400 / Postgres 42703: `profiles.avatar_path does not exist` (local schema drift)**
```bash
# Symptom:
#   GET http://127.0.0.1:54321/rest/v1/profiles?select=...avatar_path... 400
#   SQLSTATE 42703: column "avatar_path" of relation "profiles" does not exist
#
# Fix:
# 1) Ensure the repo contains a migration adding the column (additive, idempotent):
#    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;
#
# 2) Rebuild local DB from migrations:
npx -y supabase@2.34.3 db reset --yes
#
# 3) Re-run build to confirm auth bootstrap no longer fails:
npm run build
```

### **1d. Postgres 42P17: infinite recursion detected in RLS policy for `profiles`**
```bash
# Symptom:
#   SQLSTATE 42P17: infinite recursion detected in policy for relation "profiles"
#
# Cause:
#   An RLS policy ON public.profiles queries public.profiles inside USING/WITH CHECK.
#
# Fix:
# - Drop or rewrite the recursive policy (example fix is dropping the offending policy):
#   DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
#
# Guardrail:
npm run rls:guard
```

### **1b. Schema Truth Error on `main` (Production)**
```bash
# 1. Export your production project ref
set SUPABASE_PROJECT_ID=<prod_project_ref>   # PowerShell: $env:SUPABASE_PROJECT_ID="<prod>"
set SUPABASE_INTERNAL_NO_DOTENV=1            # prevent CLI from parsing .env.local

# 2. Apply migrations to production (required before regen)
npx -y supabase@2.34.3 db push --db-url "postgresql://postgres:<DB_PASSWORD>@db.<prod_project_ref>.supabase.co:5432/postgres"

# 3. Regenerate types from production
npm run types:regen:prod

# 4. Commit regenerated types
git add types/database.ts
git commit -m "Sync prod types"
```
### **2. Import Path Error**
```bash
# Error: Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'
# Find all incorrect imports
grep -r "@/lib/supabase/supabase-admin-client" . --exclude-dir=node_modules

# Fix manually: Replace with @/lib/supabase-admin-client
```

### **3. Database Type Error**
```bash
# Error: Cannot find module '@/types/database'
# Find all incorrect imports
grep -r "@/types/database" . --exclude-dir=node_modules

# Fix manually: Replace with @/types/supabase
```

### **4. Build Failure**
```bash
# Error: Build failed because of webpack errors
npm run build
# Fix all errors locally before pushing
```

### **5. Playwright MCP Connection Error**
```bash
# Error: Cannot find module './console' or "No server info found"
# 1. Install packages locally
npm install --save-dev playwright @playwright/test @playwright/mcp --legacy-peer-deps
npx playwright install --with-deps chromium

# 2. Update Cursor MCP config (c:\Users\young\.cursor\mcp.json)
# Add --no-install flag to args array

# 3. Verify command works
npx --no-install @playwright/mcp --help

# 4. Restart Cursor completely
```

**See:** `docs/MCP_QUICK_FIX.md` for detailed steps

### **5b. Playwright error: Project(s) "chromium" not found**
```bash
# Error:
#   Error: Project(s) "chromium" not found. Available projects: ""
#
# Root cause:
# - Playwright didn't load `playwright.config.ts` (often because the command was run from the wrong working directory).
#
# Fix:
# 1) cd to the repo root (where `playwright.config.ts` lives)
cd <repo-root>
#
# 2) re-run the test without overriding projects, or pass the config explicitly
npx playwright test tests/auth
# or:
npx playwright test --config=playwright.config.ts tests/auth
```

### **6. Sentry 406 Not Acceptable Errors**
```bash
# Error: profiles?select=role&id=eq.xxx returned 406 Not Acceptable
# Root Cause: Using .single() when profile might not exist
# Fix: Replace .single() with .maybeSingle() in all profile queries

# Files to check:
# - lib/actions/auth-actions.ts
# - middleware.ts
# - components/auth/auth-provider.tsx

# Pattern to find:
grep -r "\.single()" lib/actions/auth-actions.ts middleware.ts components/auth/

# Replace with:
.single() → .maybeSingle()
```

### **7. Sentry Not Receiving Errors**
```bash
# Error: Errors not appearing in Sentry dashboard
# 1. Check diagnostic endpoint
curl http://localhost:3000/api/sentry-diagnostic

# 2. Verify DSN in .env.local matches project ID 4510191108292609
# 3. Check console for Sentry initialization logs
# 4. Test with: http://localhost:3000/api/test-sentry?type=error

# Common issues:
# - Wrong project ID in DSN (should end in 4510191108292609)
# - DSN not set in .env.local
# - Errors being filtered by beforeSend hooks
```

### **8. Build Error: Cannot find name 'talentProfile'**
```bash
# Error: Type error in middleware.ts - variable out of scope
# Fix: Ensure variables are defined in the same scope where used
# Pattern: Wrap case blocks in braces, check variable scope
```

### **9. ReferenceError: Function is not defined (Missing Import)**
```bash
# Error: ReferenceError: createNameSlug is not defined
# Root Cause: Using utility function without importing it
# Common in: Client components, server components, pages

# Quick check - find all uses of utility functions:
grep -r "createNameSlug\|getTalentSlug\|createSlug" app/ --include="*.tsx" --include="*.ts"

# Verify each file has the import:
# Required imports for common utilities:
# - createNameSlug: import { createNameSlug } from "@/lib/utils/slug";
# - getTalentSlug: import { getTalentSlug } from "@/lib/utils/talent-slug";
# - createSlug: import { createSlug } from "@/lib/utils/slug";

# Files that commonly use these:
# - app/admin/talent/admin-talent-client.tsx
# - app/admin/users/admin-users-client.tsx
# - app/client/applications/page.tsx
# - app/client/bookings/page.tsx
# - app/talent/talent-client.tsx
# - app/talent/[slug]/page.tsx

# Prevention checklist:
# 1. When using any function from lib/utils/, check if import exists
# 2. Always import at the top of the file
# 3. If refactoring, verify imports are added to new files
# 4. Run build locally to catch missing imports before push
```

### **10. N+1 Query Issue - Multiple Profile Queries**
```bash
# Error: Sentry shows "N+1 API Call" with 5+ duplicate profile queries
# Root Cause: Multiple components fetching same profile data separately
# Common in: Dashboard pages, profile components

# Quick check - find duplicate profile queries:
grep -r "from.*profiles.*select\|\.from\(.*profiles.*\)\.select" app/ --include="*.tsx"

# Verify components use auth provider profile:
# ✅ CORRECT - Use profile from auth context
const { user, profile } = useAuth();
// profile.avatar_url, profile.display_name, profile.role already available

# ❌ WRONG - Don't fetch profile separately in client components
const [userProfile, setUserProfile] = useState(null);
useEffect(() => {
  supabase.from("profiles").select("avatar_url, display_name")...
}, []);

# Files that should use auth provider profile:
# - app/talent/dashboard/page.tsx ✅ Fixed
# - app/client/dashboard/page.tsx ✅ Fixed
# - app/talent/[slug]/talent-profile-client.tsx ✅ Fixed
# - Any client component needing profile data

# Prevention checklist:
# 1. Always use profile from useAuth() hook in client components
# 2. Only query profiles separately in server components (routing)
# 3. Check Sentry for N+1 query warnings
# 4. Verify single profile query per page load in network tab
```

### **11. Foreign Key Relationship Error - Invalid Join**
```bash
# Error: PGRST200 - "Could not find a relationship between 'gigs' and 'client_profiles'"
# Error: "column 'first_name' does not exist on 'talent_id'"
# Root Cause: Attempting to join tables that don't have direct foreign key relationships
# Common in: Admin pages, application/booking queries

# ❌ WRONG - Invalid join (no direct FK between gigs and client_profiles)
.select(`
  *,
  client_profiles!inner(company_name)  # No FK between gigs.client_id → client_profiles
`)

# ❌ WRONG - Invalid join (talent_id is UUID in profiles, not talent_profiles)
.select(`
  *,
  talent_profiles:talent_id(first_name, last_name)  # talent_id references profiles.id, not talent_profiles
`)

# ✅ CORRECT - Fetch separately and combine
# Step 1: Fetch main data with valid joins
const { data: bookings } = await supabase
  .from("bookings")
  .select(`
    *,
    gigs!inner(id, title),
    profiles!talent_id(display_name)
  `)

# Step 2: Fetch related data separately
const bookingsWithTalent = await Promise.all(
  bookings.map(async (booking) => {
    const { data: talentProfile } = await supabase
      .from("talent_profiles")
      .select("first_name, last_name")
      .eq("user_id", booking.talent_id)  # Use user_id, not talent_id
      .maybeSingle();
    
    return {
      ...booking,
      talent_profiles: talentProfile || null,
    };
  })
);

# Common foreign key relationships (check database_schema_audit.md):
# - applications.talent_id → profiles.id (NOT talent_profiles)
# - applications.gig_id → gigs.id
# - bookings.talent_id → profiles.id (NOT talent_profiles)
# - bookings.gig_id → gigs.id
# - gigs.client_id → profiles.id (NOT client_profiles directly)
# - talent_profiles.user_id → profiles.id
# - client_profiles.user_id → profiles.id

# Prevention checklist:
# 1. Always check database_schema_audit.md for FK relationships
# 2. Never join tables without direct foreign keys
# 3. Use separate queries for indirect relationships (through profiles)
# 4. Verify join syntax matches actual FK structure
```

### **12. Import Order & Unused Import Warnings**
```bash
# Error: import/order warnings - imports not in correct order
# Error: '@typescript-eslint/no-unused-vars' - imports defined but never used
# Root Cause: Incorrect import order or leftover imports from refactoring

# ✅ CORRECT import order:
# 1. External packages (lucide-react, next/link, etc.)
# 2. React imports (useState, useEffect, etc.)
# 3. Internal imports (@/components, @/lib, etc.)
# 4. Type imports (import type ...)

import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";

# ❌ WRONG - next/link after react imports
import { useState } from "react";
import Link from "next/link";  # Should be before react

# Fix: Reorder imports or run npm run lint -- --fix
# Prevention: Remove unused imports when refactoring
```

### **13. Type Mismatch: undefined vs null**
```bash
# Error: Type '... | undefined' is not assignable to type '... | null'
# Root Cause: .find() returns undefined, but variable is typed as null
# Common in: Talent/profile lookup, array searches

# ❌ WRONG - .find() returns undefined, but talent is typed as null
let talent: TalentProfile | null = null;
talent = allTalent.find((t) => t.id === id) as TalentProfile | undefined;

# ✅ CORRECT - Convert undefined to null using ?? null
let talent: TalentProfile | null = null;
talent = allTalent.find((t) => t.id === id) ?? null;

# Or inline:
talent = allTalent.find((t) => {
  const talentSlug = createNameSlug(t.first_name, t.last_name);
  return talentSlug === slug;
}) ?? null;

# Pattern:
# - maybeSingle() → Type | null ✅
# - .find(...) → Type | undefined → normalize with ?? null
# - All variables use Type | null, never undefined

# Files fixed:
# - app/talent/[slug]/page.tsx ✅ Fixed
```

### **14. maybeSingle() Error Handling - PGRST116 Check**
```bash
# Error: Syntax error - "profileCheckError." with no property name
# Error: Logic error - checking for PGRST116 with maybeSingle()
# Root Cause: Incorrect error handling with .maybeSingle() - PGRST116 doesn't occur
# Common in: Profile queries, authentication flows

# ❌ WRONG - Syntax error and wrong logic
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", user.id)
  .maybeSingle();

// Syntax error - missing property name
if (!profile || (profileError && profileError. === "PGRST116")) {
  // Create profile
}

// ❌ WRONG - Checking for PGRST116 with maybeSingle() (doesn't occur)
if (profileError && profileError.code === "PGRST116") {
  // Create profile
}

# ✅ CORRECT - Handle errors, then check !profile
const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, role")
  .eq("id", user.id)
  .maybeSingle();

// Handle actual errors first (not PGRST116 - that doesn't occur with maybeSingle())
if (profileError) {
  console.error("Error checking profile:", profileError);
  // Log to Sentry, return error, etc.
  return { error: "Failed to check existing profile" };
}

// If profile doesn't exist, create it
// With maybeSingle(), no rows returns null data (not an error), so check !profile
if (!profile) {
  // Create profile
}

# Key Pattern:
# - .maybeSingle() → Returns null data (not error) when no rows found
# - PGRST116 error code → Only occurs with .single(), NOT with .maybeSingle()
# - Always handle actual errors first, then check !data
# - Never check for PGRST116 when using .maybeSingle()

# Files fixed:
# - lib/actions/auth-actions.ts ✅ Fixed (3 locations)
```

### **15. Type Error: `Property 'is_suspended' does not exist on type ...`**
```bash
# Error: Property 'is_suspended' does not exist on type 'profiles'
# Error: Property 'suspension_reason' does not exist on type 'profiles'
# Root Cause: Migration adding suspension columns ran, but types/database.ts wasn't regenerated

# ❌ WRONG - Stale types (no suspension columns)
const { data: profile } = await supabase
  .from("profiles")
  .select("role, is_suspended")
  .eq("id", user.id)
  .maybeSingle();  # TS2339: Property 'is_suspended' does not exist

# ✅ FIX - Keep schema, types, and docs in sync
supabase db push --linked   # Applies migration locally (if needed)
npm run types:regen         # Regenerates types/database.ts with AUTO-GENERATED banner
npm run build               # Verifies middleware + server actions compile

# Prevention checklist:
# 1. Update database_schema_audit.md BEFORE adding migration
# 2. Run the migration locally (db push/reset)
# 3. Regenerate types via pinned CLI (npm run types:regen)
# 4. Re-run build/lint so middleware sees the new columns
```

### **16. TypeError: `specialties.map is not a function`**
```bash
# Error: TypeError: d.specialties.map is not a function
# Root Cause: Migration conflict - specialties was added as TEXT in one migration and TEXT[] in another
#             Existing data may be stored as string (JSON) or null instead of array

# ❌ WRONG - Direct array access without normalization
{talent.specialties.map((specialty, index) => (
  <span key={index}>{specialty}</span>
))}

# ✅ FIX - Normalize to array before using .map()
function normalizeToStringArray(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

const specialtiesArray = normalizeToStringArray(talent.specialties);
{specialtiesArray.map((specialty, index) => (
  <span key={index}>{specialty}</span>
))}

# Files fixed:
# - app/talent/[slug]/page.tsx ✅ Fixed
# Prevention: Always normalize array fields (specialties, languages) before using .map()
```

### **17. Error: `revalidatePath` during render**
```bash
# Error: Route /talent/dashboard used "revalidatePath /" during render which is unsupported
# Root Cause: ensureProfileExists() calls revalidatePath() but is invoked during Server Component render

# ❌ WRONG - Calling revalidatePath during render
export async function ensureProfileExists() {
  // ... create/update profile ...
  revalidatePath("/", "layout");  # Called during render - ERROR
}

# ✅ FIX - Remove revalidatePath from functions called during render
#          Let callers handle revalidation after mutations
export async function ensureProfileExists() {
  // ... create/update profile ...
  // Note: revalidatePath removed - cannot be called during render.
  // Callers should handle revalidation after mutations.
}

# Files fixed:
# - lib/actions/auth-actions.ts ✅ Fixed (removed 7 revalidatePath calls)
# Prevention: Only call revalidatePath in Server Actions or Route Handlers, not during render
```

### **18. Hydration Error on Admin Users Page**
```bash
# Error: Hydration Error - Server/client HTML mismatch
# Root Cause: Using toLocaleDateString() directly in JSX causes locale-dependent formatting differences
#             between server and client rendering

# ❌ WRONG - Direct locale-dependent date formatting
<td>{new Date(userProfile.created_at).toLocaleDateString()}</td>

# ✅ FIX - Use SafeDate component (client-side only rendering)
import { SafeDate } from "@/components/safe-date";

<td><SafeDate date={userProfile.created_at} /></td>

# Files fixed:
# - app/admin/users/admin-users-client.tsx ✅ Fixed (4 instances)
# Prevention: Always use SafeDate component for date rendering in client components
```

### **19. Browser Extension Errors (Firefox Detection)**
```bash
# Error: ReferenceError: Can't find variable: __firefox__
# Error: TypeError: undefined is not an object (evaluating 'window.__firefox__.reader')
# Root Cause: Browser extensions inject Firefox detection code that references __firefox__ variable
#             These are non-actionable errors from third-party code

# ✅ FIX - Filter in Sentry configuration
# Add to ignoreErrors array:
ignoreErrors: [
  "__firefox__",
  /__firefox__/,
  /ReferenceError.*__firefox__/,
  /TypeError.*__firefox__/,
  /window\.__firefox__/,
]

# Add to beforeSend filter:
if (errorObj.message?.includes('__firefox__') ||
    errorObj.message?.includes('window.__firefox__') ||
    (errorObj.name === 'ReferenceError' && errorObj.message?.includes('__firefox__')) ||
    (errorObj.name === 'TypeError' && errorObj.message?.includes('__firefox__'))) {
  return null; // Filter this error
}

# Files fixed:
# - instrumentation-client.ts ✅ Fixed
# Prevention: Filter browser extension errors in Sentry configuration
```

### **20. Sentry Replay Noise: Instagram/WebView Keyboard Logging**
```bash
# Error: TypeError with "enableDidUserTypeOnKeyboardLogging" in Sentry (often from Instagram in-app browser / Android WebView)
# Root Cause: Non-actionable third-party WebView + Replay interaction, not app business logic

# ✅ FIX - Keep Replay mostly "on error" in production and drop only this exact noise string
# instrumentation-client.ts
replaysOnErrorSampleRate: isProduction ? 0.05 : 1.0,
replaysSessionSampleRate: isProduction ? 0.0 : 0.1,

if (errorMessage.includes("enableDidUserTypeOnKeyboardLogging")) {
  return null;
}

# Files fixed:
# - instrumentation-client.ts ✅ Fixed
# Prevention: Use exact-string filtering for this error to avoid muting real production issues
```

---

## 🔍 **QUICK DIAGNOSIS**

| Error Message | Root Cause | Quick Fix |
|---------------|------------|-----------|
| `types/database.ts is out of sync` | Schema drift | `npm run types:regen` |
| `Module not found: Can't resolve '@/lib/supabase/supabase-admin-client'` | Wrong import path | Use `@/lib/supabase-admin-client` |
| `Cannot find module '@/types/database'` | Wrong type import | Use `@/types/supabase` |
| `Property 'role' does not exist on type 'never'` | Database type not imported | Import from `@/types/supabase` |
| `Failed to construct 'URL': Invalid URL` | SafeImage component | Check image src validation |
| `Cannot find module './console'` (Playwright MCP) | Corrupted npx cache | Use `--no-install` flag in MCP config |
| `No server info found` (Playwright MCP) | MCP server not connecting | Install locally + restart Cursor |
| `406 Not Acceptable` (Supabase) | Using `.single()` when row might not exist | Replace with `.maybeSingle()` |
| `Cannot find name 'talentProfile'` (TypeScript) | Variable out of scope | Check variable scope, wrap case blocks in braces |
| `Duplicate bookings` after accepting an application | Accept flow not atomic/idempotent | Use DB RPC acceptance + unique `bookings(gig_id, talent_id)` + send emails only when `did_accept=true` |
| `ReferenceError: createNameSlug is not defined` | Missing import for utility function | Add `import { createNameSlug } from "@/lib/utils/slug";` |
| `ReferenceError: [function] is not defined` | Using function without import | Check file imports, add missing import statement |
| `N+1 API Call` (Sentry) - Multiple profile queries | Duplicate profile queries in components | Use `profile` from `useAuth()` instead of fetching separately |
| `PGRST200` - Foreign key relationship error | Invalid join between tables without direct FK | Fetch separately using intermediate table (e.g., profiles) |
| `column 'first_name' does not exist on 'talent_id'` | Invalid join - talent_id references profiles, not talent_profiles | Use `talent_profiles.user_id = talent_id` instead of direct join |
| `[cron/booking-reminders] Unauthorized cron request` (TOTLMODELAGENCY-3D) | CRON_SECRET not set in Vercel Production | Add CRON_SECRET to Vercel env vars; see `docs/troubleshooting/CRON_SECRET_SETUP.md` |
| `[totl][email] password reset link generation failed` (TOTLMODELAGENCY-3A) | User requested reset for non-existent email | Expected; filtered in Sentry. Route returns success to avoid leaking user existence. |
| `[totl][email] verification link generation failed` (TOTLMODELAGENCY-39) | User requested verification for already-registered email | Expected; filtered in Sentry. Route returns success. |
| `import/order` warnings | Incorrect import order | Run `npm run lint -- --fix` or reorder: external → react → internal → types |
| `@typescript-eslint/no-unused-vars` | Unused imports or variables | Remove unused imports, prefix unused variables with `_` |
| `Type '... | undefined' is not assignable to type '... | null'` | `.find()` returns `undefined`, variable typed as `null` | Use `?? null` to convert: `array.find(...) ?? null` |
| Syntax error: `profileError. ===` (missing property) | Incomplete error check with PGRST116 | Use `!profile` check with `.maybeSingle()`, don't check PGRST116 |
| Logic error: Checking PGRST116 with `.maybeSingle()` | PGRST116 only occurs with `.single()`, not `.maybeSingle()` | Handle errors first, then check `!profile` - no PGRST116 check needed |
| `Property 'is_suspended' does not exist on type 'profiles'` | Types out of sync after suspension migration | Run new migration locally, then `npm run types:regen` |
| Errors not in Sentry | Wrong DSN or project ID | Check `/api/sentry-diagnostic`, verify DSN ends in `4510191108292609` |
| `enableDidUserTypeOnKeyboardLogging` (Sentry Replay) | Instagram in-app browser / Android WebView Replay flake | Set prod Replay to mostly on-error and filter this exact message in `beforeSend` |

---

## 🚨 **PRE-PUSH CHECKLIST (30 seconds)**

```bash
# 1. Schema check
npm run schema:verify:comprehensive

# 2. Build test
npm run build

# 3. Lint check
npm run lint

# 4. If all pass, push
git push origin <branch>
```

---

## 🎯 **BRANCH-SPECIFIC COMMANDS**

### **DEVELOP Branch:**
```bash
npm run types:regen:dev
npm run build
git push origin develop
```

### **MAIN Branch:**
```bash
npm run types:regen:prod
npm run build
git push origin main
```

---

## ⚠️ **NEVER DO THESE**

1. ❌ Push code that doesn't build locally
2. ❌ Use `@/lib/supabase/supabase-admin-client` (extra `/supabase/`)
3. ❌ Use `@/types/database` (should be `/types/supabase`)
4. ❌ Use utility functions without importing them (e.g., `createNameSlug`, `getTalentSlug`)
5. ❌ Skip schema verification before pushing to main
6. ❌ Manually edit `types/database.ts` (it's auto-generated)
7. ❌ Join tables without direct foreign key relationships (check database_schema_audit.md first)
8. ❌ Use `talent_profiles:talent_id()` join (talent_id references profiles.id, not talent_profiles directly)

---

## ✅ **ALWAYS DO THESE**

1. ✅ Run `npm run build` before pushing
2. ✅ Use correct import paths
3. ✅ Import all utility functions you use (check `lib/utils/` directory)
4. ✅ Verify imports exist when refactoring or copying code between files
5. ✅ Regenerate types for correct environment
6. ✅ Check schema sync before pushing to main
7. ✅ Check database_schema_audit.md for FK relationships before joining tables
8. ✅ Fetch related data separately when no direct FK exists (through intermediate tables)
9. ✅ Remove unused imports when refactoring
10. ✅ Convert `undefined` to `null` when using `.find()`: `array.find(...) ?? null`
11. ✅ Use `Type | null` consistently, never `Type | undefined` for database/nullable types
12. ✅ With `.maybeSingle()`, handle errors first, then check `!data` - don't check PGRST116
13. ✅ Use `profile` from `useAuth()` in client components to avoid N+1 queries
14. ✅ Read `docs/PRE_PUSH_CHECKLIST.md` for full guidance

---

## 🆘 **EMERGENCY CONTACTS**

- **Full Checklist:** `docs/PRE_PUSH_CHECKLIST.md` (stable link; full steps in `docs/development/PRE_PUSH_CHECKLIST.md`; `npm run docs:verify-paths` guards the entry path)
- **Troubleshooting:** `docs/TROUBLESHOOTING_GUIDE.md`
- **Schema Guide:** `docs/SCHEMA_SYNC_FIX_GUIDE.md`
- **Project Rules:** `.cursorrules`

**Remember: Fix locally, then push!**
