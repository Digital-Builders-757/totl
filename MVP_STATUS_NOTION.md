# 🧱 TOTL Agency - Current MVP Status

> **What is TOTL Agency?**
> 
> It's a web platform that helps **talent (like models or creatives)** get discovered and **book gigs** with **clients (like brands or casting agents)**. Think of it like [Backstage.com](http://backstage.com/), but cleaner, faster, and more tailored for today's user experience.

---

# 🎉 CURRENT STATUS: MVP COMPLETE WITH SUBSCRIPTION SYSTEM!

## 🚀 **Latest: Stripe webhook signature-failure diagnostics hardening (February 22, 2026)**

**STRIPE / WEBHOOK OBSERVABILITY / PROD TRIAGE** - February 22, 2026
- ✅ Investigated Sentry issue `TOTLMODELAGENCY-26` and confirmed the failure is real signature verification (`POST /api/stripe/webhook`), while `my-v0-project/...` stack prefixes are non-actionable sourcemap/build path labels.
- ✅ Verified webhook route already uses raw-body verification (`req.text()` passed directly to `stripe.webhooks.constructEvent(...)`), ruling out the common parsed-body regression.
- ✅ Added safe diagnostics in `app/api/stripe/webhook/route.ts` on verification failure to log: signature presence, parsed `t=` timestamp, body length, `content-length`, `content-type`, `user-agent`, and `request-id` (without logging signature value or webhook secret).
- ✅ Re-ran required pre-ship checks successfully:
  - `npm run schema:verify:comprehensive`
  - `npm run types:check`
  - `npm run build`
  - `npm run lint`

**Problems discovered and resolved this session:**
- ✅ Discovered the production error was not caused by route body parsing logic; current implementation already follows Stripe raw-body requirements.
- ✅ Resolved observability gap by adding non-sensitive failure telemetry so future incidents can quickly distinguish non-Stripe callers vs secret/environment mismatches vs replay/timestamp anomalies.

**Next (P0 - Critical)**
- [ ] Verify one production retry event in Sentry with the new context fields and confirm caller/source + timestamp behavior.
- [ ] If failures persist with Stripe-originated traffic, rotate/regenerate the production webhook endpoint secret and validate endpoint-to-secret pairing in Stripe Dashboard + Vercel.

**Next (P1 - Follow-up)**
- [ ] Add a focused webhook integration test/assertion for failure-path diagnostics (ensuring no raw signature value is ever logged).
- [ ] Reduce existing repo-wide lint warnings so future production hotfix diffs remain easy to review.

## 🚀 **Latest: Suspended-user recovery gate hardening (February 18, 2026)**

**AUTH / MIDDLEWARE / RECOVERY SAFETY** - February 18, 2026
- ✅ Fixed middleware ordering bug where signed-in `/update-password` exception could bypass suspension enforcement.
- ✅ Moved `/update-password` allow-through to execute only after profile load + `is_suspended` redirect gate.
- ✅ Hardened recovery gate cleanup in `app/update-password/update-password-client-gate.tsx`: recovery intent now clears on all failure paths (`missing_token`, `invalid_token`, and outer catch).
- ✅ Re-ran required pre-ship checks successfully:
  - `npm run schema:verify:comprehensive`
  - `npm run types:check`
  - `npm run build`
  - `npm run lint`

**Next (P0 - Critical)**
- [ ] Add/extend auth regression coverage to explicitly prove suspended users cannot access `/update-password`.
- [ ] Validate one production reset-link flow for a suspended account to confirm `/suspended` routing is enforced on refresh/hard-nav.

**Next (P1 - Follow-up)**
- [ ] Keep docs-only auth cleanup in a separate follow-up when needed (legacy pointer stubs + index hygiene), without coupling behavior changes.
- [ ] Reduce repo-wide lint warnings so red-zone auth fixes stay easy to review.

## 🚀 **Latest: Update-password SIGNED_IN bounce prevention + scoped recovery intent (February 18, 2026)**

**AUTH / PASSWORD RESET / REDIRECT CONVERGENCE** - February 18, 2026
- ✅ Kept Pattern B gate ownership for `/update-password` (gate is the state-machine UI; form renders only in `ready` state).
- ✅ Added scoped recovery intent markers (`sessionStorage` timestamp + `?recovery=1`) so auth convergence can distinguish active reset recovery from normal signed-in auth-route redirects.
- ✅ Hardened `SIGNED_IN` redirect owner in `components/auth/auth-provider.tsx` to skip auth-route redirect only for `/update-password` with active recovery intent.
- ✅ Hardened server redirect owner in `middleware.ts` with signed-in allow-through for `/update-password`, preventing refresh/hard-nav bounce during recovery.
- ✅ Added cleanup of recovery intent on successful password update to keep the exception short-lived.
- ✅ Verified with regression checks:
  - `npm run schema:verify:comprehensive`
  - `npm run types:check`
  - `npm run build`
  - `npm run lint`
  - `npx playwright test tests/auth/auth-regressions.spec.ts`

**Problems discovered and resolved this session:**
- ✅ Root cause confirmed: `/update-password` is in `AUTH_ROUTES`, so generic signed-in convergence can eject recovery users after `setSession()` emits `SIGNED_IN`.
- ✅ Resolved by intent-scoped exception (not broad route bypass), preserving normal auth-route redirect behavior elsewhere.

**Next (P0 - Critical)**
- [ ] Validate one production password-reset flow end-to-end with a real email link and capture full redirect chain (hash token + refresh path).
- [ ] Add one signed-in recovery regression assertion that specifically proves no `/update-password -> dashboard/login` bounce after `SIGNED_IN`.

**Next (P1 - Follow-up)**
- [ ] Centralize recovery-intent lifecycle constants/cleanup into a single auth utility to avoid drift between gate, provider, and form.
- [ ] Triage existing global lint warnings unrelated to this fix so red-zone auth diffs stay easier to review.

## 🚀 **Latest: Password reset recovery hardening + auth UX consistency (February 17, 2026)**

**AUTH / PASSWORD RESET / UX** - February 17, 2026
- ✅ Fixed reset recovery state-machine contradiction on `/update-password` (no more "failed credentials" + active form at the same time).
- ✅ Expanded recovery token handling in the hash gate to support both:
  - `#access_token + #refresh_token` session hydration, and
  - `#token_hash` verification fallback.
- ✅ Unified reset and update-password visual treatment with the dark app shell (removed white-on-white experience drift).
- ✅ Added one-time email-verification confirmation on client dashboard (`verified=true`) with immediate URL cleanup.

**Checks run before ship:**
- ✅ `npm run schema:verify:comprehensive`
- ✅ `npm run types:check`
- ✅ `npm run build`
- ✅ `npm run lint`

**Next (P0 - Critical)**
- [ ] Validate in production with fresh reset emails (signed-out and signed-in edge cases), including full redirect-chain capture for one real link.
- [ ] Add/extend Playwright auth regression coverage for hash recovery modes to prevent reset-link regressions.

**Next (P1 - Follow-up)**
- [ ] Normalize import-order warnings in touched auth files to reduce lint noise and keep red-zone surfaces clean.
- [ ] Consolidate reset/update-password shared shell styles into reusable auth surface primitives to prevent future UI drift.

## 🚀 **Latest: Password reset link fix (missing_token) (February 17, 2026)**

**AUTH / PASSWORD RESET** - February 17, 2026
- ✅ Fixed `/update-password` incorrectly redirecting to `/login?error=missing_token` when Supabase recovery links provide tokens in the URL hash.
- ✅ Added Playwright auth regression traps to prevent `/choose-role -> /login` bounce and ensure `/update-password` accepts hash-token recovery links.

## 🚀 **Latest: Signup route bounce fix (/choose-role → /login) (February 17, 2026)**

**AUTH / CODE HEALTH** - February 17, 2026
- ✅ Refactor: use canonical `isAuthRoute()` in AuthProvider bootstrap guard (avoids duplicated route lists drifting over time).

**AUTH / SIGNUP** - February 17, 2026
- ✅ Fixed a client bootstrap bug that incorrectly treated `/choose-role` as a protected route and redirected signed-out users back to `/login`, breaking the create-account flow.

---

## 🚀 **Latest: Sentry + auth follow-ups (duplicate init + redirect loop protection) (February 15, 2026)**

**SENTRY / AUTH / RELIABILITY** - February 15, 2026
- ✅ Removed duplicate client Sentry initialization by moving the `Load failed` filter into `instrumentation-client.ts` and deleting `sentry.client.config.ts`.
- ✅ Made auth hard-reload de-dupe persist across reloads via `sessionStorage` (prevents reload loops + warning spam when navigation is genuinely stalled).
- ✅ Kept the longer production observation window for `router.replace()` (especially iOS Safari).

**Impact:**
- Single source of truth for client Sentry init.
- Cleaner auth redirect behavior under slow/flaky navigation.

---

## 🚀 **Latest: Auth redirect reliability (router.replace timeout hard reload) (February 15, 2026)**

**AUTH / RELIABILITY** - February 15, 2026
- ✅ Reduced false-positive navigation timeouts on iOS Safari by increasing the router.replace observation window in production.
- ✅ Added hard-reload de-dupe (10s) to avoid reload loops + Sentry warning spam when navigation is genuinely stalled.

---

## 🚀 **Latest: Sentry noise filter (TypeError: Load failed) (February 15, 2026)**

**SENTRY / RELIABILITY** - February 15, 2026
- ✅ Added `sentry.client.config.ts` and filtered the non-actionable Safari/network noise case: `TypeError: Load failed` with no stack (handled=yes).

**Why this change:**
- This error often represents transient fetch failures with no actionable stack trace; it burns attention without improving reliability.

**Impact:**
- Cleaner Sentry signal while keeping real errors (with stack traces) visible.

---

## 🚀 **Latest: BugBot follow-up (footer focus ring + redundant focus-hint) (February 15, 2026)**

**UI / QA** - February 15, 2026
- ✅ Removed redundant `focus-hint` usage on homepage CTA Buttons (already included in Button base styles).
- ✅ Added `focus-hint` to the footer “Post a Gig” button for consistent keyboard focus rings.

---

## 🚀 **Latest: Marketing interaction polish (focus rings + hover timing) (February 14, 2026)**

**UI / INTERACTION** - February 14, 2026
- ✅ Standardized marketing + gigs card hover timing (snappier, consistent durations).
- ✅ Added consistent `focus-hint` rings to key interactive elements (home CTAs, footer links, gigs breadcrumbs) for a premium keyboard UX.

**Why this change:**
- Interaction consistency is one of the biggest giveaways of “default UI”. Tight focus + hover behavior makes the product feel intentional.

**Impact:**
- Better accessibility, cleaner feel, and more consistent motion across the highest-traffic surfaces.

---

## 🚀 **Latest: Marketing typography hierarchy polish (February 14, 2026)**

**UI / TYPOGRAPHY** - February 14, 2026
- ✅ Smoothed marketing headline scale (reduced overly-jumpy sizes; consistent tracking/leading on hero + section headers).
- ✅ Standardized body copy scale for better scanability (especially on mobile) across `/` and `/gigs`.

**Why this change:**
- Makes the public surfaces feel more deliberate and “product”, less like assorted landing-page blocks.

**Impact:**
- Cleaner hierarchy, better readability, and tighter visual consistency across marketing → gigs.

---

## 🚀 **Latest: Homepage featured opportunities (real gig-card style) (February 14, 2026)**

**UI / MARKETING COHERENCE** - February 14, 2026
- ✅ Updated the homepage “Featured Opportunities” section to use the same **gig-card visual recipe** as `/gigs` (image header, category badge, metadata rows, CTA).
- ✅ Keeps marketing honest and product-feeling while still routing signed-out users to sign-in.

**Why this change:**
- Reduces the “placeholder marketing cards” feel and makes the public site look like a real product.

**Impact:**
- Higher trust + stronger visual consistency between homepage and gigs.

---

## 🚀 **Latest: Marketing UI system pass (mobile left-align + gigs spacing) (February 14, 2026)**

**UI / MARKETING COHERENCE** - February 14, 2026
- ✅ Shifted key homepage hero + section headers to **left-aligned on mobile** for a more product-like feel (keeps centered layout on md).
- ✅ Tightened `/gigs` spacing rhythm (container + section spacing) and updated copy to be more product/booking oriented.

**Why this change:**
- Reduces “marketing center-justified blocks” on mobile and improves scanability.

**Impact:**
- More intentional typography + layout rhythm across the two most visible public-facing surfaces.

---

## 🚀 **Latest: Marketing homepage gigs-first coherence (February 14, 2026)**

**MARKETING / POSITIONING** - February 14, 2026
- ✅ Updated homepage to align with gigs-first discovery (no public talent directory messaging).
- ✅ Replaced the “Featured Talent” section with a “Featured Opportunities” section to match current product direction.

**Why this change:**
- Keeps public positioning consistent with Approach B: discovery via gigs + shared links only.

**Impact:**
- Cleaner narrative on the homepage; reduces user confusion and prevents accidental “directory” expectations.

---

## 🚀 **Latest: Dashboard guardrails (screenshot + auth reset helper) (February 13, 2026)**

**QA / RELIABILITY** - February 13, 2026
- ✅ Added opt-in screenshot regression for `/client/dashboard` (mobile) to catch layout/theme flashes early.
- ✅ Introduced a centralized `resetAuthState()` helper and improved auth bootstrap error observability (non-network `getUser` failures captured to Sentry).

**Why this change:**
- Prevents polish regressions from shipping and keeps auth failures visible without spamming on transient network issues.

**Impact:**
- More consistent dashboard UX and more trustworthy auth telemetry.

---

## 🚀 **Latest: Client dashboard skeleton background match (February 12, 2026)**

**CLIENT DASHBOARD UX** - February 12, 2026
- ✅ Matched the loading skeleton background to PageShell (`bg-[var(--oklch-bg)]`) to avoid subtle gradient → solid background shift.
- ✅ Added `page-ambient` to the skeleton wrapper to match PageShell’s ambient spotlight overlay (prevents remaining flash).

**Why this change:**
- Eliminates remaining visual shift between skeleton and hydrated dashboard.

**Impact:**
- Cleaner perceived load; no corner darkening / gradient flash.

---

## 🚀 **Latest: Auth getUser transient network retry (February 12, 2026)**

**AUTH / RELIABILITY** - February 12, 2026
- ✅ Added bounded retry around `supabase.auth.getUser()` for transient network failures (e.g. Safari "Load failed")
- ✅ Avoids bubbling noisy unhandled errors when the network blips during onboarding/bootstrap

**Why this change:**
- Some browsers/networks intermittently fail the auth-js fetch even when the session is valid.

**Impact:**
- Fewer onboarding boot failures and fewer high-priority Sentry errors from transient fetch issues.

---

## 🚀 **Latest: Auth profile query retry + Sentry noise reduction (February 12, 2026)**

**AUTH / RELIABILITY** - February 12, 2026
- ✅ Added bounded retry for transient network failures when querying the profile row (addresses Safari "Load failed" fetch errors)
- ✅ Downgraded likely-network profile fetch failures to Sentry warning (still errors for non-network failures)

**Why this change:**
- Safari and some network conditions can throw transient fetch failures even when the endpoint is healthy; retry avoids spurious auth breaks and reduces Sentry noise.

**Impact:**
- More resilient onboarding/dashboard bootstrap; fewer high-priority false alarms.

---

## 🚀 **Latest: Auth redirect navigation timeout noise reduction (February 12, 2026)**

**AUTH / RELIABILITY** - February 12, 2026
- ✅ Reduced false-positive auth redirect warnings by waiting up to the configured timeout before falling back to hard reload.

**Why this change:**
- Some route transitions (especially in production / on slower devices) can take longer than a single tick, which was generating noisy Sentry warnings.

**Impact:**
- Fewer misleading warnings; redirects still reliably complete via hard reload fallback when needed.

---

## 🚀 **Latest: Mobile text alignment polish (February 12, 2026)**

**UI / MOBILE READABILITY** - February 12, 2026
- ✅ Left-aligned key multi-line text blocks on mobile (sign-in gate, gigs header, client apply status, client application status) while preserving centered layout on larger screens where appropriate.

**Why this change:**
- Left-aligned paragraphs scan faster and feel more “product” on mobile.

**Impact:**
- Cleaner, more business-like mobile reading experience.

---

## 🚀 **Latest: BugBot QA fixes (February 11, 2026)**

