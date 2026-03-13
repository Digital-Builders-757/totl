# Notifications Implementation Plan

**Date:** March 13, 2026  
**Mode:** DESIGN ONLY (no code)  
**Purpose:** Implement in-app and email notifications for Career Builders (clients) and Talent—application status, new applications, accept/reject—without increasing infrastructure costs.

---

## STEP 0 — MANDATORY CONTEXT

### Core Documents Reviewed
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/DOCUMENTATION_INDEX.md`
- `database_schema_audit.md`
- `docs/diagrams/airport-model.md`
- `docs/diagrams/signup-bootstrap-flow.md`
- `docs/diagrams/role-surfaces.md`
- `docs/diagrams/infrastructure-flow.md`
- `docs/diagrams/core-transaction-sequence.md`
- `docs/development/COST_OPTIMIZATION_STRATEGY.md`
- `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md`

### Diagrams Used and Why
| Diagram | Relevance |
|---------|-----------|
| **airport-model** | Classifies zones (Terminal, Staff, Announcements, Locks) for notification delivery and storage |
| **role-surfaces** | Talent vs Client vs Admin terminals—who gets which notifications |
| **infrastructure-flow** | Server Actions/API routes as hub; Resend for email; no client DB writes |
| **core-transaction-sequence** | Application lifecycle: apply → accept/reject → booking → notifications |
| **signup-bootstrap-flow** | Not directly relevant; no auth/bootstrap changes |

### Current State Summary
- **Email notifications** already exist via Resend: `application-received`, `new-application-client`, `application-accepted`, `application-rejected`, `booking-confirmed` (see `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md`).
- **In-app notification UI** is placeholder: AdminHeader and ClientTerminalHeader show Bell icon; `notificationCount` is hardcoded (e.g. `3`) in admin pages; no real data source.
- **gig_notifications** table = email subscription preferences (new gig alerts by category/location), NOT application status notifications.
- **Cost policy:** Realtime subscriptions and polling are explicitly delayed; prefer page-load fetches and zero-cost patterns.

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

1. **All mutations are server-side**  
   - Notification records must be inserted/updated only in Server Actions or API Routes.  
   - Limits: No client-side DB writes; no `fetch()` from client to Supabase for mutations.

2. **No DB calls in client components**  
   - Badge count and notification list must be fetched by Server Components or passed as props from a Server Action/layout.  
   - Limits: Client components cannot `supabase.from(...).select()` directly.

3. **RLS is final authority**  
   - Any new `user_notifications` table must have RLS so users see only their own rows.  
   - Limits: Never bypass RLS with service role in client/browser code.

4. **Stripe webhooks must be idempotent**  
   - Not applicable to notifications; no Stripe changes.  
   - Limits: N/A.

5. **No `select('*')`**  
   - All notification queries must select explicit columns.  
   - Limits: Avoid broad selects; index on `recipient_id`, `read_at`.

**RED ZONE INVOLVED: NO**  
- No middleware, auth/callback, profile bootstrap, Stripe webhooks, or RLS policy changes to existing auth flows.  
- New table + RLS policies are additive; existing triggers/actions are extended, not replaced.

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

| Zone | Touched? | Responsibility | Must NOT Do |
|------|----------|----------------|-------------|
| **Security** | No | — | — |
| **Terminal** | Yes | Bell icon, badge count, notification dropdown/list in Talent + Client dashboards | No DB writes; no direct Supabase calls |
| **Staff** | Yes | Insert notification rows; send emails; fetch unread count | No client DB access |
| **Ticketing** | No | — | — |
| **Announcements** | Yes | Resend emails (already wired) | No new email types without contract update |
| **Baggage** | No | — | — |
| **Locks** | Yes | RLS on new `user_notifications` table | No service-role bypass in client |
| **Control Tower** | No | — | — |

### Zone Violations to Avoid
- Client component calling `supabase.from('user_notifications').select()`.
- Middleware doing notification logic.
- Realtime subscriptions for live badge updates (cost-increasing; delayed per COST_OPTIMIZATION_STRATEGY).

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: Email-Only + Dashboard Visibility (Zero New Cost)

**Description:** Rely entirely on existing email notifications. Ensure all triggers are correctly wired. Add no new tables or in-app notification UI. Improve dashboard visibility so users see application counts and status changes when they visit.

**Files expected to change:**
- `app/gigs/[id]/apply/actions.ts` — Verify `sendEmail` for `new-application-client` (client email)
- `lib/actions/booking-actions.ts` — Verify `sendEmail` for `application-accepted`, `application-rejected`, `booking-confirmed`
- `app/client/dashboard/*` — Ensure "Applications" tab shows new-application count prominently
- `app/talent/dashboard/*` — Ensure "Applications" / "Bookings" surfaces status changes
- `components/client/client-terminal-header.tsx` — No Bell/badge (or remove placeholder)
- `components/admin/admin-header.tsx` — Replace hardcoded `notificationCount={3}` with real moderation count (content_flags) or remove

**Data model impact:** None.

**Key risks:**
- Users who don’t check email may miss updates.
- No "you have N new items" signal when on other pages.

**Constitution / Airport / Cost alignment:**
- Respects all invariants.
- Zero new DB/storage cost.
- Aligns with core-transaction-sequence (emails at apply, accept, reject).

---

### Approach B: In-App Notifications via New Table (Page-Load Fetch, No Realtime)

**Description:** Add `user_notifications` table. Insert rows when: (1) talent applies → notify client; (2) client accepts → notify talent; (3) client rejects → notify talent. Bell badge = count of unread (`read_at IS NULL`). Fetch count on page load (Server Component or layout); no Realtime, no polling.

**Files expected to change:**
- **New migration:** `supabase/migrations/YYYYMMDDHHMMSS_add_user_notifications.sql`
  - `user_notifications(id, recipient_id, type, reference_id, title, body, read_at, created_at)`
  - RLS: `recipient_id = auth.uid()` for SELECT/UPDATE
  - Indexes: `(recipient_id, read_at)`, `(recipient_id, created_at DESC)`
- `app/gigs/[id]/apply/actions.ts` — After successful insert, insert notification for client
- `lib/actions/booking-actions.ts` — After accept/reject, insert notification for talent
- New Server Action: `getUnreadNotificationCount(userId)` or similar
- Layout/page: Fetch count server-side, pass to header
- `components/client/client-terminal-header.tsx` — Accept `notificationCount` prop, show badge
- `components/admin/admin-header.tsx` — Use real count (admin: content_flags or moderation)
- New: Notification dropdown/panel (optional Phase 2) — list recent, mark-as-read

**Data model impact:**
- New table: `user_notifications`
- ~3–5 INSERTs per application lifecycle (1 new app + 1 accept or 1 reject)
- 1 SELECT per page load for badge (or per session with client cache)

**Key risks:**
- Redirect loops: None (no auth/middleware changes).
- Profile bootstrap: None.
- RLS: Must enforce `recipient_id = auth.uid()`.
- Idempotency: N/A (no webhooks).

**Constitution / Airport / Cost alignment:**
- Mutations in Server Actions only.
- No client DB calls; count fetched server-side.
- No Realtime; Cost Optimization says "user-triggered updates" (page load) are acceptable.
- Minimal DB cost: small table, indexed, bounded by user activity.

---

### Approach C: Hybrid — Derive Counts from Existing Tables (No New Table)

**Description:** Avoid `user_notifications`. Derive badge from existing data:
- **Client:** `COUNT(applications) WHERE gigs.client_id = auth.uid() AND applications.status = 'new'`
- **Talent:** `COUNT(applications) WHERE talent_id = auth.uid() AND status IN ('accepted','rejected')` — but "unread" requires a marker. Add `application_viewed_at` (or similar) to `applications` to mark when talent last viewed. Unread = status in (accepted, rejected) AND application_viewed_at IS NULL.

**Files expected to change:**
- **New migration:** Add `application_viewed_at` (or `talent_viewed_at`) to `applications` if we want talent "unread"
- Server Action / RPC: `getClientUnreadCount()`, `getTalentUnreadCount()`
- Layout: Fetch counts, pass to headers
- Headers: Use real counts

**Data model impact:**
- Option 1: No new table; add nullable `application_viewed_at` to `applications`
- Option 2: For client "new applications" — no new column; just count `status = 'new'`

**Key risks:**
- Mixing "application" domain with "notification read" state.
- Talent "unread" requires a new column and update when they view applications.

**Constitution / Airport / Cost alignment:**
- Same as B for Server Actions and no client DB.
- Slightly lower storage (no new table) but more complex query semantics.

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- [ ] **Career Builder (client):** When a talent applies to their gig, they receive an email (existing) and see an in-app indicator (badge or prominent count) when they load their dashboard or any client page.
- [ ] **Talent:** When accepted or rejected, they receive an email (existing) and see an in-app indicator when they load their dashboard or any talent page.
- [ ] **Badge:** Bell icon shows correct unread count (or "new applications" count for clients) on page load.
- [ ] **No hardcoded counts:** AdminHeader and ClientTerminalHeader use real data, not `notificationCount={3}`.

### Data Correctness
- [ ] Notification rows (if Approach B) are inserted exactly when: new application, accept, reject.
- [ ] No duplicate notifications for the same event.
- [ ] RLS ensures users see only their own notifications.

### Permissions & Access Control
- [ ] Only the recipient can read/update (mark read) their notifications.
- [ ] Count queries use `auth.uid()` and respect RLS.

### Failure Cases (Must NOT Happen)
- [ ] No redirect loops.
- [ ] No Realtime subscriptions or aggressive polling that increase cost.
- [ ] No client-side Supabase calls for notification data.
- [ ] Emails must not be sent twice for the same event (idempotency preserved).

---

## STEP 5 — TEST PLAN

### Manual Test Steps (Happy Path)
1. **Talent applies:** Talent applies to a gig → Client receives email; client dashboard shows new application count.
2. **Client accepts:** Client accepts application → Talent receives accepted + booking emails; talent dashboard shows accepted indicator.
3. **Client rejects:** Client rejects application → Talent receives rejected email; talent dashboard shows rejected indicator.
4. **Badge accuracy:** Load client dashboard → badge shows N new applications; load talent dashboard → badge shows M unread status updates.

### Manual Test Steps (Edge Cases)
1. Accept same application twice → only first acceptance sends emails.
2. User with no notifications → badge shows 0 or hides.
3. RLS: Log in as User A, attempt to read User B’s notifications → must fail.

### Automated Tests to Add/Update
- Unit test for `getUnreadNotificationCount` (or equivalent) with mocked Supabase.
- Playwright: Apply to gig → assert client receives email (if env allows); assert dashboard shows updated count.
- API/contract tests: Ensure email triggers are called (mock Resend).

### RED ZONE Regression Checks
- N/A (no auth/middleware/bootstrap changes).

---

## COST IMPACT SUMMARY

| Approach | New DB Table | New Queries/Page | Realtime | Resend | Est. Cost Delta |
|----------|--------------|------------------|----------|--------|------------------|
| A | No | 0 | No | Existing | $0 |
| B | Yes | 1 SELECT/page | No | Existing | Minimal (~negligible) |
| C | No | 1 SELECT/page | No | Existing | Minimal (~negligible) |

**Resend:** Free tier ~3k emails/month; application lifecycle emails already counted. No new email types = no additional Resend cost.

**Supabase:** New table (B) or extra column (C) + indexed queries stay within free tier. No Realtime = no Realtime cost.

---

## RECOMMENDATION

- **Approach A** if the goal is to fix wiring and avoid any new schema—fastest, zero cost.
- **Approach B** if in-app notification center and badge are important—clean separation, minimal cost, room for future expansion (e.g. mark-as-read, notification list).
- **Approach C** if avoiding a new table is a priority—slightly more complex, reuses `applications`.

---

## STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**
