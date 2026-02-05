# Stripe Webhook Orphaned Customer Resolution Plan

**Date:** February 5, 2026  
**Status:** DESIGN ONLY  
**Feature:** Handle Stripe webhook events for customers without matching profiles

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- ✅ `docs/ARCHITECTURE_CONSTITUTION.md` - Non-negotiable boundaries
- ✅ `docs/DOCUMENTATION_INDEX.md` - Documentation spine
- ✅ `database_schema_audit.md` - Schema truth (profiles table structure)
- ✅ `supabase/migrations/20251220033929_add_stripe_webhook_events_ledger.sql` - Webhook ledger schema
- ✅ `supabase/migrations/20251121194107_add_subscription_system.sql` - Subscription fields schema
- ✅ `app/api/stripe/webhook/route.ts` - Current webhook implementation
- ✅ `app/talent/subscribe/actions.ts` - Checkout session creation
- ✅ `docs/contracts/STRIPE_WEBHOOKS_CONTRACT.md` - Webhook contract
- ✅ `docs/troubleshooting/STRIPE_WEBHOOKS_RUNBOOK.md` - Operational runbook

### Canonical Mental Model
- ✅ `docs/diagrams/airport-model.md` - Airport zones (Security, Terminal, Staff, Ticketing, Control Tower, Locks)

### Selective Diagrams Used
- ✅ `docs/diagrams/infrastructure-flow.md` - **RELEVANT**: Shows webhook → Supabase flow (API Route → Admin Client → DB)
- ✅ `docs/diagrams/core-transaction-sequence.md` - **NOT RELEVANT**: This is about gig/application flow, not billing
- ✅ `docs/diagrams/signup-bootstrap-flow.md` - **NOT RELEVANT**: This is about auth bootstrap, not webhooks
- ✅ `docs/diagrams/role-surfaces.md` - **NOT RELEVANT**: This is about UI routing, not webhook handling

**Why infrastructure-flow.md is relevant:** The webhook handler is an API Route (Staff zone) that calls Supabase Admin Client (Control Tower) to update profiles (Locks zone). This diagram shows the allowed communication paths.

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

### 1. **Stripe webhooks must be idempotent**
- **Rule:** Verify signatures; safe to retry; update-by-key; no double effects
- **How it limits design:** We cannot mark events as "processed" if the profile update didn't actually happen. We must maintain truthful ACK behavior (500 for retryable failures, 200 for truly orphaned events that will never resolve).

### 2. **All mutations are server-side**
- **Rule:** Server Actions or API Routes only
- **How it limits design:** The webhook handler (`/api/stripe/webhook/route.ts`) is the ONLY place where this logic can live. We cannot add client-side fallback logic.

### 3. **RLS is final authority**
- **Rule:** Never bypass RLS with service role in client/browser code
- **How it limits design:** The webhook already uses `createSupabaseAdminClient()` (service role), so RLS is bypassed. However, we must ensure our queries still respect data integrity (e.g., not creating phantom profiles).

### 4. **No `select('*')`**
- **Rule:** Always select explicit columns
- **How it limits design:** When querying profiles or Stripe metadata, we must explicitly list columns (e.g., `select("id, stripe_customer_id")`).

### 5. **Missing profile is a valid bootstrap state**
- **Rule:** Middleware must allow safe routes; changes must prevent redirect loops
- **How it limits design:** A missing profile for a Stripe customer is a **valid state** that can occur due to test/live mismatch, manual Stripe operations, or deleted users. We must handle it gracefully without breaking the webhook idempotency contract.

**RED ZONE INVOLVED: YES**

**Which zones:**
- ✅ **Stripe webhooks** (`app/api/stripe/webhook/route.ts`) - Must maintain idempotency and truthful ACK
- ✅ **Control Tower** (DB triggers/webhooks) - Webhook ledger updates
- ✅ **Locks** (RLS / DB constraints) - Profile lookups and updates

**Why:** This touches the webhook handler which is a Red Flag file per Constitution. Any changes must preserve idempotency, maintain truthful ACK behavior, and not break the ledger tracking system.

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

### Zones This Feature Touches

#### **Control Tower** (Admin Tools / Automation / Webhooks)
- **Why:** The webhook handler (`app/api/stripe/webhook/route.ts`) lives here. It receives Stripe events and updates the ledger + profiles.
- **Responsibility:** Process Stripe events, maintain idempotency ledger, update profile subscription state
- **Must stay OUT:** Business logic about "what subscription means" (that's Staff zone), UI rendering (that's Terminal zone)