**QA / POLISH** - February 11, 2026
- ✅ Restored booking `completed` badge icon/label mapping (booking_status still uses it)
- ✅ Removed unused client dashboard status-color helper + lint suppression
- ✅ Fixed client dashboard stat semantics ("Completed" → "Closed")
- ✅ Fixed overflow sentinel gating so it doesn’t skip the whole suite; added guard against false positives on redirected /login

**Why this change:**
- Keeps the UI semantics consistent and prevents regression tests from giving false confidence.

**Impact:**
- Bookings display correctly; sentinel remains meaningful; dashboard reads accurately.

---

## 🚀 **Latest: Stripe webhook resilience fix (February 10, 2026)**

**STRIPE WEBHOOK RELIABILITY** - February 10, 2026
- ✅ Prevent false “orphaned” marking when the webhook ledger row cannot be read (e.g., transient DB error)
- ✅ Return 500 on ledger read failure so Stripe retries instead of silently dropping events

**Why this change:**
- A temporary DB/read error must never cause live Stripe events to be treated as terminal/orphaned.

**Impact:**
- Protects subscription state from drifting due to transient infra/DB issues.

---

## 🚀 **Latest: Mobile overflow sentinel updated for /talent 404 (February 9, 2026)**

**QA / REGRESSION** - February 9, 2026
- ✅ Updated the mobile overflow sentinel to reflect the new `/talent` behavior (true 404) so the test stays meaningful.

**Why this change:**
- The overflow sentinel previously expected the old `/talent` signed-out gate content.

**Impact:**
- Prevents false failures and keeps the regression suite aligned with product direction.

---

## 🚀 **Latest: Client dashboard status chips + skeleton loading polish (February 9, 2026)**

**CLIENT DASHBOARD UX** - February 9, 2026
- ✅ **Standardized status chips** by using the centralized typed badges (`components/ui/status-badge.tsx`) instead of local color helpers
- ✅ **Reduced layout shift** by replacing the spinner with a layout-matching skeleton for `/client/dashboard` loading
- ✅ **Schema doc correction**: reconciled `gig_status` in `database_schema_audit.md` to match the real enum

**Why this change:**
- Mixed badge implementations reduce scanability and cause inconsistent semantics.
- Spinner → full layout swap created noticeable CLS.

**Impact:**
- Dashboard feels more premium and consistent; statuses are scannable.

---

## 🚀 **Latest: Image fallback-first fix for 403 hotlinks (February 9, 2026)**

**UI RESILIENCE FIX** - February 9, 2026
- ✅ **SafeImage now uses fallback-first** for missing/invalid/known-blocked upstream hosts (prevents blank/black cards)
- ✅ **Resets error/loading state when `src` changes** (prevents “stale broken image” after filtering/tab switches)

**Why this change:**
- Remote hosts like Instagram/Pixieset frequently block hotlinking (403), which can cause Next/Image to render empty/black frames.

**Impact:**
- Cards/avatars reliably render a visible fallback instead of broken frames.

---

## 🚀 **Latest: Disable /talent public route (gigs-only discovery) (February 9, 2026)**

**PRODUCT DIRECTION UPDATE** - February 9, 2026
- ✅ **`/talent` now returns a true 404** (route kept reserved for future re-enablement)
- ✅ **Removed/adjusted internal entry points** that were linking to `/talent` as a public surface
- ✅ **Preserved public profile links** (`/talent/[slug]`) and authenticated talent surfaces (`/talent/dashboard`, etc.)

**Why this change:**
- Product direction is **gigs-first discovery** with **no public talent directory**.

**Impact:**
- Public browsing of talent via `/talent` is disabled.
- Individual profile links remain accessible where applicable.

**Next (P0 - Critical)**
- [ ] Manual QA: verify `/talent` is 404 when logged out + logged in
- [ ] Manual QA: verify `/talent/[slug]` still renders as expected

---

## 🚀 **Latest: Client Dashboard Electric Violet Polish (February 5, 2026)**

**CLIENT DASHBOARD UI POLISH** - February 5, 2026  
- ✅ **Electric Violet accent system**: Added violet/indigo accent tokens with soft/strong glow variants  
- ✅ **Surface separation polish**: Introduced lifted card surfaces + subtle blur for stat cards and panels  
- ✅ **Empty state readability**: Standardized empty states to readable foreground/muted tokens  
- ✅ **Badge resilience**: Enforced nowrap pills on dashboard headers and stat cards  

**Why this change:**
- Mobile layouts showed badge wrapping and low-contrast empty states  
- The dashboard felt like a flat dark slab without surface separation  

**Impact:**
- Stat cards and panels have clearer depth and restrained violet accents  
- Empty states are readable on dark surfaces across mobile/desktop  
- Dashboard avoids pill wrapping and overflow regressions  

**Next (P0 - Critical)**
- [ ] Manual QA on `/client/dashboard` at iPhone SE + modern iPhone widths  
- [ ] Confirm no horizontal scroll on dashboard sections  

**Next (P1 - Follow-up)**
- [ ] Consider extending Electric Violet polish to talent/admin dashboards  
- [ ] Add a lightweight screenshot regression for `/client/dashboard`  

## 🚀 **Latest: Stripe Webhook Orphaned Customer Fix + Schema Verification Fixes (February 5, 2026)**

**STRIPE WEBHOOK RELIABILITY + TYPE SAFETY** - February 5, 2026  
- ✅ **Fixed Stripe webhook orphaned customer handling**: Added metadata-first resolution, attempt tracking, and proper orphaned event handling
- ✅ **Fixed webhook ledger state machine**: Terminal statuses (`processed`, `ignored`, `orphaned`) now properly short-circuit; failed events properly retry with attempt tracking
- ✅ **Fixed schema verification errors**: Removed all `any` types and `select('*')` usage to pass schema verification
- ✅ **Added orphaned status tracking**: New migration adds `orphaned` status, `attempt_count`, `last_error`, and `customer_email` columns to webhook ledger
- ✅ **Enhanced checkout session**: Added `client_reference_id` for additional webhook resolution safety

**Why this change:**
- Webhook events for customers without matching profiles were causing infinite retries
- Schema verification was failing due to `any` types and `select('*')` usage
- Failed webhook events weren't properly tracking attempt counts and errors
- Terminal statuses weren't being checked correctly, causing unnecessary retries

**Impact:**
- Webhook events now resolve customers using metadata-first strategy (most reliable)
- Failed events properly track attempts and errors for debugging
- Terminal statuses (`orphaned`, `processed`, `ignored`) return 200 and stop retries
- All schema verification checks now pass
- Type safety improved across admin pages and settings actions

**Next (P0 - Critical)**
- [ ] Monitor webhook ledger for orphaned events and verify resolution works
- [ ] Test webhook retry behavior with failed events to verify attempt_count increments

**Next (P1 - Follow-up)**
- [ ] Consider adding email fallback resolution with uniqueness validation
- [ ] Add admin dashboard to view orphaned events

## 🚀 **Latest: Client Applications UX + Reset Password Fix (February 4, 2026)**

**CLIENT APPLICATIONS + UI IMPROVEMENTS** - February 4, 2026  
- ✅ **Server-side data fetching**: Moved all Supabase reads from client component to server `page.tsx` (compliance with architecture rules)
- ✅ **Avatar support**: Added avatar display to applications page using `avatar_url`/`avatar_path` from profiles
- ✅ **Storage URL utility**: Created `lib/utils/storage-urls.ts` for converting storage paths to public URLs
- ✅ **Supabase server improvements**: Gated debug logging behind `DEBUG_SUPABASE` flag to reduce log noise
- ✅ **Reset password contrast fix**: Fixed white-on-white text issue on reset password page (heading and labels now visible)

**Why this change:**
- Client components should not perform Supabase reads (architecture rule violation)
- Applications page needed avatar images for better UX
- Reset password page had poor contrast making text unreadable

**Impact:**
- Client applications page now follows server/client separation pattern
- Better visual identification of talent in applications list
- Reset password page is now readable with proper contrast
- Reduced log noise in production (debug logs only when explicitly enabled)

**Next (P0 - Critical)**
- [ ] Manual smoke tests: mobile layout, search, filters, accept/reject flows

**Next (P1 - Follow-up)**
- [ ] Consider tightening `next.config.mjs` remotePatterns (remove `hostname: "**"` wildcard)

## 🚀 **Latest: AuthSessionMissingError Sentry Noise Fix (February 4, 2026)**

**AUTH RELIABILITY + SENTRY NOISE REDUCTION** - February 4, 2026  
- ✅ **Fixed AuthSessionMissingError Sentry noise**: Added `getSession()` gate before `getUser()` to prevent calling `getUser()` when no session exists
- ✅ **Bulletproof route protection**: Deny-by-default protected path logic with explicit `/talent/[slug]` exception using reserved segments
- ✅ **Route-aware error handling**: Missing session on public pages exits quietly; protected pages redirect to login (no error thrown)
- ✅ **Narrow Sentry filter**: Only filters `AuthSessionMissingError` when breadcrumbs prove guest mode on public pages
- ✅ **Prefetch prevention**: Added `prefetch={false}` to `/choose-role` links visible to guests to reduce prefetch-triggered bootstrap noise
- ✅ **Enhanced breadcrumbs**: Added `getSession_start` and `getSession_done` for better observability

**Why this change:**
- Bootstrap was calling `getUser()` even when no session existed (guest mode on public pages)
- This caused `AuthSessionMissingError` to be thrown and logged to Sentry as an error
- Sentry was reporting "users can't sign up" when it was actually "bootstrap treats guest mode like an exception"
- `/gigs` was incorrectly marked as protected (should be public for SEO/browsing)

**Impact:**
- Sentry noise eliminated: No more `AuthSessionMissingError` events from guest mode on public pages
- Real auth failures still visible: Filter only applies to guest mode on public pages
- Product behavior preserved: `/gigs` remains public, `/talent/[slug]` marketing profiles remain public
- Better observability: Enhanced breadcrumbs make it clear when session gate works

**Next (P0 - Critical)**
- [ ] Monitor Sentry for 24 hours to verify `AuthSessionMissingError` noise eliminated
- [ ] Verify real auth failures on protected routes still captured in Sentry

**Next (P1 - Follow-up)**
- [ ] Run 8 acceptance tests (6 original + 2 new) to verify fix
- [ ] Consider adding Sentry dashboard filter for `auth.bootstrap` breadcrumbs

## 🚀 **Latest: Auth Recovery + Session Context Hardening (February 2, 2026)**

**AUTH RELIABILITY** - February 2, 2026  
- ✅ **Auth timeout recovery redirect**: Recovery flow now returns to `/login?cleared=1` instead of a hard reload
- ✅ **Talent dashboard session context**: Session capture uses `auth.getUser()` for consistent cookie-backed context
- ✅ **Docker DB setup guide**: Added comprehensive local Docker + Supabase troubleshooting guide

**Why this change:**
- Hard reloads can re-trigger stale auth state; redirecting to login is more deterministic
- `getUser()` aligns auth context with server-side session behavior
- Local Docker setup issues were slowing down schema/migration validation

**Impact:**
- Auth recovery is more predictable and less noisy in redirects
- Session context logging reflects actual authenticated user state
- Faster onboarding and fewer local DB setup failures

**Next (P0 - Critical)**
- [ ] Verify auth recovery flow in production (cleared session → login)

**Next (P1 - Follow-up)**
- [ ] Add a short video/screenshot to Docker setup guide (optional)

## 🚀 **Latest: Moderation Queue Recovery (February 2, 2026)**

**ADMIN MODERATION RELIABILITY** - February 2, 2026  
- ✅ **Restored moderation schema in production**: Applied migration to recreate `public.content_flags` + RLS policies when missing
- ✅ **Fixed moderation queue data fetch**: Removed invalid PostgREST embed on `resource_id` and assembled target profiles via safe split query
- ✅ **Added missing-table safety net**: Explicit logging + admin notice when `content_flags` is absent in an environment
- ✅ **Regenerated Supabase types**: `types/database.ts` now matches live schema with `content_flags`

**Why this change:**
- Production DB lacked `public.content_flags`, causing `/admin/moderation` to fail regardless of query quality
- PostgREST embeds require real FKs; `resource_id` is polymorphic and cannot be embedded directly

**Impact:**
- Moderation queue can load for admins once the migration is applied
- Missing-table failure mode is now self-identifying and faster to triage

**Next (P0 - Critical)**
- [ ] Verify `/admin/moderation` loads for admin in production without Sentry errors

**Next (P1 - Follow-up)**
- [ ] Rotate leaked Supabase keys and update Vercel env vars

## 🚀 **Latest: Auth Bootstrap Reliability + Sentry Noise Reduction (January 30, 2026)**

**AUTH + DASHBOARD RELIABILITY** - January 30, 2026  
- ✅ **Fixed talent dashboard applications query**: Removed invalid PostgREST embed and merged company names via set-based `client_profiles` fetch
- ✅ **Hardened auth bootstrap**: Switched bootstrap to `getUser()` with AbortError retry and elapsedMs breadcrumbs
- ✅ **Soft/hard timeout guard**: 8s soft signal + 12s recovery UI with dedupe to reduce false alarms
- ✅ **Login prefetch throttling**: Disabled Link prefetch on auth routes to reduce RSC contention during redirects
- ✅ **Sentry noise filter**: Filtered Supabase auth-js lock AbortError with breadcrumb for counting
- ✅ **Tower-only auth callback**: Deferred onAuthStateChange handling to an effect queue to avoid heavy work in callback

**Why this change:**
- PostgREST embeds require direct FKs; the old query assumed a relationship that doesn't exist
- Auth bootstrap timeouts and lock aborts were creating noisy warnings without clear diagnostics
- App Router prefetching on `/login` was competing with redirect timing
- Supabase auth callbacks can fire frequently; deferring work avoids lock contention

**Impact:**
- Talent dashboard applications no longer throw PGRST200 errors
- Auth bootstrap is more deterministic with clearer timings and fewer false positives
- Sentry now surfaces real auth failures while de-noising expected lock aborts
- Auth redirects are handled outside the auth callback for better stability

**Next (P0 - Critical)**
- [ ] Deploy latest bundle to production and verify Sentry issue resolution for PGRST200 + auth timeouts

**Next (P1 - Follow-up)**
- [ ] Consider build SHA tag in Sentry for bundle provenance
- [ ] Monitor auth bootstrap elapsedMs and lock abort breadcrumb counts post-deploy

## 🚀 **Latest: Team Release Notes Added (January 25, 2026)**

**TEAM RELEASE NOTES** - January 25, 2026  
- ✅ **Created team-focused release notes**: New `docs/releasenotes/v1.0.0-team.md` for non-technical team members
- ✅ **Updated release notes index**: Added reference to team version in `docs/releasenotes/README.md`
- ✅ **Non-technical format**: Simplified language, quick start guides, and action items for team testing

**Why this change:**
- Technical release notes (`v1.0.0.md`) are too detailed for non-technical team members
- Team needs simple explanation of what the app does and how to use it
- Clear action items needed for team testing and feedback

**Impact:**
- Non-technical team members can understand MVP launch without technical jargon
- Clear quick start guides for each role (Talent, Career Builder, Admin)
- Action items encourage team testing and bug reporting
- Links to full user guide for detailed information

**Next (P0 - Critical)**
- [ ] None - team release notes complete

**Next (P1 - Follow-up)**
- [ ] Share team release notes with non-technical stakeholders
- [ ] Collect feedback from team testing sessions

## 🚀 **Previous: Documentation Organization & Release Notes System (January 25, 2026)**

**DOCUMENTATION REORGANIZATION** - January 25, 2026  
- ✅ **Created release notes system**: New `docs/releasenotes/` directory with versioned files (`v1.0.0.md`) and README guide
- ✅ **Organized documentation**: Reorganized 100+ docs into logical subdirectories (guides, development, features, troubleshooting, performance, security, audits)
- ✅ **Updated documentation index**: Updated `DOCUMENTATION_INDEX.md` to reflect new structure with proper paths
- ✅ **Created organization summary**: Added `docs/ORGANIZATION_SUMMARY.md` for quick reference
- ✅ **Fixed README.md**: Cleaned up formatting issues and improved structure

**Why this change:**
- Documentation was scattered across root `docs/` directory making it hard to find relevant files
- Release notes needed versioning system for future updates
- README.md had formatting issues and test content

**Impact:**
- Easy navigation: docs organized by purpose (guides, features, troubleshooting, etc.)
- Versioned release notes: future releases can follow `v1.1.0.md`, `v2.0.0.md` pattern
- Better discoverability: clear directory structure for developers
- Professional README: clean, well-formatted project overview

**Next (P0 - Critical)**
- [ ] None - documentation organization complete

**Next (P1 - Follow-up)**
- [ ] Consider adding README files to each subdirectory for navigation
- [ ] Archive old documentation that's been superseded

## 🚀 **Previous: Client Post-Gig Theme Alignment (January 25, 2026)**

**TERMINAL UI CONSISTENCY FIX** - January 25, 2026  
- ✅ **Added `/post-gig` surface wrapper**: New route layout enforces dashboard surface tokens without routing changes
- ✅ **Semantic tokens applied**: Replaced hard-coded slate/gray classes with `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`
- ✅ **No opacity washout**: Card uses `bg-card/80` + `backdrop-blur` instead of container-level opacity
- ✅ **Readable inputs**: Inputs/textareas/select trigger now use semantic placeholder + foreground classes
- ✅ **Minimal contrast tune**: Slight bump to dark `--muted-foreground`, `--card`, and `--border` for legibility

**Why this change:**
- `/post-gig` rendered in a light surface while form components assumed dark mode
- Muted/secondary text was too low-contrast on dark surfaces

**Impact:**
- Post-gig page now visually matches client dashboard terminal
- Helper text and placeholders remain readable without affecting other surfaces

**Next (P0 - Critical)**
- [ ] Sanity-check dashboard empty states + muted copy for contrast

**Next (P1 - Follow-up)**
- [ ] Audit other client terminal pages for hard-coded light/dark classes

## 🚀 **Latest: Gig Image Upload 400 Fix (January 25, 2026)**

**SERVER ACTIONS BODY LIMIT FIX** - January 25, 2026  
- ✅ **Raised Server Actions body limit**: `experimental.serverActions.bodySizeLimit` set to `4mb`
- ✅ **Aligned validation caps**: Client + server image size validation now both enforce 4MB
- ✅ **Runtime config moved to route segment**: `runtime = "nodejs"` lives on page segment (not server action file)
- ✅ **Updated upload UX**: Helper text encourages ~1MB images for faster uploads
- ✅ **Debug doc refreshed**: Error guide now matches new size limits and runtime placement

**Why this change:**
- Server Actions reject request bodies over 1MB with a 400 before action code runs
- Logging and Supabase errors never surfaced because the request died upstream

**Impact:**
- Image uploads no longer fail early at ~1.5MB
- Debug logging is now reachable for real storage/RLS errors

**Next (P0 - Critical)**
- [ ] Redeploy to ensure `next.config.mjs` changes take effect
- [ ] Re-test with a 1–2MB image to confirm 400 is resolved

**Next (P1 - Follow-up)**
- [ ] Consider client-side compression to keep uploads small by default

## 🚀 **Latest: Database Table Count Reconciliation & CI Enforcement (January 25, 2026)**

**DATABASE TABLE COUNT RECONCILIATION** - January 25, 2026  
- ✅ **Fixed table count discrepancy**: Reconciled inconsistent counts (14 vs 8 vs actual 13) across all status reports
- ✅ **Created canonical reconciliation document**: `docs/DATABASE_TABLE_COUNT_RECONCILIATION.md` as single source of truth
- ✅ **Added CI enforcement script**: Created `scripts/verify-table-count.mjs` that verifies table count matches reconciliation doc
- ✅ **Updated all status reports**: All reports now reference canonical source instead of duplicating numbers
- ✅ **Added supporting tables section**: Enhanced `docs/DATABASE_REPORT.md` to include all 13 tables (8 core + 5 supporting)
- ✅ **Locked verification method**: SQL query using `information_schema.tables` with `table_type = 'BASE TABLE'` scope
- ✅ **Environment verification**: Documented which environment was verified (local dev database)
- ✅ **Drift-resistant guardrails**: Softened language to "drift-resistant" (not drift-proof) with CI enforcement

**Why this change:**
- Multiple status reports had inconsistent table counts (14 vs 8)
- Risk of confusion in pitch decks, launch posts, or stakeholder communications
- Needed objective verification method and single source of truth
- Required CI enforcement to prevent future drift

**Impact:**
- Consistent, accurate table count across all documentation (13 total: 8 core + 5 supporting)
- Objective verification method locked in (SQL query + BASE TABLE scope)
- Self-enforcing system (CI check prevents drift)
- Clear scope definition (public schema BASE TABLES only, excludes views/materialized views/Supabase schemas)
- Environment-aware (documents which database was verified)

**Next (P0 - Critical)**
- [ ] Add `npm run table-count:verify` to CI pipeline (optional but recommended)
- [ ] Run verification script after any table additions/removals

**Next (P1 - Follow-up)**
- [ ] Consider adding to pre-commit hooks for local enforcement
- [ ] Monitor for any environment-specific discrepancies (local vs staging vs production)

## 🚀 **Previous: Performance Cleanup - Console Logs Elimination & Client Dashboard RSC Conversion (January 25, 2026)**

**PERFORMANCE CLEANUP IMPLEMENTATION** - January 25, 2026  
- ✅ **ESLint rule added**: Added `no-console` rule to block `console.log/debug` in production (allows `console.warn/error` for critical errors)
- ✅ **Logger utility created**: Created `lib/utils/logger.ts` with Sentry integration, log levels (debug/info/warn/error), automatic redaction of sensitive keys, and structured context
- ✅ **Console statements replaced**: Replaced ~100+ console statements across 15+ files with logger calls (auth-provider: 39, talent dashboard: 11, client dashboard: 6, stripe webhook: 20, admin pages: ~30)
- ✅ **Client dashboard RSC conversion**: Converted `/client/dashboard` from 1018-line client component to Server Component pattern (matches talent dashboard architecture)
  - Created `app/client/dashboard/page.tsx` (Server Component)
  - Created `app/client/dashboard/client.tsx` (Client Component - UI only)
  - Created `app/client/dashboard/loading.tsx` (Loading skeleton)
- ✅ **Dashboard query pattern fixed**: Fixed `getClientDashboardData()` to use parallel queries + fetch + merge pattern (prevents N+1 queries)
- ✅ **Sentry performance spans added**: Added `Sentry.startSpan` to dashboard data fetching functions for performance monitoring
- ✅ **RSC architecture verified**: Verified all largest pages use Server Components correctly (admin pages, talent dashboard, client dashboard, gigs pages)
- ✅ **Documentation updated**: Created `docs/PERFORMANCE_CLEANUP_IMPLEMENTATION_SUMMARY.md` and `docs/PERFORMANCE_CLEANUP_PLAN.md`

**Why this change:**
- Production code had 241 console statements causing performance overhead and cluttered browser console
- Client dashboard was fetching data client-side, causing slower initial loads and larger bundles
- Needed proper production logging with Sentry integration
- Required RSC architecture compliance for better performance

**Impact:**
- Zero `console.log/debug` statements in production (ESLint blocks new ones)
- Cleaner Sentry error grouping with structured logs and redaction
- Faster client dashboard load time (~50-70% improvement expected)
- Smaller JavaScript bundle size (data fetching moved to server)
- Better performance monitoring via Sentry spans
- Architecture compliance: all largest pages use RSC pattern

**Next (P1 - Follow-up)**
- [ ] Monitor Sentry Performance Dashboard for baseline metrics
- [ ] Continue replacing remaining ~140 console statements in other files (incremental, not blocking)
- [ ] Measure actual load time improvements post-deployment
- [ ] Consider adding React Query/SWR for request deduplication if needed

## 🚀 **Previous: Gig Image Upload Feature + Security Hardening (January 22, 2026)**

**GIG IMAGE UPLOAD IMPLEMENTATION** - January 22, 2026  
- ✅ **Complete gig image upload system**: Created reusable `GigImageUploader` component with drag & drop, validation, and preview
- ✅ **Storage bucket migration**: Created `gig-images` public bucket with secure RLS policies (users can only manage their own images)
- ✅ **Server-side upload logic**: Implemented `uploadGigImage()` helper with enhanced validation (MIME type, size, extension matching)
- ✅ **Cleanup on failure**: Added `deleteGigImage()` helper that automatically cleans up orphaned images when gig creation fails
- ✅ **Security hardening**: Replaced `Math.random()` with `crypto.randomUUID()` for stronger randomness
- ✅ **Path ownership assertion**: Added early validation in delete operations to prevent noisy failed deletes
- ✅ **Both create flows updated**: Client-facing (`/post-gig`) and admin (`/admin/gigs/create`) forms now support image upload
- ✅ **Comprehensive documentation**: Created security audit, implementation summary, and hardening docs

**Why this change:**
- Users couldn't upload cover images when creating gigs (missing UI + server logic + storage setup)
- Needed secure storage policies to prevent unauthorized access
- Required cleanup logic to prevent orphaned images on failure
- Needed production-grade security hardening

**Impact:**
- Users can now upload gig cover images during creation
- Images are securely stored with proper RLS policies
- Orphaned images are automatically cleaned up on failure
- Stronger random ID generation prevents collisions
- Complete end-to-end flow: UI → server → storage → DB

**Next (P1 - Follow-up)**
- [ ] Run migration: `npx supabase migration up --linked` to create storage bucket
- [ ] Test image upload flow in production
- [ ] Consider image replacement feature (delete old image when replacing)
- [ ] Consider image compression/resizing for better performance

## 🚀 **Previous: Gig Categories & Performance Hardening (January 22, 2026)**

**GIG CATEGORIES & PERFORMANCE HARDENING** - January 22, 2026  
- ✅ **Hardened gig category filtering system**: Added `getCategoryFilterSet()` guard that returns `[]` for empty/null inputs, preventing accidental filtering when "All" is selected
- ✅ **Added dev-only warnings for unknown categories**: Unknown categories now log warnings in development to catch data drift early
- ✅ **Parallel query fetching in `/gigs` page**: Eliminated waterfall by fetching profile and gigs queries simultaneously using `Promise.all`
- ✅ **Keyword sanitization**: Added input sanitization for search keywords to prevent query syntax errors from special characters
- ✅ **Removed unsafe type casts**: Eliminated `as Database["public"]["Tables"]["gigs"]["Row"]` cast by ensuring `GigRow` type matches helper function requirements
- ✅ **Updated obfuscation logic to use normalized categories**: Migrated from legacy category keys to canonical normalized categories, ensuring new and legacy categories work correctly
- ✅ **Replaced "Career Builder" with generic terms**: Changed brand-specific terminology to "client"/"brand" throughout for better UX clarity

**Why this change:**
- Category filtering needed hardening to prevent accidental filtering when empty strings are passed
- Performance optimization: Sequential queries were causing unnecessary latency
- Type safety: Unsafe casts were hiding potential type mismatches
- Obfuscation logic was only recognizing legacy categories, missing new canonical categories

**Impact:**
- More resilient category filtering (empty array = no constraint pattern)
- Faster page loads due to parallel query execution
- Full type safety without casts
- Obfuscation works correctly for all categories (new and legacy)
- Cleaner UX with generic terminology

**Next (P1 - Follow-up)**
- [ ] Monitor production for unknown category warnings (should be rare)
- [ ] Consider migrating keyword search to full-text search (tsvector) when keyword search becomes a bottleneck
- [ ] Consider estimated count or "hasNext" pagination strategy if exact counts become expensive

## 🚀 **Previous: Three Truths Logging - Auth Redirect Debugging & Verification (January 20, 2026)**

**THREE TRUTHS LOGGING IMPLEMENTATION** - January 20, 2026  
- ✅ **Added comprehensive logging to prove session is cookie-backed end-to-end**: Implemented "three truths" logging to verify SIGNED_IN fires, cookies exist in browser, and middleware receives cookies
- ✅ **AuthProvider signIn() logging**: Added logging after `signInWithPassword` to show session result and prove cookies exist (`[auth.signIn]` logs)
- ✅ **AuthProvider onAuthStateChange logging**: Enhanced logging at top of callback to show event, session, pathname, and cookie presence (`[auth.onAuthStateChange]` logs)
- ✅ **Middleware cookie logging**: Added cookie name logging before `getUser()` when `DEBUG_ROUTING=1` is set (`[totl][middleware] cookie names` logs)
- ✅ **Created comprehensive test suite**: Added `tests/auth/three-truths-logging.spec.ts` with 4 tests to verify all three truths + redirect behavior
- ✅ **Complete documentation**: Created implementation guide, testing guide, and summary docs

**Why this change:**
- Needed visibility into auth redirect flow to diagnose issues
- Tests were timing out, suggesting redirect wasn't happening
- Required proof that session is cookie-backed end-to-end (browser → middleware)

**Impact:**
- Complete visibility into login → redirect pipeline
- Can identify exactly where failures occur (event listener, cookie storage, or cookie transmission)
- Tests verify all three truths are proven
- Debugging capability for production issues

**Next (P1 - Follow-up)**
- [ ] Monitor production logs for three truths (all should be true after login)
- [ ] Use logs to verify redirect happens correctly
- [ ] Consider reducing logging verbosity once stable

## 🚀 **Previous: Cookie-Based Session Fix - Middleware Session Visibility (January 20, 2026)**

**COOKIE-BASED SESSION FIX** - January 20, 2026  
- ✅ **Fixed browser client to use cookie-based sessions**: Switched from `createClient` (localStorage-only) to `createBrowserClient` from `@supabase/ssr` (cookie-based)
- ✅ **Fixed middleware cookie preservation**: Added `redirectWithCookies` helper to preserve Supabase cookie updates during redirects
- ✅ **Improved server client error handling**: Added development warnings for cookie write failures
- ✅ **Fixed TypeScript compatibility**: Resolved type compatibility quirk between `@supabase/ssr` and `@supabase/supabase-js` versions

**Why this change:**
- Browser client was using localStorage-only sessions, making middleware unable to read session state (`userId: null`)
- Middleware redirects were dropping cookie updates, causing session loss during navigation
- This caused redirect loops and authentication failures after login

**Impact:**
- Middleware can now see authenticated users (reads cookies instead of localStorage)
- Session persists correctly across redirects
- No more `userId: null` in middleware logs after login
- Eliminates redirect loops caused by session visibility issues

**Next (P1 - Follow-up)**
- [x] Monitor production logs for middleware `userId` values (should not be null after login) - Now verified via three truths logging
- [x] Verify no redirect loops occur in production - Now testable via three truths test suite
- [ ] Test session persistence across page refreshes

## 🚀 **Previous: ISR to Dynamic Migration - MVP Honesty Mode (January 20, 2026)**

**ISR TO DYNAMIC MIGRATION** - January 20, 2026  
- ✅ **Removed ISR from routes using `createSupabaseServer()`**: `/gigs/[id]` and `/talent/[slug]` now use `force-dynamic` instead of ISR
- ✅ **Fixed TypeScript type mismatches**: Updated `TalentApplication` and `ApplicationDetailsModal` types to match `ApplicationWithGigAndCompany` structure from server actions
- ✅ **Updated documentation**: `docs/ROUTE_CACHING_STRATEGY.md` now correctly documents that routes using `createSupabaseServer()` are always dynamic
- ✅ **Created migration plan**: `docs/ISR_TO_DYNAMIC_MIGRATION_PLAN.md` documents the change rationale and approach
- ✅ **Honest rendering behavior**: Routes now correctly declare dynamic rendering instead of claiming ISR/CDN caching when cookies are accessed

**Why this change:**
- Routes calling `createSupabaseServer()` use `cookies()` which requires dynamic rendering
- ISR cannot work correctly when routes access request-bound values (cookies, headers, searchParams)
- Previous ISR configuration was misleading - pages were effectively dynamic but claimed CDN caching

**Next (P1 - Follow-up)**
- [ ] Monitor performance impact (pages will be slower but honest about rendering mode)
- [ ] Future optimization: Refactor routes to split public data (ISR) from user-specific data (dynamic client component) if performance becomes critical

## 🚀 **Previous: Performance Optimization - "Snappy" Initiative (January 20, 2026)**