#### **Locks** (RLS / DB Constraints / Triggers)
- **Why:** Profile lookups (`profiles.stripe_customer_id`) and updates happen here. The webhook ledger (`stripe_webhook_events`) tracks processing state.
- **Responsibility:** Store subscription state, enforce data integrity, prevent double-processing
- **Must stay OUT:** Webhook signature verification (that's Control Tower), Stripe API calls (that's Ticketing zone)

#### **Ticketing** (Stripe / Billing)
- **Why:** We read Stripe event metadata (`subscription.metadata.supabase_user_id`, `checkout.session.client_reference_id`) to resolve orphaned customers.
- **Responsibility:** Provide customer metadata that links Stripe entities to internal users
- **Must stay OUT:** Database writes (that's Locks zone), webhook routing logic (that's Control Tower)

### Zones This Feature Must NOT Touch

#### **Security** (Middleware / Routing Gates)
- **Why:** Webhooks are public endpoints authenticated by Stripe signature, not middleware. No routing changes needed.

#### **Terminal** (UI Pages & Components)
- **Why:** This is a backend-only fix. Users never see "orphaned customer" errors directly.

#### **Staff** (Server Actions / API Routes / Business Logic)
- **Why:** The webhook handler IS an API Route, but it's classified as Control Tower for this analysis. We're not adding new Server Actions.

#### **Announcements** (Email / Notifications)
- **Why:** We're not sending alerts about orphaned events (could be noisy). Admin can query the ledger.

#### **Baggage** (Storage / Uploads)
- **Why:** No file operations involved.

### Zone Violations to Avoid

1. **Don't bypass idempotency:** If we mark an event "processed" but didn't update a profile, we violate the truthful ACK contract.
2. **Don't create phantom profiles:** We cannot create a `profiles` row just because Stripe has a customer. The profile must exist via normal signup flow.
3. **Don't query with anon client:** The webhook already uses admin client (good), but we must ensure all profile lookups use it.

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: Multi-Resolution Strategy + Orphaned Event Tracking (RECOMMENDED)

**High-level description:**
Enhance the webhook handler to resolve customers using multiple strategies (metadata → customer_id → email fallback), and track truly orphaned events in the ledger without causing infinite retries.

**Files expected to change:**
1. `app/api/stripe/webhook/route.ts`
   - Add `resolveProfileFromStripeEvent()` function that tries:
     - `subscription.metadata.supabase_user_id` (best)
     - `checkout.session.client_reference_id` (if checkout event)
     - `customer.metadata.supabase_user_id` (if customer object available)
     - Fallback: `profiles.stripe_customer_id == customer_id` (current method)
     - Last resort: `profiles.email == customer.email` (if email available)
   - Update `handleSubscriptionUpdate()` to use multi-resolution
   - Update `customer.subscription.deleted` handler to use multi-resolution
   - When profile is truly not found after all strategies:
     - Mark ledger as `status = 'orphaned'` (new status)
     - Log customer_id, event_id, event_type, email (if present)
     - Return **200** (so Stripe stops retrying) for events where profile is not expected (e.g., test events, deleted users)
     - Return **500** (retry) only for `checkout.session.completed` where profile MUST exist

2. `supabase/migrations/YYYYMMDDHHMMSS_add_orphaned_status_to_webhook_ledger.sql` (NEW)
   - Add `'orphaned'` to `stripe_webhook_events.status` enum/check constraint
   - Add `customer_email` column (nullable) to store email for orphaned events
   - Update status check constraint to allow `'orphaned'`

**Data model impact:**
- **New migration:** Add `'orphaned'` status to webhook ledger
- **New column:** `stripe_webhook_events.customer_email` (nullable text) for debugging orphaned events
- **No changes to `profiles` table**