**PERFORMANCE OPTIMIZATION - PHASE 1 COMPLETE** - January 20, 2026  
- ✅ **Sentry Web Vitals Enabled**: Added `browserTracingIntegration` to track LCP, INP, CLS metrics automatically (10% production, 100% dev sampling)
- ✅ **Performance Baseline Ledger**: Created `docs/PERFORMANCE_BASELINE.md` with target metrics for all key routes
- ✅ **Route Caching Strategy**: Updated to correctly document dynamic routes (routes using `createSupabaseServer()` are always dynamic)
- ✅ **Talent Dashboard Server Component Refactor**: Migrated to parallel server-side data fetching (`Promise.all`) eliminating sequential client-side queries
- ✅ **Streaming UI**: Added `loading.tsx` with Suspense boundaries for progressive rendering
- ✅ Created comprehensive implementation docs:
  - `docs/PERFORMANCE_OPTIMIZATION_PLAN.md` - Complete optimization plan (Approach A+)
  - `docs/PERFORMANCE_OPTIMIZATION_IMPLEMENTATION.md` - Implementation summary
  - `docs/ROUTE_CACHING_STRATEGY.md` - Caching documentation (updated)
  - `docs/PERFORMANCE_BASELINE.md` - Metrics tracking

**Next (P1 - Follow-up)**
- [ ] Complete client dashboard Server Component refactor (requires file restructuring)
- [ ] Run Supabase Performance Advisor to verify RLS predicate indexes
- [ ] Measure baseline metrics post-deployment via Sentry Web Vitals
- [ ] Phase 3: Bundle optimization (dynamic imports, image/font optimization)

## 🚑 **Previous Fix: Bugbot Error Handling Fixes (January 19, 2026)**

**BUGBOT ERROR HANDLING FIXES** - January 19, 2026  
- ✅ **Issue #1**: Fixed client dashboard error state not displayed - Added error banner with retry button when `fetchDashboardData` fails (users now see errors instead of blank dashboard)
- ✅ **Issue #2**: Fixed Sentry import blocking form recovery - Wrapped dynamic Sentry import in try-catch to ensure `setError()` and `setSubmitting(false)` always execute, preventing form stuck in submitting state
- ✅ **Issue #3**: Fixed talent dashboard infinite loading - Added `supabase` to useEffect dependencies to handle null → non-null transition, ensuring data loads when Supabase client initializes
- ✅ All fixes follow Approach A (minimal, Constitution-safe changes)
- ✅ Reused existing UI patterns (Alert component) for consistency
- ✅ Created comprehensive plan document: `docs/BUGBOT_FIXES_PLAN.md`

**Next (Future Enhancements)**
- [ ] Monitor Sentry for any new error patterns related to these fixes
- [ ] Add automated tests for error display and form recovery scenarios

## 🚑 **Previous Fix: Supabase API Key Diagnostics + Auth Timeout Recovery (January 20, 2025)**

**SUPABASE API KEY DIAGNOSTICS + AUTH TIMEOUT RECOVERY** - January 20, 2025  
- ✅ **Environment Presence Beacon**: Added truth beacon in `lib/supabase/supabase-browser.ts` that logs env var presence on client initialization with Sentry breadcrumbs and tags (`supabase_env_present`) for production debugging
- ✅ **Enhanced Error Logging**: Added comprehensive Sentry integration for Supabase query errors in `app/gigs/[id]/apply/apply-to-gig-form.tsx` with full context (error codes, details, hints, gigId, userId, session state)
- ✅ **Health Check Route**: Created `/api/health/supabase` endpoint to verify Supabase client initialization and environment variable presence
- ✅ **Auth Timeout Recovery**: Implemented 8-second timeout guard in `components/auth/auth-provider.tsx` with recovery UI (`components/auth/auth-timeout-recovery.tsx`) to fix infinite loading spinner caused by stale auth tokens
- ✅ **Enhanced Diagnostics**: Added breadcrumb logging at 5 critical auth checkpoints (`auth.init`, `auth.session_check`, `auth.profile_fetch`, `auth.complete`, `auth.timeout`) for production debugging
- ✅ **Supabase Env Banner**: Created `components/supabase-env-banner.tsx` to display environment variable status in development
- ✅ **Client Dashboard Improvements**: Enhanced error handling and loading states in client dashboard and applications pages
- ✅ **Documentation**: Created comprehensive implementation guides:
  - `docs/SUPABASE_API_KEY_FIX_IMPLEMENTATION.md`
  - `docs/AUTH_TIMEOUT_RECOVERY_IMPLEMENTATION.md`
  - `docs/DEBUG_NETWORK_INITIATOR.md`
  - `docs/INFINITE_LOADING_DEBUG_PLAN.md`

**Next (Future Enhancements)**
- [ ] Monitor Sentry for "No API key found" errors with enhanced diagnostics
- [ ] Use Network tab Initiator column to identify any direct REST calls bypassing Supabase client
- [ ] Consider adding client-side environment variable validation on app mount

## 🚑 **Previous Fix: Talent Dashboard Infinite Loading + API Key Diagnostics (December 15, 2025)**

**TALENT DASHBOARD RESILIENCE UPGRADES** - December 15, 2025  
- ✅ **Upgrade 1**: Enforced single canonical browser client - `createSupabaseBrowser()` throws in production if env vars missing (no silent null states)
- ✅ **Upgrade 2**: Decoupled applications loading from dashboard shell - separate `applicationsLoading`/`applicationsError` states keep dashboard functional even if applications query fails
- ✅ **Upgrade 3**: Enhanced diagnostics - capture full session/auth context (hasSession, userId, userEmail, sessionExpiry) before queries for production debugging
- ✅ Fixed infinite loading spinner by ensuring `setDataLoading(false)` always runs in `finally` blocks
- ✅ Applications widget shows independent loading/error states with retry button (dashboard shell stays alive)
- ✅ Enhanced Sentry error reporting with session context tags (`has_session`, `error_type`, `error_code`)
- ✅ Created comprehensive implementation guide: `docs/TALENT_DASHBOARD_UPGRADES_IMPLEMENTATION.md`

**Next (Future Enhancements)**
- [ ] Monitor Sentry for new error patterns with enhanced session context
- [ ] Use Network tab Initiator column to identify any direct REST calls (if "No API key found" persists)

## 🚑 **Previous Fix: Redirect Error Handling Fix (December 27, 2025)**

**REDIRECT ERROR HANDLING** - December 27, 2025  
- ✅ Fixed redirect error handling in `app/talent/dashboard/page.tsx` - Added `isRedirectError()` check to properly re-throw redirect errors when `redirect()` is called inside try-catch blocks
- ✅ Fixed import order lint warning in `app/admin/users/admin-users-client.tsx`
- ✅ Updated docs/COMMON_ERRORS_QUICK_REFERENCE.md with Server Component redirect error handling pattern

**Previous Fix: Sentry Error Fixes (December 27, 2025)**

**SENTRY ERROR RESOLUTION** - December 27, 2025  
- ✅ Fixed TOTLMODELAGENCY-1F: `specialties.map is not a function` - Added array normalization helper for specialties/languages fields
- ✅ Fixed TOTLMODELAGENCY-1E: `revalidatePath during render` - Removed revalidatePath calls from ensureProfileExists() when called during render
- ✅ Fixed TOTLMODELAGENCY-1D: Server Components render error - Added error handling to talent dashboard server component and getBootState()
- ✅ Fixed TOTLMODELAGENCY-1G: `__firefox__` ReferenceError - Added browser extension error filtering in Sentry
- ✅ Fixed TOTLMODELAGENCY-1H: `window.__firefox__.reader` TypeError - Enhanced Firefox detection error filtering
- ✅ Fixed TOTLMODELAGENCY-18: Hydration error on admin/users - Replaced toLocaleDateString() with SafeDate component
- ✅ Updated docs/COMMON_ERRORS_QUICK_REFERENCE.md with new error patterns and fixes

**Next (Future Enhancements)**
- [ ] Monitor Sentry for any new error patterns
- [ ] Consider adding more comprehensive error boundaries

## 🚑 **Previous Fix: Admin Profile Visibility (December 22, 2025)**

**ADMIN DASHBOARD PROFILE VIEWING** - December 22, 2025  
- ✅ Fixed admin dashboard unable to view "Talent Profile" or "Client Profile" pages (blocked/redirected state)
- ✅ Added middleware exception for admin accessing `/client/profile?userId=<uuid>` (view-only, UUID validated)
- ✅ Updated `/client/profile/page.tsx` to accept `userId` param and allow admin override
- ✅ **CRITICAL SECURITY FIX**: Prevented non-admin clients from viewing other clients' profiles (data leak prevention)
- ✅ Created read-only `ClientProfileDetails` component for admin viewing (prevents accidental edits)
- ✅ Removed problematic `profiles` query for target user (avoids RLS recursion issue)
- ✅ Added friendly empty state when client profile doesn't exist (no redirect loops)
- ✅ Fixed admin link to include `userId` param in `/admin/users` dropdown
- ✅ Admin can now view all user information needed for ops (email/contact/profile fields)
- ✅ All changes respect RLS (no service role bypass), explicit selects, server components only
- ✅ Created comprehensive audit report: `docs/ADMIN_VISIBILITY_AUDIT_REPORT.md`
- ✅ Created implementation summary: `docs/ADMIN_VISIBILITY_IMPLEMENTATION_SUMMARY.md`

**Next (Future Enhancements)**
- [ ] Consider adding non-recursive admin read policy for `profiles` table (if direct queries needed)
- [ ] Add Playwright tests for admin profile visibility (`tests/admin/admin-profile-visibility.spec.ts`)

## 🚑 **Previous Fix: Approach B Policy Implementation (PR1 + PR2 + PR3 Complete)**

**ACCESS/VISIBILITY POLICY ALIGNMENT** - December 21, 2025  
- ✅ Locked **Approach B (Hybrid)** policy matrix: public talent marketing profiles at `/talent/[slug]` (no sensitive fields), no talent directory exists, clients see talent only via relationships (Applicants/Bookings), gigs list requires sign-in (G1).  
- ✅ **PR1 Complete**: Removed all discoverability surfaces that advertise "Browse Talent Directory" or "Browse Gigs" for signed-out users.  
- ✅ Updated navbar: removed "Talent" directory link, removed "Gigs" link for signed-out (G1: list requires sign-in).  
- ✅ Updated homepage: removed "Browse Talent" hero/footer CTAs, removed "Find Gigs" footer link.  
- ✅ Updated command palette: changed "Browse Gigs" to "Sign in to Browse Gigs" for signed-out users.  
- ✅ Updated admin labels: renamed "View Talent Portal" → "Public Site View" for clarity.  
- ✅ Updated demo pages: removed links to `/talent` directory from `/project-overview` and `/ui-showcase`.  
- ✅ Created canonical policy matrix document: `docs/POLICY_MATRIX_APPROACH_B.md` (source of truth for access/visibility rules).  
- ✅ Created implementation tracker: `docs/APPROACH_B_IMPLEMENTATION.md` (PR sequence status).  
- ✅ **PR2 Complete**: Control plane alignment (routing constants + middleware) - removed `/gigs` and `/talent` from public routes, eliminated public prefix allowlist, implemented explicit one-segment public matchers only (`/talent/[slug]` and `/gigs/[id]`), hard deny `/talent` directory and require sign-in for `/gigs` list, fixed profile-missing bootstrap bug (allow `/gigs` for signed-in users without profile).  
- ✅ Updated middleware: explicit handling for `/talent` directory (redirect SO/T/C away), `/gigs` list (require sign-in for SO), preserved `/gigs/[id]` and `/talent/[slug]` as public, bootstrap-safe routes preserved (no redirect loops).  
- ✅ **PR3 Complete**: Locks + data shape (Option B - no migrations) - ensured `/gigs/[id]` only shows active gigs for all users, moved `/gigs` getUser() check to top (early return before DB query), implemented relationship-bound sensitive field access for clients (created `lib/utils/talent-access.ts` helper), fixed TalentProfileClient critical leak (removed client-side access logic, changed prop type to safe public shape with `phone: string | null` (not optional), explicit phone presence check, tightened CTA logic with role-aware messaging), added RLS-aware phone fetching, updated locked copy text to match Option B policy, removed links to `/talent` directory and made `/gigs` back link conditional.
- ✅ **PR4 Complete**: Query strategy cleanup (no enumeration) - replaced "fetch all talent then find slug" pattern with bounded candidate queries (UUID path: `limit(1)`, name path: `limit(25)`), implemented ambiguity handling (duplicates return `notFound()`), preserved UUID backward compatibility, eliminated enumeration pattern completely (no `.order("created_at")` queries), no schema changes (Option B compliant).
- ✅ **PR5 Complete**: Marketing page conversion + copy cleanup - converted `/talent` directory page to pure marketing explainer (no DB queries, no listings), updated middleware and route constants to allow `/talent` as public marketing page, fixed remaining copy violations (removed "browse roster" language from choose-role and homepage), compliance score: 100% ✅.
- ✅ **PR1 Copy Migration Complete**: Tier A safe swaps - replaced modeling-specific language with generalized professional language in form labels, placeholders, and UI copy (10 replacements across 5 files: talent-professional-info-form.tsx, talent-profile-form.tsx, choose-role/page.tsx, client/dashboard/page.tsx, gigs/page.tsx), copy-only changes with no logic/database/routing modifications.
- ✅ **Marketing Images Update**: Replaced placeholder images (picsum.photos) with professional Unsplash images for example accounts on homepage - now using industry-appropriate professional portraits that look like actual people working in the industry.
- ✅ **About Page Contact Info Update**: Updated contact information on about page - changed address to "TOTL Agency, PO Box 13, Glassboro, NJ, 08028" and email to "contact@thetotlagency.com".

**Next (Future Enhancements)**
- [ ] Consider slug column migration (Option 4A from PR4 plan) if scale demands it
- [ ] Monitor query performance as talent count grows
- [ ] **PR2 Copy Migration**: Tier B product framing (homepage hero, onboarding narrative, dashboard empty states)
- [ ] **PR3 Copy Migration**: Tier C platform positioning (marketing pages, platform description)

## 🚑 **Latest Fix: Schema truth alignment (stop signup/bootstrap DB failures)**

**SCHEMA DRIFT HOTFIXES** - December 20, 2025  
- ✅ Fixed Postgres RLS hard failure `42P17` by dropping the recursive `profiles` policy (`Admins can view all profiles`) via migration.  
- ✅ Fixed local PostgREST `42703` (`profiles.avatar_path` missing) by adding `public.profiles.avatar_path` via migration and re-running local reset.  
- ✅ Added guardrail `npm run rls:guard` to prevent future self-referential `profiles` policies from landing in migrations.  
- ✅ Regenerated `types/database.ts` so repo types match live schema again (schema verify green).  
- ✅ Audit finish line (Diff 1): removed **all** `select('*')` usage under `app/` (public-ish + authed routes) using explicit, UI-driven selects (plus a tiny `lib/db/selects.ts` “B-lite” helper for gig/profile surfaces).  
- ✅ Audit finish line (Diff 2): removed **all** DB writes from `"use client"` files by moving profile upserts into Server Actions (`lib/actions/profile-actions.ts`) and using server-owned bootstrap (`ensureProfileExists()`) instead of client inserts.  
- ✅ Audit finish line (Diff 3): unified verification resend so **all** resend UI flows through `POST /api/email/send-verification` (no client-side `supabase.auth.resend()` split-brain).  
- ✅ Audit finish line (Diff 4 / Option 1): locked `client_applications` truth as **one row per email** (`UNIQUE(email)`), with `user_id` treated as optional linkage (not a uniqueness key). Updated submission flow to respect this (update-on-reapply vs duplicate insert).  
- ✅ Audit finish line (Diff 5): sealed regression gates — CI/pre-commit now blocks `select('*')` and Supabase mutations inside `"use client"` files (`npm run guard:select-star`, `npm run guard:client-writes`, included in `npm run verify-all`).  
- ✅ P0 hardening: added **DB-backed email send ledger** (`public.email_send_ledger`) and server-side claim gate so public “Resend verification” / “Password reset” is **one click → one send** across multi-instance/serverless.  
- ✅ DX hardening: made `npm run verify-all` the **CI-parity** local gate and added `npm run verify-fast` as the daily loop (guards + types + lint), reducing “passes locally, fails later” drift.  

**Next (P0)**
- [x] Apply pending migrations to the remote Supabase project via `npm run db:push`.  
- [x] Re-run `npm run schema:verify:comprehensive && npm run build && npm run lint` post-push to confirm no drift.  
- [ ] (Optional hardening) Add a second guard for `"use client"` files that call `.rpc(` if/when we want to forbid client-side RPC usage too.  

## 🚑 **Latest Fix: Auth redirect + Playwright reliability (Sprint A / Launch Safety)**

**AUTH + E2E STABILITY** - December 21, 2025
- ✅ Removed remaining “split brain” redirects:
  - `/choose-role` no longer hard-pushes authenticated users to `/talent/dashboard` (BootState remains the routing truth).
  - `AuthProvider.signIn()` no longer does its own profile fetch/hydration (SIGNED_IN handler owns hydration + BootState redirect).
- ✅ Stabilized Playwright `tests/auth/**` under `next start`:
  - Added stable UI hooks (e.g. `data-testid="choose-role-talent"` + dialog marker).
  - Hardened login helper convergence when auth cookie lands but client routing stalls (nudge via protected terminal path).
  - Reduced local worker default for Windows/OneDrive reliability: `playwright.config.ts` now defaults to **2 workers** (override via `PW_WORKERS`).
- ✅ Line-ending noise controlled:
  - `.gitattributes` enforces LF for repo text files but keeps `*.ps1/*.cmd/*.bat` as CRLF to avoid churn.
- ✅ Schema verify UX clarified (no “contradiction”):
  - `npm run schema:verify:comprehensive` now reports “link: none (OK)” and prints the drift target project (`--project-id`), so unlinked dev machines aren’t misled.
  - Added optional strict mode `npm run schema:verify:linked` (fails when no link is detected) for release prep/onboarded environments.
- ✅ Audit Operating System (docs-first, proof-driven):
  - Added `docs/AUDIT_MASTER_BOARD.md` (one-screen queue) + `docs/AUDIT_LOG.md` (append-only receipts) to prevent “wall-of-text” decay.
  - Hardened `docs/AUDIT_STATUS_REPORT.md` with a DONE/PARTIAL/UNKNOWN rubric, proof hooks, and drift decisions.
- ✅ Audit unblock PR (D3) shipped locally with proofs:
  - Locked Career Builder application behind auth (routing brain updated; signed-out users redirect to login with `returnUrl`).
  - Fixed `client_applications` RLS to remove **all** `auth.users` references (ownership by `user_id = auth.uid()`).
  - Fixed approval RPC failure (`42702 column reference "user_id" is ambiguous`) by using `ON CONFLICT ON CONSTRAINT client_profiles_user_id_key`.
  - Proofs now green:
    - P2: `tests/admin/career-builder-approval-pipeline.spec.ts` ✅
    - P1: `tests/integration/booking-accept.spec.ts` ✅

## 🚀 **Latest Achievement: Stripe Webhooks Contract VERIFIED (Ledger + Locks + Truthful ACK)**

**STRIPE WEBHOOKS VERIFIED** - December 20, 2025  
- ✅ Promoted `docs/contracts/STRIPE_WEBHOOKS_CONTRACT.md` to **✅ VERIFIED** (threat model, canonical rules, event matrix, proofs).  
- ✅ Added DB-backed webhook ledger `public.stripe_webhook_events` with **unique `event_id`** for provable idempotency.  
- ✅ Implemented **truthful ACK** (HTTP **500** on ledger/DB failures so Stripe retries).  
- ✅ Prevented concurrent duplicate processing: in-flight (`status='processing'`) duplicates short-circuit (no double side effects).  
- ✅ Added DB lock trigger to block user tampering of Stripe/subscription entitlement fields (service role only).  
- ✅ Added runbook `docs/STRIPE_WEBHOOKS_RUNBOOK.md` and unit tests covering signature, idempotency, in-flight duplicates, failure=500, out-of-order.  

## 🚀 **Latest Achievement: Email Notifications Contract VERIFIED (Governed + non-leaky + guarded)**

**EMAIL CONTRACT AUDIT-TO-VERIFIED** - December 20, 2025  
- ✅ Promoted `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md` to **✅ VERIFIED** with a canonical ledger (email type → trigger → posture → proof).  
- ✅ Enforced explicit auth posture for `/api/email/*`: public-callable (verification/password reset) vs internal-only (header-guarded).  
- ✅ Prevented account existence leaks on public email routes (uniform `{ success: true, requestId }` responses even for unknown emails / failures).  
- ✅ Added durable, DB-backed throttle + idempotency gate for public routes via `public.email_send_ledger` + `claimEmailSend()` (plus an optional best-effort pre-filter).  
- ✅ Added best-effort public abuse throttle (non-leaky) + internal-only 403 sentinel checks in Playwright.  
- ✅ Removed server→server internal HTTP hops for email sending (direct function calls only) and standardized URL building via `absoluteUrl()`.  

## 🚀 **Latest Achievement: Applications Contract VERIFIED (Atomic + Idempotent Acceptance via DB RPC)**

**APPLICATIONS ACCEPTANCE VERIFIED HARDENING** - December 20, 2025  
- ✅ Promoted `docs/contracts/APPLICATIONS_CONTRACT.md` to **✅ VERIFIED** with DB-truth clauses (atomicity + idempotency + RLS reality).  
- ✅ Acceptance is now DB-enforced via `public.accept_application_and_create_booking(...)` (SECURITY DEFINER) + `bookings(gig_id, talent_id)` uniqueness guard.  
- ✅ Hardened the acceptance primitive with `SET search_path = public, pg_temp` and a terminal-state guard (`rejected → accepted` forbidden) with deterministic error mapping (API returns HTTP 409).  
- ✅ Performance & correctness cleanup: removed `select('*')`, fixed N+1 profile fetches, and replaced fragile `.single()` calls with `.maybeSingle()` where rows may be absent (prevents 406 traps).  

## 🚀 **Latest Achievement: UI Terminal Kit + Mobile Overflow Guardrails (No Layout Drift)**

**UI LAYOUT CONTRACT + SENTINEL QA** - December 19, 2025  
- ✅ Introduced a canonical **Terminal Kit** (`PageShell`, `PageHeader`, `SectionCard`, `DataTableShell`, `PageLoading`, `EmptyState`) to stop layout drift across pages.  
- ✅ Adopted the kit on **Settings**, **Admin Dashboard**, and **Career Builder Applications** (admin list) with structural-only diffs (no business logic changes).  
- ✅ Locked mobile safety rules: **LongToken** for UUID/email/url, `min-w-0` for shrinkable flex rows, and `DataTableShell` for safe horizontal table scroll.  
- ✅ Added/expanded a Playwright **mobile overflow sentinel** so regressions are caught immediately (page must not scroll horizontally).  

## 🚀 **Latest Achievement: Profiles Contract VERIFIED (Routes + RLS truth + safe selects)**

**PROFILES CONTRACT AUDIT** - December 19, 2025  
- ✅ Audited and promoted `docs/contracts/PROFILES_CONTRACT.md` to **VERIFIED** (routes, canonical actions, table/column usage, and RLS reality grounded in migrations).  
- ✅ Removed `select('*')` from profile surfaces and replaced with explicit column lists (`/talent/profile`, `/client/profile`).  
- ✅ Hardened public talent profile payload to avoid shipping `phone` by default on `/talent/[slug]` (best-effort mitigation while RLS remains permissive).  
- ✅ Profiles Contract locked: verification pass complete (status block standardized, proof section tightened, and `docs/journeys/TALENT_JOURNEY.md` profile steps marked **PROVEN**).

## 🚀 **Latest Achievement: Logout Redirect Convergence (No “stuck until refresh”)**

**SIGN-OUT UX RELIABILITY (SETTINGS + NAVBAR)** - December 19, 2025  
- ✅ Fixed “Sign out looks stuck until refresh/click” by removing competing redirects during the auth-clearing window.  
- ✅ Enforced a single canonical destination for sign-out: `/login?signedOut=true` (prevents middleware bounce while cookies clear).  
- ✅ Made `SIGNED_OUT` handler a safety net only for non-user sign-outs (session expiry / cross-tab), while user-initiated `signOut()` is the single redirect owner.  

## 🚀 **Latest Achievement: Admin Paid Talent Metrics + First-Login Bootstrap Hardening**

**PAID MEMBERSHIP METRICS + BOOTSTRAP RELIABILITY** - December 18, 2025  
- ✅ Replaced admin dashboard “Revenue” placeholder with **Paid Talent (Subscriptions)** counts (monthly/annual/unknown) sourced from `public.profiles` only (no Stripe API calls).  
- ✅ Added clear **Estimated** MRR/ARR calculations (MRR: `$20/mo` + `$200/yr ÷ 12`; ARR: `$240/mo` + `$200/yr`).  
- ✅ Added stable `data-testid` hooks for the Paid Talent card to keep Playwright resilient.  
- ✅ Normalized Stripe webhook persistence: `profiles.subscription_plan` is now constrained to `'monthly' | 'annual' | null` (never price IDs; unknown plans surface as “Unknown”).  
- ✅ Fixed the “first login after signup → stuck until refresh” failure mode by adding a bounded retry (2 attempts) in `AuthProvider.ensureAndHydrateProfile()` and adding breadcrumbs for postmortem clarity.  
- ✅ Updated `/talent/dashboard` loading + “Finishing setup” gates to dark, readable styling (no more white-screen perception).

## 🚀 **Latest Achievement: Auth Bootstrap Contract Lockdown + Contract-Aligned Proof (No Drift)**

**AUTH BOOTSTRAP + ONBOARDING “BORING & ENFORCEABLE” CONTRACT** - December 18, 2025  
- ✅ Locked the canonical contract: `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` (routes truth + email verified sync + RLS truth tables)  
- ✅ Added the **Role Promotion Boundary** (no user-controlled writes to `profiles.role` / `profiles.account_type`; promotion happens only via admin approval pipeline)  
- ✅ Created a proof ledger + drift tracker:  
  - `docs/tests/AUTH_BOOTSTRAP_TEST_MATRIX.md` (matrix of scenarios → DB assertions → Playwright coverage)  
  - `docs/DRIFT_REPORT.md` (mismatches tracked until resolved)  
- ✅ Closed the last proof gap with Playwright coverage:  
  - Career Builder approval pipeline E2E: `tests/admin/career-builder-approval-pipeline.spec.ts`  
  - Guardrail: generic role update must reject `client`: updated `tests/admin/admin-functionality.spec.ts`  
  - Missing profile repair: `tests/auth/missing-profile-repair.spec.ts` (delete `public.profiles` → re-login → `ensureProfileExists()` repairs → no loop)  
- ✅ Added dev-only helper endpoint for contract proofs (blocked in production): `app/api/dev/profile-bootstrap/route.ts`  
- ✅ Documentation system refactor shipped (3-layer “laws → contracts → journeys” with minimal redundancy), plus stubs + archive migration for legacy docs  
- ✅ Login page redesigned to match dashboard visual language (“quiet airlock” / Soft Entry v2) with stable Playwright selectors

## 🚀 **Latest Achievement: Schema Drift Fix + Security Advisor Cleanup + Admin Routing Debug**

**SCHEMA / SECURITY / ROUTING STABILIZATION** - December 17, 2025  
- ✅ Eliminated Supabase Security Advisor finding by removing the unused `public.query_stats` view (tracked via migration `supabase/migrations/20251217200615_drop_query_stats_view.sql`)  
- ✅ Reconciled “docs/types/schema truth” after SQL Editor changes: regenerated `types/database.ts` from the remote schema and updated `database_schema_audit.md` + `docs/DATABASE_REPORT.md` accordingly  
- ✅ Documented the “Studio/SQL Editor → immediate `supabase db pull schema_sync_dec17`” guardrail in `docs/SCHEMA_SYNC_FIX_GUIDE.md` and `docs/PRE_PUSH_CHECKLIST.md` to prevent future drift  
- ✅ Added safe, env-guarded routing diagnostics (`DEBUG_ROUTING=1`) to middleware to log `user.id`, resolved profile role/account_type, and redirect decisions  
- ✅ Fixed “admin → talent terminal” downgrades by removing the hardcoded login redirect to `/talent/dashboard` and adding an admin safety redirect to `/admin/dashboard` for non-admin terminals

## 🚀 **Latest Achievement: Talent Dashboard Data Hook + Phase 5 Sign-Out**

**TALENT DASHBOARD DATA HOOK & AUTH PROVIDER ALIGNMENT** - January 2025  
- ✅ Server page is now a thin shell that renders `DashboardClient` with `dynamic = "force-dynamic"`  
- ✅ New `useTalentDashboardData` hook owns data/loading/errors/refetch with cancellable effect (no timers) and minimal talent_profile bootstrap  
- ✅ Verification grace handling preserved with URL cleanup + redirect guard; finishing-setup retry calls `ensureProfileExists()` then refetches  
- ✅ Middleware now allows `/talent/dashboard` through when profile is missing so AuthProvider can hydrate/create safely  
- ✅ AuthProvider sign-out simplified to Phase 5 flow: reset state → optional `/api/auth/signout` → `supabase.auth.signOut()` → `resetSupabaseBrowserClient()` → `window.location.replace("/login?signedOut=true")`  
- ✅ Admin header sign-out now uses loading state instead of DOM hacks; client apply flow prevents duplicate submissions and requires authenticated user  
- ✅ Docs updated: added `TALENT_DASHBOARD_DATA_HOOK_GUIDE.md`, refreshed `SIGN_OUT_IMPROVEMENTS.md`, and indexed the new guide

## 🚀 **Previous Achievement: Talent Dashboard Profile Flow Hardening**

**TALENT DASHBOARD PROFILE CREATION/LOAD HARDENING** - January 2025  
- ✅ Replaced full-page reloads with typed, in-memory profile hydration to avoid redirect loops after signup  
- ✅ Added one-time fallback guards plus auto-reset on auth load to prevent repeated `ensureProfileExists` calls or stuck states  
- ✅ Ensured auth-loading skips refetch safely retry once auth completes (no dangling timeouts)  
- ✅ Resolved talent-role detection to trust database profile over metadata, preventing wrong role-based creations  
- ✅ Cleanly handles missing profile payloads by refetching directly and resetting guards for future retries  
- ✅ Prevents stale timeouts and stuck loading when auth state flips mid-fetch  
- ✅ All changes linted and reviewed against type safety and common error guidelines  
- ✅ Dashboard now stabilizes after signup without infinite reloads or premature redirects

## 🚀 **Previous Achievement: Email Verification Race Condition Fixes**

**EMAIL VERIFICATION FLOW RACE CONDITION FIXES** - January 2025  
- ✅ Fixed critical race condition where grace period flag was incorrectly reset when searchParams changed before timeout completed  
- ✅ Fixed premature redirect issue where Effect B could redirect users before router.refresh() completed after email verification  
- ✅ Improved grace period cleanup logic to only reset when verified parameter is actually removed from URL, not just when timeout is cleared  
- ✅ Fixed stale closure issue in Effect A cleanup by reading current URL directly from window.location instead of captured searchParams  
- ✅ Enhanced URL cleanup to use relative paths instead of full URLs for proper Next.js navigation semantics  
- ✅ Fixed Next.js redirect() error handling in auth callback to properly re-throw redirect errors instead of catching them  
- ✅ Removed unused CheckCircle2 import from auth callback page  
- ✅ All fixes verified with comprehensive code review and follow project type safety and error handling patterns  
- ✅ Email verification flow now handles all edge cases correctly without premature redirects or stuck grace periods

## 🚀 **Previous Achievement: Dashboard Loading Race Condition Fixes & Performance Roadmap**

**DASHBOARD LOADING & AUTH FLOW IMPROVEMENTS** - January 2025  
- ✅ Fixed timeout ID race condition where old fetch operations cleared timeouts belonging to new fetches  
- ✅ Fixed loading state race condition where completed fetches reset loading state while new fetches were still running  
- ✅ Added timeout protection for manual retry button clicks to prevent indefinite loading states  
- ✅ Fixed auth-provider handling of `exists: true` but `profile: null` case with retry logic instead of setting profile to null  
- ✅ Improved profile existence checks in auth-provider to handle brand new accounts gracefully  
- ✅ Added comprehensive Performance & UX Optimization Roadmap (Priority 3) to MVP status  
- ✅ All fixes verified with code review and follow project type safety and error handling patterns  
- ✅ Dashboard now handles concurrent fetches correctly without UI flickering or premature state resets

## 🚀 **Previous Achievement: Middleware Security Hardening & Access Control Fixes**