**Key risks:**
- ✅ **Redirect loops:** N/A (no middleware/auth changes)
- ✅ **Profile bootstrap gaps:** N/A (we're not creating profiles, just handling missing ones)
- ✅ **RLS enforcement:** Already using admin client, so no RLS issues
- ✅ **Stripe/webhook idempotency:** 
  - **RISK:** If we return 200 for orphaned events, Stripe won't retry even if the profile appears later
  - **MITIGATION:** Only return 200 for events where profile is truly not expected (test mode, deleted users). For `checkout.session.completed`, return 500 so Stripe retries until profile mapping is fixed.
- ✅ **Email matching false positives:** 
  - **RISK:** Multiple profiles could have the same email
  - **MITIGATION:** Email fallback should use `.maybeSingle()` and log a warning if multiple matches found. Prefer metadata-based resolution.

**Why this approach respects:**
- ✅ **Constitution:** Maintains idempotency (ledger tracks all events), truthful ACK (200 for truly orphaned, 500 for retryable), no `select('*')` (explicit selects)
- ✅ **Airport boundaries:** All logic stays in Control Tower (webhook handler), queries Locks (profiles table), reads Ticketing (Stripe metadata)
- ✅ **Selected diagrams:** Follows infrastructure-flow.md (API Route → Admin Client → DB)

---

### Approach B: Metadata-Only Resolution (Simpler, Less Robust)

**High-level description:**
Only use metadata-based resolution (no email fallback). Mark orphaned events as `'ignored'` instead of new `'orphaned'` status.

**Files expected to change:**
1. `app/api/stripe/webhook/route.ts`
   - Add `resolveProfileFromMetadata()` function that tries:
     - `subscription.metadata.supabase_user_id`
     - `checkout.session.client_reference_id`
     - `customer.metadata.supabase_user_id`
     - Fallback: `profiles.stripe_customer_id == customer_id`
   - Update handlers to use metadata resolution
   - When profile not found: mark as `'ignored'` with error message, return 200

2. **No migration needed** (reuse existing `'ignored'` status)

**Data model impact:**
- **None** (reuse existing `'ignored'` status)

**Key risks:**
- ✅ **Less robust:** No email fallback means more events will be marked "ignored" for customers created outside normal flow
- ✅ **Debugging harder:** Orphaned events mixed with "unhandled event type" ignores in ledger

**Why this approach respects:**
- ✅ **Constitution:** Same as Approach A
- ✅ **Airport boundaries:** Same as Approach A
- ✅ **Selected diagrams:** Same as Approach A

---

### Approach C: Retry Forever Until Profile Appears (Current Behavior, Enhanced Logging)

**High-level description:**
Keep current behavior (return 500 when profile not found), but enhance logging and add metadata resolution as fallback.

**Files expected to change:**
1. `app/api/stripe/webhook/route.ts`
   - Add metadata resolution (same as Approach B)
   - Enhance error logging with customer_id, event_type, metadata available
   - Keep returning 500 for all "profile not found" cases

**Data model impact:**
- **None**

**Key risks:**
- ❌ **Infinite retries:** Stripe will retry forever for truly orphaned customers (test events, deleted users)
- ❌ **Noise:** Sentry will be flooded with retry errors
- ✅ **Idempotency preserved:** Ledger prevents double-processing

**Why this approach respects:**
- ✅ **Constitution:** Maintains idempotency, but violates "truthful ACK" principle (returning 500 for events that will never resolve)
- ✅ **Airport boundaries:** Same as Approach A
- ✅ **Selected diagrams:** Same as Approach A

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- **N/A** (backend-only change)

### Data Correctness
1. ✅ **Profile resolution works:** Webhook successfully resolves profiles using metadata (`supabase_user_id`) when available
2. ✅ **Fallback works:** When metadata missing, webhook falls back to `stripe_customer_id` lookup (current behavior)
3. ✅ **Orphaned events tracked:** Events for customers without profiles are recorded in ledger with `status = 'orphaned'` (or `'ignored'` with clear error message)
4. ✅ **No double-processing:** Idempotency ledger prevents duplicate profile updates when Stripe retries
5. ✅ **Test events handled:** Test mode events (`livemode = false`) for non-existent customers are marked orphaned and return 200 (no retries)

### Permissions & Access Control
1. ✅ **Admin client used:** All profile queries use `createSupabaseAdminClient()` (service role) to bypass RLS
2. ✅ **No phantom profiles:** Webhook never creates `profiles` rows (only updates existing ones)
3. ✅ **Ledger integrity:** All events (including orphaned) are recorded in `stripe_webhook_events` ledger

### Failure Cases (What Must NOT Happen)
1. ❌ **Infinite retries:** Stripe must not retry forever for truly orphaned events (test mode, deleted users)
2. ❌ **Double updates:** Same event must not update profile twice (idempotency ledger prevents this)
3. ❌ **False positives:** Email matching must not update wrong profile (use `.maybeSingle()` and log warnings)
4. ❌ **Lost events:** Orphaned events must be tracked in ledger (not silently dropped)
5. ❌ **Profile creation:** Webhook must not create profiles (only signup flow creates profiles)

### Verifiable Without Reading Code
1. ✅ **Sentry errors decrease:** "No profile found for customer" errors should decrease (metadata resolution catches more cases)
2. ✅ **Ledger shows orphaned:** Query `stripe_webhook_events WHERE status = 'orphaned'` shows events for customers without profiles
3. ✅ **Stripe dashboard:** Webhook delivery logs show 200 responses for orphaned events (not 500 retries)
4. ✅ **Test events handled:** Test webhook events for non-existent customers return 200 immediately

---

## STEP 5 — TEST PLAN

### Manual Test Steps

#### Happy Path: Metadata Resolution Works
1. Create checkout session with `metadata.supabase_user_id` set (already done in `createTalentCheckoutSession`)
2. Trigger `checkout.session.completed` webhook (or `customer.subscription.updated`)
3. **Expected:** Webhook resolves profile via `subscription.metadata.supabase_user_id` and updates subscription status
4. **Verify:** Query `profiles` table shows updated `subscription_status`, `stripe_subscription_id`
5. **Verify:** Query `stripe_webhook_events` shows `status = 'processed'`

#### Edge Case: Customer ID Fallback
1. Create Stripe customer manually (via Stripe Dashboard) with `metadata.supabase_user_id` NOT set
2. Create subscription for that customer
3. Trigger `customer.subscription.updated` webhook
4. **Expected:** Webhook falls back to `stripe_customer_id` lookup and updates profile
5. **Verify:** Profile updated correctly

#### Edge Case: Orphaned Test Event
1. Send test webhook event (`livemode = false`) for customer `cus_test123` that doesn't exist in DB
2. **Expected:** Webhook tries all resolution strategies, finds no profile, marks ledger as `status = 'orphaned'`, returns 200
3. **Verify:** Query `stripe_webhook_events` shows `status = 'orphaned'`, `customer_id = 'cus_test123'`
4. **Verify:** Stripe dashboard shows webhook delivered successfully (200), no retries

#### Edge Case: Orphaned Live Event (Deleted User)
1. Create profile + Stripe customer + subscription
2. Delete profile (or user) from Supabase
3. Trigger `customer.subscription.updated` webhook for that customer
4. **Expected:** Webhook finds no profile, marks as `'orphaned'`, returns 200 (for subscription updates) or 500 (for checkout.session.completed if we expect profile to exist)
5. **Verify:** Ledger shows `status = 'orphaned'`, no infinite retries

#### Edge Case: Checkout Session Completed Without Profile (Should Retry)
1. Create checkout session but profile update fails (simulate DB error)
2. Trigger `checkout.session.completed` webhook
3. **Expected:** Webhook cannot find profile (because update failed), returns 500 so Stripe retries
4. **Verify:** After profile is fixed, retry succeeds and profile is updated

### Automated Tests to Add/Update

**File:** `lib/stripe-webhook-route.test.ts` (if exists) or create new test file

1. **Test metadata resolution:**
   - Mock Stripe event with `subscription.metadata.supabase_user_id = 'user-123'`
   - Mock Supabase query returning profile for `id = 'user-123'`
   - Assert profile is resolved via metadata, not customer_id

2. **Test fallback to customer_id:**
   - Mock Stripe event without metadata, with `customer = 'cus_abc123'`
   - Mock Supabase query returning profile for `stripe_customer_id = 'cus_abc123'`
   - Assert profile is resolved via customer_id fallback

3. **Test orphaned event handling:**
   - Mock Stripe event with customer that has no matching profile
   - Assert ledger is marked as `status = 'orphaned'`
   - Assert webhook returns 200 (for subscription updates) or 500 (for checkout.session.completed)

4. **Test idempotency preserved:**
   - Mock duplicate event ID
   - Assert second call short-circuits (no profile update attempted)
   - Assert ledger shows `status = 'processed'` or `'orphaned'` from first attempt

### Explicit RED ZONE Regression Checks

1. ✅ **Webhook idempotency:** Replay same `event.id` twice → second call short-circuits, no double profile updates
2. ✅ **Ledger integrity:** All events (including orphaned) are recorded in `stripe_webhook_events`
3. ✅ **Truthful ACK:** Events that will never resolve (test mode, deleted users) return 200. Events that should resolve (checkout.session.completed) return 500 until fixed.
4. ✅ **Admin client usage:** All profile queries use `createSupabaseAdminClient()` (verify no RLS blocking)
5. ✅ **No profile creation:** Webhook never calls `profiles.insert()` (only `update()`)

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**

**Recommendation:** **Approach A** (Multi-Resolution Strategy + Orphaned Event Tracking) because:
- Most robust (handles all resolution strategies)
- Best debugging (dedicated `'orphaned'` status + `customer_email` column)
- Respects truthful ACK (200 for truly orphaned, 500 for retryable)
- Minimal risk (small migration, clear separation of concerns)

**Open Questions:**
1. Should we add `customer_email` column to ledger for debugging orphaned events? (Approach A includes this)
2. Should `checkout.session.completed` return 500 if profile not found (to retry until profile appears), or 200 (to stop retries)? Recommendation: 500 for checkout (profile MUST exist), 200 for subscription updates (profile may have been deleted)
3. Should we add email fallback resolution, or is metadata + customer_id sufficient? Recommendation: Add email fallback but log warnings if multiple matches found