**MIDDLEWARE SECURITY & ACCESS CONTROL IMPROVEMENTS** - December 9, 2025  
- ✅ Fixed critical security vulnerability where users with `account_type === "unassigned"` and `role === null` could access protected routes  
- ✅ Added security redirects to login when users lack proper access but are already on destination path (prevents unauthorized access)  
- ✅ Enhanced access control checks with `hasTalentAccess()` and `hasClientAccess()` helper functions for consistent security  
- ✅ Fixed infinite redirect loop prevention to properly deny access instead of allowing unauthorized users to stay on protected pages  
- ✅ Improved `determineDestination()` function to check both `account_type` and `role` for consistent routing  
- ✅ Added symmetric handling for talent and client roles in onboarding redirect logic  
- ✅ Fixed double-encoding of `returnUrl` parameter in middleware redirects  
- ✅ Enhanced profile null handling to redirect authenticated users without profiles to login  
- ✅ All security fixes verified with comprehensive code review and build verification  
- ✅ Middleware now properly enforces access control while preventing infinite redirect loops

## 🚀 **Previous Achievement: Login Page Black & White Gradient Styling**

**LOGIN PAGE VISUAL CONSISTENCY UPDATE** - January 2025  
- ✅ Updated login page background from `bg-black` to `bg-seamless-primary` to match landing page aesthetic  
- ✅ Added white gradient overlays (`from-white/3 via-white/8 to-white/3`) matching landing page design  
- ✅ Added floating white orbs/blurs with `animate-apple-float` animation for depth and visual consistency  
- ✅ Replaced `bg-gray-900` card with `apple-glass` class for glassmorphism effect matching landing page  
- ✅ Updated divider styling to use `border-white/10` and `apple-glass` background for consistency  
- ✅ Ensured all colors are pure black/white/gray without blue undertones  
- ✅ Maintained responsive design across mobile, tablet, and desktop breakpoints  
- ✅ All changes follow design system patterns using existing CSS classes from `globals.css`  
- ✅ Verified build and lint pass successfully with no errors  
- ✅ Login page now matches landing page's premium black and white gradient aesthetic

## 🚀 **Previous Achievement: Sign-Out & Login Redirect Improvements**

**SIGN-OUT & LOGIN REDIRECT IMPROVEMENTS** - January 2025  
- ✅ Added fallback redirect with timeout cleanup for robust sign-out handling  
- ✅ Standardized sign-out behavior across all components (talent dashboard, settings, client dashboard)  
- ✅ Fixed `isSigningOut` state management to prevent permanently disabled sign-out buttons  
- ✅ Ensured fallback redirect always occurs unless already on auth route (prevents users getting stuck)  
- ✅ Fixed login redirect to handle account_type vs role inconsistencies  
- ✅ Added sync logic to ensure data consistency between role and account_type fields  
- ✅ Fixed bug where transient sync failures incorrectly redirected users with existing roles to onboarding  
- ✅ Improved onboarding redirect logic to only trigger for genuinely new users (role is null)  
- ✅ Users with existing roles now use effectiveAccountType for redirects even if sync fails  
- ✅ Updated email verification pending page to match dark theme for consistent UX  
- ✅ Removed unused Card import from verification-pending page  
- ✅ All changes follow type safety guidelines using generated types from `@/types/supabase`  
- ✅ Verified build and lint pass successfully

## 🚀 **Previous Achievement: Talent Dashboard Loading Fix & Settings Enhancements**

**TALENT DASHBOARD LOADING FIX & SETTINGS IMPROVEMENTS** - January 2025  
- ✅ Fixed infinite loading spinner when returning from Settings to Dashboard for new talent accounts  
- ✅ Improved dashboard data fetching to handle missing talent_profiles gracefully using `.maybeSingle()`  
- ✅ Added defensive loading state cleanup to prevent stuck spinners  
- ✅ Optimized sign-out flow for faster redirect (removed 500ms delay)  
- ✅ Added sign-out button to Settings Account section with loading state  
- ✅ Created Subscription Management section in Settings showing status and links to subscribe/manage billing  
- ✅ Created Career Builder Application section in Settings allowing talent users to apply and view application status  
- ✅ Updated choose-role page to use "Join as Career Builder" terminology consistently  
- ✅ Settings now displays subscription status and Career Builder application options for talent users  
- ✅ All changes follow type safety guidelines using generated types from `@/types/supabase`  
- ✅ Verified build and lint pass successfully

## 🚀 **Previous Achievement: Next.js Security Update & Career Builder Approval Process**

**NEXT.JS SECURITY PATCH (CVE-2025-66478)** - January 2025  
- ✅ Updated Next.js from 15.5.4 to 15.5.7 to fix critical security vulnerability (CVE-2025-66478)  
- ✅ Verified build and lint pass after update  
- ✅ No breaking changes detected  
- ✅ Application now secure against server-side code execution vulnerability

**CAREER BUILDER APPROVAL WORKFLOW ENFORCEMENT** - January 2025  
- ✅ Fixed `/client/signup` to redirect to `/client/apply` instead of allowing direct signup (enforces approval process)  
- ✅ Added helpful redirect page explaining Career Builder requires approval through application process  
- ✅ Improved choose-role page dialog messaging with clearer explanation of approval workflow  
- ✅ Added conditional "Apply as Career Builder" button for logged-in users in choose-role dialog  
- ✅ Updated documentation (`docs/AUTH_STRATEGY.md` legacy stub -> archived strategy) with complete Career Builder application flow  
- ✅ Created comprehensive analysis document (`docs/CAREER_BUILDER_LOGIN_SIGNUP_ANALYSIS.md`)  
- ✅ Created implementation plan document (`docs/CAREER_BUILDER_SIGNUP_FIX_PLAN.md`)  
- ✅ Fixed import order warnings in `app/choose-role/page.tsx` and `app/client/signup/page.tsx`  
- ✅ Added `lint:build` npm script for running lint then build sequentially  
- ✅ Created Next.js update guide (`docs/NEXTJS_UPDATE_EXPLAINED.md`) for future reference
- ✅ Updated Sentry project configuration to `totlmodelagency` and added auth token locally  
- ✅ Fixed sign-out redirect loop by honoring `signedOut=true` on `/login` and improving cookie clear timing
- ✅ Prevented unauthenticated redirect to `/talent/dashboard` by allowing `/login` stay and adding signed-out CTA on talent dashboard

## 🚀 **Previous Achievement: Email Verification UX & Career Builder Flow Fixes**

**EMAIL VERIFICATION & APPLICATION FLOW IMPROVEMENTS** - December 2025  
- ✅ Added email verification confirmation page that displays after users click verification link in email  
- ✅ Shows clear success message with green checkmark and "Email Verified Successfully!" before redirecting to dashboard  
- ✅ Fixed email verification status sync - always syncs from `auth.users.email_confirmed_at` to `profiles.email_verified` in callback  
- ✅ Admin dashboard now automatically syncs email verification status from auth.users on page load, ensuring accurate status display  
- ✅ Fixed Career Builder application flow - success page (`/client/apply/success`) is now public and accessible without authentication  
- ✅ Added `/client/application-status` to public routes so applicants can check status without logging in  
- ✅ Updated middleware to exclude success and status pages from client access requirements  
- ✅ Fixed auth provider public routes list to include all client application pages  
- ✅ Users can now complete Career Builder application and see success confirmation without being redirected to talent dashboard

## 🚀 **Previous Achievement: Sign-Out Reliability & Public Route Protection**

**SIGN-OUT SECURITY & SESSION MANAGEMENT** - December 4, 2025  
- ✅ Enhanced sign-out function with comprehensive cookie clearing (up to 20 chunks) and server-side API route for complete session termination  
- ✅ Fixed sign-out flow to call server-side API FIRST before client-side operations, ensuring cookies are cleared before redirect  
- ✅ Enhanced server-side cookie clearing to use both `cookieStore.delete()` AND `response.cookies.set()` with expired dates for guaranteed cookie removal  
- ✅ Increased redirect delay from 150ms to 500ms to ensure all async operations and cookie clearing complete before redirect  
- ✅ Changed redirect from `window.location.href` to `window.location.replace()` to prevent back button from returning to authenticated state  
- ✅ Removed cache-busting query parameters from redirect URLs to fix 404 errors and routing issues  
- ✅ Created `resetSupabaseBrowserClient()` function to reset browser client singleton on sign-out  
- ✅ Fixed `SIGNED_OUT` event handler to redirect users from protected routes when sessions expire naturally or are cleared externally  
- ✅ Added prefix matching for dynamic public routes (`/talent/[slug]`, `/gigs/[id]`) so users aren't incorrectly redirected from public pages  
- ✅ Fixed pathname checks to properly strip query parameters when determining if user is on auth/public routes  
- ✅ Fixed error handler in sign-out to also reset browser client singleton, ensuring clean state even on failures  
- ✅ Fixed all import order linting warnings across admin and API route files  
- ✅ Created `AGENT_ONBOARDING.md` comprehensive quick-start guide for new AI agents with all critical information consolidated

## 🚀 **Previous Achievement: Security & UX Improvements**

**LOGOUT SECURITY & CLIENT VISIBILITY MESSAGING** - December 1, 2025  
- ✅ Fixed logout cookie cleanup to clear all Supabase token chunks (.0 through .9) for complete session termination  
- ✅ Added comprehensive client talent visibility documentation explaining application-driven access model  
- ✅ Fixed client approval rollback to preserve original admin_notes instead of nullifying them  
- ✅ Updated about page grid layout to properly accommodate 4 mission cards (responsive 2x2 on md, 1x4 on lg)  
- ✅ Added client visibility messaging to dashboard and about page to clarify privacy-first approach  
- ✅ Enhanced logout security by clearing all cookie chunks including sb-access-token, sb-refresh-token, and sb-user-token variants

## 🚀 **Latest Achievement: Moderation & Suspension Enforcement**

**MODERATION TOOLKIT & ACCOUNT SAFEGUARDS** - November 26, 2025  
- ✅ Created first-class moderation workflow (flag dialogs on gigs & talent profiles, dedicated `/admin/moderation` dashboard, automation controls)  
- ✅ Added `content_flags` table plus suspension columns on `profiles` so admins can suspend or reinstate accounts with documented reasons  
- ✅ Wired admin actions to close abusive gigs, suspend accounts, and reflect enforcement instantly through middleware + `/suspended` page UX  
- ✅ Regenerated Supabase types and middleware guards so `is_suspended`/`suspension_reason` stay type-safe across server actions and route protection  
- ✅ Updated schema docs + common-errors guide so future migrations stay in sync and TypeScript never drifts from the live schema

## 🚀 **Latest Achievement: Client Application Email Automations**

**CLIENT APPLICATION FOLLOW-UP AUTOMATION** - November 26, 2025  
- ✅ Added Resend templates + server action to automatically email applicants when their client application has been pending for 3+ days  
- ✅ Sends paired admin reminders so operations can stay inside the 2–3 business day SLA  
- ✅ New `follow_up_sent_at` column keeps the workflow idempotent and exposed in the admin dashboard (badges + CSV export)  
- ✅ “Send follow-ups” button and toast telemetry added to `/admin/client-applications` for manual or cron-triggered runs  
- ✅ Documentation refreshed (`email-service.md`, `EMAIL_NOTIFICATION_SYSTEM_IMPLEMENTATION.md`) so the automation is fully discoverable
- 🔧 **Nov 26 Hotfix:** Follow-up job now locks the admin reminder (and `follow_up_sent_at`) even if the applicant email transiently fails, preventing duplicate SLA nudges
- 🔧 **Nov 26 UI/UX Tune-Up:** Admin dashboard only shows the “Follow-up emails sent” toast when every reminder succeeds, while partial failures now surface a single descriptive warning

## 🚀 **Latest Achievement: Client Application Admin Dashboard**

**CLIENT APPLICATION ADMIN OPS** - November 27, 2025  
- ✅ Shipped `/admin/client-applications` with auth-protected server loader plus rich UI (search, tabbed filters, status badges, detail dialog)  
- ✅ Added approve/reject workflows with admin notes, instant UI updates, and Resend-powered applicant notifications  
- ✅ Wired bulk “Send follow-ups” control to the automated reminder action so ops can nudge aging applications inline  
- ✅ Delivered CSV export tooling (matching locale date formats) so ops can audit applications outside the app  
- ✅ Surfaced follow-up badges/timestamps across the dashboard so admins know which Career Builders have already been pinged  

## 🚀 **Latest Achievement: Client Account Promotion & Consistency**

**CLIENT ONBOARDING LOCKED** - November 30, 2025  
- ✅ Added “Apply to be a Client” to the navbar + account dropdown so the CTA stays reachable even when talent users are on their dashboard  
- ✅ Client application form now pre-populates first/last name + email from the logged-in Supabase session and keeps status messaging tied to the authenticated user  
- ✅ Settings “Back to Dashboard” links prefetch `/talent/dashboard` (and other dashboards) so navigating off slow server-rendered pages feels instant  
- ✅ Admin approval now updates the applicant’s `profiles.role`/`account_type` to `client`, so middleware/redirects immediately send approved clients to `/client/dashboard` without requiring a manual role change  
- ✅ Autopromote keeps login redirects, middleware guards, and RLS in sync so the career-builder journey no longer shows stale talent-only surfaces after approval
- ✅ Added `/onboarding/select-account-type` + server action that keeps unassigned logins guarded while letting logged-in users choose Talent vs. Client; “Client” redirects to `/client/apply` with the talent profile still intact so applications stay tied to the authenticated user  
- ✅ Hardened `lib/actions/client-actions.ts` to use the service-role admin client, paginate `auth.admin.listUsers`, and fail the approval if we can't promote a profile, ensuring the applicant is routed to `/client/dashboard` only when `profiles.account_type`/`role` are actually set to `client`  
- ✅ Documented the unified signup → role-selection flow (`docs/CLIENT_ACCOUNT_FLOW_PRD.md`), expanded middleware/auth/redirection guardrails, and confirmed `npm run lint` + `npm run build` pass against the new behavior  

## 🚀 **Latest Achievement: Client Dashboard Palette & Subscription Gate**

**CLIENT DASHBOARD POLISH** - December 2, 2025  
- ✅ Matched the client dashboard background, cards, tabs, and action buttons with the dark, high-contrast palette used on the talent dashboard so both roles share the same premium visual language  
- ✅ Refreshed the login gate, error/loading contrast, and increments in `app/client/dashboard/page.tsx` plus the post-gig entry button so the light-mode surfaces keep the same feel everywhere  
- ✅ Verified subscription gating on gigs and subscription redirect handling remain covered by Playwright specs and that the sign-in CTA still includes the `returnUrl` parameter hence the test reflects the real `href`

## 🚀 **Latest Achievement: Logout & Session Reset Flow**

**COOKIE RESET HARDENING** - December 3, 2025  
- ✅ Added comprehensive cookie clearing to `components/auth/auth-provider.tsx`, deleting Supabase auth-token chunks plus every `sb-access-token`, `sb-refresh-token`, and `sb-user-token` variant before redirecting to `/login`  
- ✅ Prevents stale session cookies from looping clients back to `/client/dashboard` after sign-out, so the next login starts from a clean slate without needing a manual refresh  
- ✅ Confirmed by watching the logout network request expire the HttpOnly tokens and verifying the login gate lands on the actual form instead of instantly redirecting

## 🚀 **Latest Achievement: Supabase Types Guardrail Alignment**

**TYPES & SCHEMA TRUTH LOCKDOWN** - November 27, 2025  
- ✅ Updated every `types:regen*` script to call `npx supabase@2.34.3 gen types ... --project-id utvircuwknqzpnmvxidp --schema public`, removing the stale `--linked` behavior that caused header-only diffs  
- ✅ Baked the same default project into `scripts/verify-schema-local.mjs`, `scripts/quick-schema-check.mjs`, and the comprehensive schema guardrail so even unlinked environments compare against the correct ref  
- ✅ Hardened the verification script to strip the AUTO-GENERATED banner before diffing, eliminating the recurring “-6 lines removed” warnings  
- ✅ Refreshed every doc that teaches type regeneration (`TYPES_SYNC_PREVENTION_SYSTEM.md`, `SCHEMA_SYNC_FIX_GUIDE.md`, `TECH_STACK_BREAKDOWN.md`, `TROUBLESHOOTING_GUIDE.md`) so future contributors run the exact command  
- ✅ Ran `npm run types:regen`, `npm run schema:verify:comprehensive`, `npm run lint`, and `npm run build` to prove the guardrail is green before the next feature push  

## 🚀 **Previous Achievement: Client Application Status Portal**

**CLIENT APPLICATION STATUS PORTAL** - November 26, 2025
- ✅ Shipped public-facing `/client/application-status` with secure lookup (requires both application ID + email) powered by a new admin-server action
- ✅ Added rich status UI: badges, timelines, admin notes, and company/talent-need context so Career Builders know exactly where they stand
- ✅ Enhanced the client application confirmation flow to surface the generated application ID on the success page and deep-link into the status checker
- ✅ Wired the checker through the new `checkClientApplicationStatus` service-role action so RLS remains locked down while applicants can self-serve
- ✅ Pre-filled status checks via query params (confirmation page passes `applicationId`) to reduce support friction

## 🚀 **Previous Achievement: Stripe Live Launch Prep & MCP Hardening**

**STRIPE LIVE-READY UPGRADE** - November 26, 2025
- ✅ Bumped the entire toolchain to Supabase CLI **v2.34.3** (package scripts, verification utilities, docs) so local + CI stay in lockstep
- ✅ Regenerated schema types, re-linked CLI to `utvircuwknqzpnmvxidp`, and re-ran schema/lint/build checks to keep `develop` green
- ✅ Captured the production migration game plan in `docs/STRIPE_LIVE_SUBSCRIPTIONS_PRD.md` plus refreshed the docs index
- ✅ Locked in the live Stripe price IDs (`price_1SXZFiL74RJvr6jHynEWFxaT` monthly, `price_1SXZFiL74RJvr6jH26OFzsvl` yearly) across env references + documentation so ops knows the exact values to deploy
- ✅ Configured the live Stripe webhook destination at `https://www.thetotlagency.com/api/stripe/webhook` and documented the signing-secret rollout
- ✅ Verified Sentry MCP connectivity in Cursor (added server block + token handling) so we can query real-time errors while rolling out billing

## 🚀 **Previous Achievement: Supabase Encoding + Single-Project Guardrails**

**SCHEMA & ENCODING HARDENING** - November 24, 2025 (PM)
- ✅ Fixed `.env.local` encoding (UTF-8 w/out BOM) so Supabase CLI no longer throws `unexpected character '»'`
- ✅ Updated `types:regen*` scripts to always run through `cmd /d /c` with `SUPABASE_INTERNAL_NO_DOTENV=1` for consistent UTF-8 output
- ✅ Re-linked the Supabase CLI to the production project (`utvircuwknqzpnmvxidp`) using the correct `--project-ref` flag; both `develop` and `main` target the same project now
- ✅ Added the AUTO-GENERATED banner back to `types/database.ts` and verified schema truth guardrail passes locally
- ✅ Standardized banner injection (local scripts + CI workflow) so schema-truth diffs stay clean when comparing production types
- ✅ Documented the single-project reality + encoding pitfall in `TOTL_PROJECT_CONTEXT_PROMPT.md` and `docs/COMMON_ERRORS_QUICK_REFERENCE.md` so future sessions don’t regress

## 🚀 **Previous Achievement: Talent Subscription Experience Upgrade!**

**TALENT SUBSCRIPTION UX + ENFORCEMENT** - November 24, 2025
- ✅ Added a dedicated “Subscription” entry (with live status pill) in the talent navigation so the upgrade path is always visible
- ✅ Banner + inline prompts now show on the dashboard, gigs list, gig details, and apply flows whenever a talent account is not active
- ✅ Gig cards/titles/descriptions now obfuscate client intel for free users while active subscribers still see full data
- ✅ Apply/Client-detail sections enforce gating with branded CTAs that jump straight to `/talent/subscribe`
- ✅ Auth context now keeps subscription status/plan/current period end in memory so the UI can react instantly post-webhook
- ✅ Added `tests/integration/subscription-flow.spec.ts` to verify banners, gig gating, and apply blocking for unsubscribed talent
- ✅ Post-release hardening: talent-only banners/prompts, accurate `past_due` badges, and safer gig gating defaults

## 🚀 **Previous Achievement: Production Schema Guardrails!**

**PRODUCTION SCHEMA GUARDRAILS** - November 23, 2025
- ✅ Locked `types:regen:prod` + `link:prod` behind `SUPABASE_PROJECT_ID` (no more accidental dev regen when preparing `main`)
- ✅ Added explicit Supabase CLI instructions (`SUPABASE_INTERNAL_NO_DOTENV=1`, prod `db push`) to the context prompt + common errors guide
- ✅ Expanded the Types Sync Prevention doc with the exact commands + env vars to use before merging to production
- ✅ Captured this workflow in the MVP status doc so future releases know the “set env → push migrations → regen prod types” ritual

## 🚀 **Previous Achievement: UI/UX Playwright Stability Fix!**

**UI/UX PLAYWRIGHT TEST STABILITY** - November 23, 2025
- ✅ Replaced deprecated `page.emulate` usage with a typed Playwright mobile context
- ✅ Ensures hover disablement test correctly simulates touch hardware without TS errors
- ✅ Keeps reduced-hover media query validation intact across browsers
- ✅ `npm run build` + full Playwright suite now pass without blocking type issues
- ✅ Documentation + status audit updated to reflect the stabilization work

## 🚀 **Previous Achievement: Stripe Stability & Subscription Hardening!**

**STRIPE STABILITY & ERROR-HANDLING HARDENING** - November 23, 2025
- ✅ Enforced env validation for both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
- ✅ Standardized Stripe API versioning (uses official `2024-06-20` release string and documents the rule)
- ✅ Webhook now reads `current_period_end` from subscription items (forward-compatible with latest API)
- ✅ Billing portal session checks mirror checkout safeguards (no redirect to `undefined`)
- ✅ Subscribe & billing pages no longer ignore Supabase errors; follow `.maybeSingle()` best practice
- ✅ Subscription prompts now have accurate messaging even if helpers are reused
- ✅ Added `docs/STRIPE_TROUBLESHOOTING.md` plus new entries in `COMMON_ERRORS_QUICK_REFERENCE.md`
- ✅ Full `npm run build` regression passing after every fix

## 🎯 **Complete Stripe Subscription System Implementation!**

**STRIPE SUBSCRIPTION SYSTEM** - November 22, 2025
- ✅ **Complete Stripe Integration**: Checkout, Billing Portal, Webhooks
- ✅ **Subscription Plans**: Monthly ($20) & Annual ($200) for talent users
- ✅ **Access Control**: Obfuscated gig details for non-subscribers, application blocking
- ✅ **Database Schema**: Added subscription_status enum & fields to profiles table
- ✅ **Webhook Handler**: Automatic subscription status updates (active/past_due/canceled)
- ✅ **Frontend Pages**: Subscription selection, billing management, success/cancel pages
- ✅ **Type Safety**: Full TypeScript integration with generated database types
- ✅ **Build Passing**: All TypeScript errors resolved, import order fixed
- ✅ **Documentation**: Complete PRD, implementation plan, and integration guide
- ✅ **Production Ready**: Tested build, committed to develop branch

**PREVIOUS: TypeScript Error Fixes & maybeSingle() Pattern Refinement!**

**TYPESCRIPT & ERROR HANDLING IMPROVEMENTS** - January 2025
- ✅ Fixed TypeScript type mismatch errors (`undefined` vs `null`) in talent profile lookup
- ✅ Fixed syntax error in `auth-actions.ts` (incomplete PGRST116 check with `.maybeSingle()`)
- ✅ Corrected error handling pattern - removed PGRST116 checks when using `.maybeSingle()`
- ✅ Updated all profile queries to use proper error handling pattern (handle errors first, then check `!data`)
- ✅ Enhanced `COMMON_ERRORS_QUICK_REFERENCE.md` with new error patterns (14 sections now)
- ✅ Created `docs/archive/SCHEMA_TYPES_VERIFICATION.md` (historical) to ensure schema/types alignment
- ✅ All builds passing successfully with zero TypeScript errors
- ✅ Comprehensive documentation updates for error prevention patterns

**PREVIOUS: Sentry Error Tracking Enhanced & 406 Errors Fixed!**

**SENTRY ERROR TRACKING ENHANCEMENT** - January 2025
- ✅ Fixed 406 Not Acceptable errors by replacing `.single()` with `.maybeSingle()` in all profile queries
- ✅ Added comprehensive Sentry error tracking to auth flow (profile queries, redirect loops, role determination)
- ✅ Created diagnostic endpoint (`/api/sentry-diagnostic`) to verify Sentry configuration
- ✅ Enhanced test endpoint with event IDs and immediate error flushing
- ✅ Added project ID verification in console logs to catch DSN mismatches
- ✅ Fixed client-side profile queries in auth-provider to prevent 406 errors
- ✅ All auth errors now properly tracked in Sentry with full context

**PREVIOUS: Migrated Sentry to Next.js 15.3+ Instrumentation & Fixed Login Redirect Loop!**

**SENTRY MIGRATION TO INSTRUMENTATION-CLIENT** - January 2025
- ✅ Migrated Sentry client config from deprecated `sentry.client.config.ts` to `instrumentation-client.ts` (Next.js 15.3+ convention)
- ✅ Removed deprecated `sentry.client.config.ts` file
- ✅ Updated all documentation to reflect new instrumentation-client.ts approach
- ✅ Enhanced error filtering with hydration and network error detection
- ✅ Fixed Sentry connection - now properly using Next.js 15.3+ instrumentation-client convention
- ✅ All Sentry configs now follow Next.js best practices per official documentation

**PREVIOUS: Fixed Login Redirect Loop for Talent Accounts!**

**LOGIN REDIRECT LOOP FIX** - January 2025
- ✅ Fixed redirect loop where talent accounts were stuck on `/choose-role` page
- ✅ Enhanced `ensureProfileExists()` to detect and set missing roles from user metadata or role-specific profiles
- ✅ Updated `handleLoginRedirect()` with multiple fallbacks to determine role (metadata → talent_profiles → client_profiles)
- ✅ Added database consistency delays after role updates to prevent cache issues
- ✅ Updated middleware to also try to determine role before redirecting to `/choose-role`
- ✅ Added re-fetch of profile when on `/choose-role` to get latest role data
- ✅ All redirects now properly wait for role updates to complete before redirecting

**PREVIOUS: Sentry Connection Fixed & Logout Improvements!**

**SENTRY FIXES & LOGOUT IMPROVEMENTS** - January 2025
- ✅ Created missing `sentry.client.config.ts` file - client-side errors now being captured
- ✅ Added missing `onRouterTransitionStart` export to `instrumentation-client.ts` for router instrumentation
- ✅ Fixed Sentry connection - errors from develop branch now properly sent to `sentry-yellow-notebook` project
- ✅ Improved logout function to properly clear all session data (cookies, localStorage, sessionStorage)
- ✅ Changed logout redirect to use hard redirect (`window.location.href`) to bypass Next.js cache
- ✅ All Sentry configs now properly initialized and connected

**PREVIOUS: Auth Flow Fixed - Profile Creation & Login Redirect!**

**AUTH FLOW FIXES** - January 2025
- ✅ Created ensureProfilesAfterSignup() server action to guarantee profiles are created after signup (backup to database trigger)
- ✅ Updated talent signup form to ensure profiles are created immediately after signup
- ✅ Fixed login redirect to properly clear cache and use fresh session data
- ✅ Updated auth provider to avoid redirect conflicts with server-side redirects
- ✅ Fixed admin API to handle existing users gracefully
- ✅ Added comprehensive Playwright test for user creation and authentication flow
- ✅ Resolved caching issues that required incognito mode - login now works in normal browser
- ✅ All changes follow TypeScript and linting rules

**PREVIOUS: All Linting Warnings Fixed!**

**LINTING CLEANUP** - December 2025
- ✅ Fixed all unused imports and variables across 15+ files
- ✅ Fixed all unescaped quotes in JSX (privacy, terms, ui-showcase pages)
- ✅ Fixed import order issues (auth-actions.ts)
- ✅ Build now passes with zero linting warnings
- ✅ All code follows project linting standards

**PREVIOUS: Sentry Integration Fixed & MCP Documentation Complete!**

**SENTRY BUILD FIX & MCP DOCUMENTATION** - November 16, 2025
- ✅ Fixed Sentry build errors (SupabaseIntegration requires client instance at init)
- ✅ Disabled SupabaseIntegration in Sentry configs (can be re-enabled with proper client setup)
- ✅ Fixed ESLint no-case-declarations error in test-sentry route
- ✅ Created comprehensive MCP Playwright troubleshooting documentation
- ✅ Documented Playwright MCP connection issues and --no-install flag solution
- ✅ Updated all troubleshooting guides with MCP resolution steps
- ✅ Added MCP errors to common errors quick reference

**PREVIOUS: TypeScript Build Errors Completely Resolved!**

**PRODUCTION BUILD FIX - ZERO TYPESCRIPT ERRORS** - November 2, 2025
- ✅ Fixed 25+ TypeScript errors across 21 files
- ✅ Production build now passes with 0 type errors (`npm run build` succeeds!)
- ✅ Aligned all field names with database schema
  - `bio` → `experience` (onboarding)
  - `full_name` → `display_name` (profiles)
  - Removed `is_primary`, `display_order`, `image_path` references
- ✅ Fixed Supabase SSR client types with proper assertions
- ✅ Removed invalid table joins (`talent_profiles` from applications)
- ✅ Fixed auth-provider, forms, portfolio, and booking types
- ✅ Added TypeScript safety section to README
- ✅ Created TYPESCRIPT_COMMON_ERRORS.md quick reference guide
- ✅ Updated TYPE_SAFETY_IMPROVEMENTS.md with November 2025 fixes
- ✅ Fixed agent-identified runtime issues:
  - Portfolio ordering switched from display_order → created_at
  - useSupabase() returns null instead of throwing (React best practice)
  - Portfolio image upload: image_path → image_url (critical fix)
  - Restored client email notifications (was accidentally disabled)
  - Created missing API route for talent application confirmations
- ✅ Created comprehensive email system tests and documentation
  - Verified all 8 email API routes exist and function correctly
  - Added EMAIL_SYSTEM_VERIFICATION.md for reference

**PREVIOUS: Client Application System** - November 1, 2025
- ✅ Created 4 professional email templates for client onboarding workflow
- ✅ Built comprehensive admin dashboard at `/admin/client-applications`
- ✅ All using existing Resend email infrastructure

---

# 🎯 **LATEST UPDATE: Status Badge System Complete!** ✨

**November 12, 2025** - Implemented comprehensive status badge system across the entire platform:
- ✅ 25+ professional badge variants for all entity types
- ✅ Color-coded visual feedback (gigs, applications, bookings, roles)
- ✅ Smart type-safe components with auto-status detection
- ✅ Zero-cost implementation (pure CSS + React)
- ✅ Deployed across 9 pages and components
- ✅ Full TypeScript safety with database enum types
- ✅ Complete documentation in `docs/STATUS_BADGE_SYSTEM.md`

**Impact:** Significantly improved user experience with instant visual status recognition throughout the app!

---

# 🎯 **NEXT PRIORITY: Testing & Polish**

## 📋 **Current Client Application Process Analysis**

**✅ What's Working:**
1. **Form Collection**: Professional form at `/client/apply` collects all necessary data
2. **Database Storage**: Applications stored in `client_applications` table with proper schema
3. **Success Flow**: Users get confirmation and clear next steps
4. **Email Infrastructure**: Resend is configured and ready to use
5. **Admin Actions**: Basic approve/reject functions exist in `client-actions.ts`

**❌ What's Missing:**
1. **Email Notifications**: No emails sent when applications are submitted
2. **Admin Interface**: No UI for admins to view/manage client applications
3. **Application Status Tracking**: No way for applicants to check status
4. **Automated Follow-up**: No email sequences for pending applications

## 🚀 **Recommended Implementation Plan**

### **Phase 1: Email Notifications (1-2 hours)**
- ✅ **To Company**: Immediate notification when new application submitted
- ✅ **To Applicant**: Confirmation email with application details
- ✅ **Follow-up**: Automated reminder if no response in 3 days

### **Phase 2: Admin Dashboard (2-3 hours)**
- ✅ **New admin page**: `/admin/client-applications`
- ✅ **View all applications** with filtering (pending/approved/rejected)
- ✅ **Approve/reject with notes**
- ✅ **Export functionality**

### **Phase 3: Application Status Page (1 hour)**
- ✅ **Public page**: `/client/application-status`
- ✅ **Applicants can check status** using email + application ID

## 💡 **Why This Approach is Best**

**Leverages existing infrastructure:**
1. **Resend** (already configured)
2. **Supabase** (database ready)
3. **Next.js** (admin pages pattern exists)
4. **Cost-effective** (no additional subscriptions)
5. **Customizable** (full control over workflow)

---

# 📊 **Current MVP Completion Status**

| Category | Status | Completion |
| --- | --- | --- |
| Authentication | ✅ Complete | 100% |
| Database Schema | ✅ Complete | 100% |
| Core UI Components | ✅ Complete | 100% |
| Gig Management | ✅ Complete | 95% |
| Application Flow | ✅ Complete | 100% |
| Profile Management | ✅ Complete | 95% |
| Booking System | ✅ Complete | 95% |
| Image Uploads | ✅ Complete | 100% |
| Search/Filtering | ✅ Complete | 100% |
| Email Notifications | ✅ Complete | 100% |
| Legal Pages | ✅ Complete | 100% |
| **Client Application System** | ✅ **Complete** | **100%** |
| Testing | 🔄 In Progress | 30% |
| Deployment | ✅ Complete | 95% |
| **Performance & UX** | 🔄 **In Progress** | **75%** |

---

# 🎯 **Immediate Next Steps**

### **0. Schema Guardrail Alignment (NOW)**
- [x] Update all `types:regen*` scripts to call `supabase gen types ... --project-id utvircuwknqzpnmvxidp --schema public` so local output matches CI byte-for-byte (header comment diff disappears)
- [x] Regenerate `types/database.ts`, rerun `npm run schema:verify:comprehensive`, and commit the synced file before the next push to `develop`
- [x] Document this ritual in the Supabase context prompt/common errors once complete (prevents future schema-truth noise)

## **Priority 1: Client Application System Enhancement**

### **1. Email Notifications Implementation**
- [x] Create email templates for client applications (confirmation + follow-ups)
- [x] Integrate with existing Resend service
- [x] Send notifications on application submission (applicant + admin ops)
- [x] Add follow-up email sequences (automatic reminders after 3 days)

### **2. Admin Interface Creation**
- [x] Create admin page for client applications
- [x] Add approve/reject functionality with notes
- [x] Email notifications for status changes
- [x] Export functionality for applications

### **3. Status Tracking System**
- [x] Public status check page
- [x] Email notifications for status updates
- [x] Application ID generation and tracking
- [x] Harden `/api/client-applications/status` so only the owning applicant can read their status/admin notes

## **Priority 2: Final MVP Polish**

### **4. Testing Expansion**
- ✅ Seeded QA personas/gigs/content flags via `supabase/seed.sql` (see `docs/TEST_DATA_REFERENCE.md`)
- ✅ Playwright auth convergence stabilization (Dec 21, 2025)
  - `tests/auth/**` runs reliably against `next start` (Windows/OneDrive-safe)
  - Uses stable `data-testid` hooks + hydration gates + robust login convergence helper
  - Proof: `npx playwright test tests/auth --project=chromium --retries=0 --reporter=list` → **23 passed, 4 skipped** (skips are env-driven client creds / regression sentinels)
- [x] Portfolio E2E tests
  - [x] `portfolio-gallery.spec.ts`: verify grid render, hover effects, and modal viewer
  - [x] `talent-public-profile.spec.ts`: ensure SafeImage + flag dialog work under RLS
- [x] Application flow tests (manual QA confirmed the client onboarding cycle, CTA, and middleware guards)
  - [x] `client-application-flow.spec.ts`: submit, approve/reject, follow-up reminders (manually validated via QA checklist + `npm run build`)
  - [x] `talent-gig-application.spec.ts`: gated apply CTA, subscription paywall, status badge updates (manually validated via QA checklist)
- [x] Unit tests for utilities
  - [x] `lib/services/email-templates.test.ts`: confirmation/approval/rejection/follow-up payloads
  - [x] `lib/utils/status-badges.test.ts`: variant mapping + color tokens
  - [x] `lib/actions/moderation-actions.test.ts`: flag validation helpers (pure functions only)
  - [x] `npm run lint` + `npm run build` (sanity checks after every QA pass)

### **5. Launch Preparation**
- [x] Google Analytics setup (30 mins)
  - [x] Add GA4 tag via Next.js Script in `app/layout.tsx`
  - [ ] Document env toggle + consent handling in `docs/TECH_STACK_BREAKDOWN.md`
- [x] Surface persistent subscribe CTA in the header/nav for logged-in talent (header button + mobile menu) so subscribing is clearer on every device (`/talent/subscribe`)
- [x] Ensure "Create account as client" and contextual links route to `/client/apply` and show application-state messaging for logged-in visitors so the admin-approved flow actually lands in the documented process
- [x] Document and implement the unified signup → role-selection flow (create `docs/CLIENT_ACCOUNT_FLOW_PRD.md`, gate `/client/apply`, add `/onboarding/select-account-type`, update middleware/redirects)
- [x] Backfill `profiles.account_type` for existing admins/talent/clients and surface "Apply to be a Client" for logged-in talent in the header
- [ ] Final UI/UX polish
  - [ ] Audit shadcn components for inconsistent spacing (buttons, inputs)
  - [ ] Run color contrast pass on admin dashboard + public marketing pages
- [ ] Security audit completion
  - [ ] Re-run `security:check` script, capture output in `docs/SECURITY_CONFIGURATION.md`
  - [ ] Verify middleware suspension + role gating for every protected route
- [ ] Beta testing with real users
  - [ ] Prepare smoke-test checklist (subscription, applications, moderation)
  - [ ] Capture feedback + issues in `PAST_PROGRESS_HISTORY.md`

## **Priority 3: Performance & UX Optimization Roadmap**

**Codebase Assessment Date:** January 2025  
**Current Rating:** 7.5/10 - Production Ready, Needs UX Polish  
**Goal:** Achieve 9/10 rating with modern, snappy user experience

### **🎯 Immediate Priority (High Impact - Quick Wins)**

#### **1. Eliminate Page Reloads (Critical UX Issue)**
**Problem:** 7 instances of `window.location.reload()` break SPA feel and cause jarring full-page reloads  
**Impact:** Users experience unnecessary loading states and lose scroll position  
**Files Affected:**
- `app/talent/dashboard/page.tsx` (3 instances)
- `app/settings/sections/portfolio-section.tsx` (2 instances)
- `app/talent/error-state.tsx` (1 instance)
- `app/settings/avatar-upload.tsx` (1 instance)

**Tasks:**
- [ ] Replace all `window.location.reload()` with `router.refresh()` + optimistic state updates
- [ ] Implement optimistic UI updates for profile creation/updates
- [ ] Add proper loading states during refresh (skeletons, not spinners)
- [ ] Test that state persists correctly after refresh (no data loss)
- [ ] Verify scroll position is maintained where appropriate

**Estimated Time:** 2-3 hours  
**Priority:** 🔴 Critical

#### **2. Production Code Cleanup**
**Problem:** 12+ `console.log` statements in production code (dashboard alone)  
**Impact:** Performance overhead, potential security concerns, cluttered browser console

**Tasks:**
- [ ] Create centralized logging utility (`lib/utils/logger.ts`) with log levels
- [ ] Replace all `console.log` with logger utility
- [ ] Configure logger to disable debug logs in production
- [ ] Keep error logging for Sentry integration
- [ ] Audit all files for console statements: `grep -r "console\." app/ components/ lib/`

**Estimated Time:** 1-2 hours  
**Priority:** 🟡 Medium

#### **3. Enhanced Loading States**
**Problem:** Some pages lack proper loading skeletons, using generic spinners  
**Impact:** Users see blank screens or generic loading indicators instead of contextual placeholders

**Tasks:**
- [ ] Audit all pages for missing `loading.tsx` files
- [ ] Create skeleton components matching actual content layout
- [ ] Replace generic spinners with content-specific skeletons
- [ ] Ensure skeletons match final content dimensions (prevent layout shift)
- [ ] Add skeleton states for: dashboard cards, application lists, profile sections

**Estimated Time:** 2-3 hours  
**Priority:** 🟡 Medium

### **🚀 Short-Term Improvements (Medium Impact)**

#### **4. React Performance Optimizations**
**Problem:** Limited use of `React.memo`, `useMemo`, `useCallback` causing unnecessary re-renders  
**Impact:** Slower interactions, especially on dashboard with large data sets

**Tasks:**
- [ ] Split dashboard into smaller components (`app/talent/dashboard/page.tsx` is 1306 lines)
- [ ] Add `React.memo` to expensive list components (gig cards, application cards)
- [ ] Memoize expensive computations with `useMemo` (filtered lists, sorted data)
- [ ] Wrap callbacks with `useCallback` to prevent child re-renders
- [ ] Profile with React DevTools Profiler to identify bottlenecks
- [ ] Optimize re-render frequency for dashboard stats/metrics

**Estimated Time:** 4-6 hours  
**Priority:** 🟡 Medium

#### **5. Request Deduplication & Caching**
**Problem:** Concurrent requests for same data cause duplicate queries  
**Impact:** Unnecessary database load, slower page loads

**Tasks:**
- [ ] Evaluate React Query or SWR for request deduplication
- [ ] Implement request caching for profile data (already cached in auth context)
- [ ] Add request deduplication for dashboard data fetches
- [ ] Cache gig lists with appropriate TTL
- [ ] Implement stale-while-revalidate pattern for frequently accessed data

**Estimated Time:** 3-4 hours  
**Priority:** 🟢 Low-Medium

#### **6. Server Component Migration**
**Problem:** Dashboard is fully client-side component, missing RSC benefits  
**Impact:** Larger JavaScript bundles, slower initial load, no SEO benefits

**Tasks:**
- [ ] Audit dashboard for server-side data fetching opportunities
- [ ] Convert data fetching to Server Components where possible
- [ ] Keep only interactive parts as Client Components
- [ ] Leverage Next.js streaming for progressive page loads
- [ ] Test that RLS policies work correctly with Server Components

**Estimated Time:** 4-5 hours  
**Priority:** 🟢 Low-Medium

### **✨ Long-Term Polish (Nice-to-Have)**

#### **7. Transition Animations**
**Problem:** State changes feel abrupt without visual transitions  
**Impact:** Less polished user experience compared to modern apps

**Tasks:**
- [ ] Add CSS transitions for state changes (loading → loaded)
- [ ] Implement View Transitions API for route changes
- [ ] Add smooth animations for modal open/close
- [ ] Create loading → success state transitions
- [ ] Ensure animations respect `prefers-reduced-motion`

**Estimated Time:** 3-4 hours  
**Priority:** 🟢 Low

#### **8. Enhanced Error Boundaries**
**Problem:** Generic error boundaries don't provide context-specific recovery  
**Impact:** Users see generic error messages without clear recovery paths

**Tasks:**
- [ ] Create route-specific error boundaries (`app/talent/error-boundary.tsx`, etc.)
- [ ] Add contextual error messages with recovery actions
- [ ] Implement retry mechanisms for failed requests
- [ ] Add error boundary logging to Sentry with user context
- [ ] Test error boundaries with various failure scenarios

**Estimated Time:** 2-3 hours  
**Priority:** 🟢 Low

#### **9. Offline Support & Service Worker**
**Problem:** No offline functionality, app requires constant connection  
**Impact:** Poor experience on unreliable networks

**Tasks:**
- [ ] Evaluate Next.js PWA plugin or Workbox
- [ ] Implement service worker for offline caching
- [ ] Cache critical assets (CSS, JS, images)
- [ ] Add offline fallback page
- [ ] Test offline functionality across browsers

**Estimated Time:** 6-8 hours  
**Priority:** 🟢 Low

### **📊 Success Metrics**

**Before Optimization:**
- Page reloads: 7 instances
- Console logs: 12+ in production
- Dashboard load time: ~2-3 seconds
- Re-renders: High (unoptimized)
- User rating: 7.5/10

**After Optimization (Target):**
- Page reloads: 0 (all client-side updates)
- Console logs: 0 in production (logger only)
- Dashboard load time: <1 second (with caching)
- Re-renders: Optimized (memoized components)
- User rating: 9/10

### **🎯 Implementation Order**

1. **Week 1:** Eliminate reloads + Production cleanup (Critical)
2. **Week 2:** Enhanced loading states + React optimizations (High impact)
3. **Week 3:** Request deduplication + Server Component migration (Medium impact)
4. **Week 4+:** Transition animations + Error boundaries + Offline support (Polish)

### **💡 Key Principles**

- **Zero-cost improvements first:** Client-side optimizations cost $0 in infrastructure
- **Measure before optimizing:** Use React DevTools Profiler to identify bottlenecks
- **Progressive enhancement:** Don't break existing functionality
- **User experience over code perfection:** Focus on what users feel, not just metrics
- **Test thoroughly:** Each optimization should be verified with real user flows

---

# 🚀 **Implementation Timeline**

## **Week 1: Client Application System**
- **Day 1-2**: Email notifications implementation
- **Day 3-4**: Admin dashboard creation
- **Day 5**: Status tracking system

## **Week 2: Final Polish & Launch**
- **Day 1-2**: Testing expansion
- **Day 3**: Google Analytics & final polish
- **Day 4-5**: Beta testing and launch prep

---

# 📋 **Technical Implementation Details**

## **Email Templates Needed**
1. **New Application Notification** (to company)
2. **Application Confirmation** (to applicant)
3. **Application Approved** (to applicant)
4. **Application Rejected** (to applicant)
5. **Follow-up Reminder** (to company)

## **Database Schema** (Already Ready)
- ✅ `client_applications` table exists
- ✅ All required fields present
- ✅ RLS policies configured
- ✅ Admin access policies ready

## **Admin Interface Requirements**
- ✅ View all applications with pagination
- ✅ Filter by status (pending/approved/rejected)
- ✅ Approve/reject with admin notes
- ✅ Export to CSV functionality
- ✅ Email notifications on status change

---

# 🎉 **Recent Major Accomplishments**

## **Authentication Flow Consolidation** (January 15, 2025)
- ✅ Single entry point for account creation
- ✅ Beautiful choose-role page with professional images
- ✅ Consistent user experience across all entry points
- ✅ Comprehensive documentation updates

## **Previous Major Features** (See PAST_PROGRESS_HISTORY.md)
- ✅ Portfolio Gallery System
- ✅ Email Notification System
- ✅ Database Performance Optimization
- ✅ UI/UX Polish Implementation
- ✅ Legal Pages (Terms & Privacy)

---

# 📞 **Support & Resources**

- **Sentry Dashboard**: Real-time error monitoring
- **Supabase Dashboard**: Database management and logs
- **GitHub Repository**: Version control and CI/CD
- **Vercel Dashboard**: Deployment logs and analytics
- **Documentation**: Comprehensive guides in `/docs`
- **Past Progress**: Complete history in `PAST_PROGRESS_HISTORY.md`

---

## 🎯 **Next Session Priorities**

### **Session Update (Feb 19, 2026)**

**Done (P0):**
1. **Reduced Sentry Replay volume in production** - Updated client Replay sampling to be mostly error-triggered (`replaysOnErrorSampleRate: 0.05`) and disabled always-on session sampling in prod (`replaysSessionSampleRate: 0.0`).
2. **Stopped known Instagram/WebView Replay noise** - Added a targeted `beforeSend` filter for `enableDidUserTypeOnKeyboardLogging` in `instrumentation-client.ts` to drop that non-actionable event.

**Next (P0 - Critical):**
1. **Deploy + verify Sentry issue suppression** - Confirm `TOTLMODELAGENCY-25` no longer reopens after deploy.
2. **Replay health validation** - Confirm real production app errors still attach Replay data for triage.

**Next (P1 - Follow-up):**
1. **Monitor Sentry volume trend** - Compare Replay/event volume and signal quality after the sample-rate reduction.
2. **Tighten filter if needed** - If required, gate the keyboard-logging filter by Instagram user agent for stricter scope.

### **Launch Preparation:**
1. **Google Analytics Setup** (30 mins) - Document env toggle
2. **Security Audit** - Re-run security checks
3. **Beta User Testing** - Prepare smoke-test checklist
4. **🚀 Soft Launch**

### **Post-Launch Optimization:**
1. **React Performance** - Add memoization and component splitting
2. **Request Deduplication** - Implement React Query or SWR
3. **Server Component Migration** - Convert dashboard to RSC pattern
4. **Transition Animations** - Add smooth state transitions

---

*Last Updated: February 19, 2026*
*Current Status: MVP Complete - BootState routing spine implemented + verify-all passing*
*Codebase Rating: 8/10 - Production Ready, Auth/Onboarding + E2E Stability Improved*
*Next Review: After performance optimizations (Priority 3 tasks)*
