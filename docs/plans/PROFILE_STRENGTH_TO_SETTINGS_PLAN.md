# Profile Strength → Settings Relocation Plan

**Date:** March 15, 2026  
**Status:** ✅ IMPLEMENTED (Approach A)  
**Feature:** Move Profile Strength from talent dashboard Overview to Settings; add dashboard entry point to profile settings.

---

## STEP 0 — MANDATORY CONTEXT

### Documents Read
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/DOCUMENTATION_INDEX.md`
- `database_schema_audit.md`
- `docs/diagrams/airport-model.md`
- `docs/diagrams/role-surfaces.md`
- `docs/development/DASHBOARD_MOBILE_DENSITY_GUIDE.md`
- `docs/features/TALENT_DASHBOARD_V1_SIMPLIFICATION_PLAN.md`
- `docs/UI_CONSTITUTION.md`
- `docs/contracts/PROFILES_CONTRACT.md`

### Diagrams Used and Why
| Diagram | Relevance |
|---------|------------|
| **role-surfaces.md** | Defines talent terminal surface area; Profile Strength and Settings are talent-only. Ensures we don’t leak into client/admin. |
| **airport-model.md** | Classifies zones: Terminal (UI), Staff (server actions). This is a Terminal-only change. |

### Schema Impact
**None.** Profile Strength is derived from existing `talent_profiles` and `portfolio_items` data. No migrations required.

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

1. **Middleware = security only**  
   No changes to middleware, routing, or redirect logic. This is a UI-only relocation.

2. **All mutations are server-side**  
   Profile Strength is read-only. No new mutations; existing `app/settings/actions.ts` remains the canonical mutation path.

3. **No DB calls in client components**  
   Profile Strength logic can stay in Server Components or be passed as props. No new client-side Supabase reads.

4. **No new privileged reads in client chrome**  
   Dashboard header already has a Settings link. We must not add new Supabase reads in header/drawer for badges or counts.

5. **UI stays in Terminal**  
   Changes are confined to the talent terminal (`/talent/dashboard`, `/settings` for talent). No middleware/auth/bootstrap changes.

**RED ZONE INVOLVED: NO**

---

## STEP 2 — AIRPORT MAP (ARCHITECTURAL ZONES)

| Zone | Touched? | Why | What Stays Out |
|------|----------|-----|----------------|
| **Security** | No | No routing/auth changes | — |
| **Terminal** | Yes | Dashboard Overview + Settings page UI | No business logic, no DB writes |
| **Staff** | No | No new server actions | — |
| **Ticketing** | No | No Stripe | — |
| **Announcements** | No | No email/notifications | — |
| **Baggage** | No | No storage changes | — |
| **Locks** | No | No RLS/triggers | — |
| **Control Tower** | No | No admin/webhooks | — |

**Zone violations to avoid:**
- Do not add Supabase reads in dashboard header/drawer for Profile Strength badge (UI Constitution §4).
- Do not move Profile Strength logic into a shared component used by client/admin without a role-surface audit.

---

## STEP 3 — DESIGN PROPOSALS (MINIMAL DIFFS)

### Approach A: Extract Component + Relocate (Recommended)

**Description:**  
Extract Profile Strength into a reusable `ProfileStrengthCard` component. Render it on `/settings` for talent users (above or as first section in ProfileEditor). Remove it from the dashboard Overview. Keep the existing Settings button in the dashboard header; optionally add a compact “Profile” or “Settings” link in the Overview tab for discoverability.

**Files expected to change:**
- `app/talent/dashboard/client.tsx` — Remove Profile Strength card from Overview grid; optionally keep a slim “Complete profile” CTA when `needsProfileCompletion` (or remove if banner suffices).
- `components/dashboard/profile-strength-card.tsx` (new) — Presentational component: props `{ talentProfile, portfolioCount, needsProfileCompletion }`. Renders progress, checklist, “Complete Profile” and “Settings” links.
- `app/settings/profile-editor.tsx` — Add Profile Strength card for talent users (e.g. above the tabbed interface or as first section).
- `app/settings/page.tsx` — Pass `talent`, `portfolioItems` (or derived completion state) to ProfileEditor so it can render Profile Strength. Data is already fetched here.

**Data model impact:** None.

**Risks:**
- Profile Strength logic (`needsProfileCompletion`, completion %) is currently in dashboard client. Must be centralized (e.g. server-side helper or shared util) so Settings (RSC) and dashboard (client) can both use it without duplication.
- Ensure Settings page only shows Profile Strength for `profile.role === "talent"`.

**Why this respects Constitution + Airport:**
- Terminal-only UI changes.
- No new DB reads in chrome.
- Mutations remain in `app/settings/actions.ts`.

---

### Approach B: Settings-Only + Slim Dashboard CTA

**Description:**  
Move the full Profile Strength card to Settings only. On the dashboard, remove the card entirely. When `needsProfileCompletion`, keep only the existing amber banner (“Complete Your Profile” → `/talent/profile`). Add a small “Profile & Settings” link in the Overview tab (e.g. under the summary or near “Browse opportunities”) so users can reach Settings without relying on the header.

**Files expected to change:**
- `app/talent/dashboard/client.tsx` — Remove Profile Strength card; keep or refine the `needsProfileCompletion` banner; add a compact “Profile & Settings” link in Overview.
- `app/settings/profile-editor.tsx` — Add Profile Strength section for talent (same as A).
- `app/settings/page.tsx` — Pass talent/portfolio data to ProfileEditor.
- New `ProfileStrengthCard` component (or inline in ProfileEditor if talent-only).

**Data model impact:** None.

**Risks:**
- Fewer entry points to Settings; ensure header Settings button is visible on mobile (per DASHBOARD_MOBILE_DENSITY_GUIDE).

**Why this respects Constitution + Airport:**
- Same as A; simpler dashboard.

---

### Approach C: Profile Strength as Settings Tab

**Description:**  
Add a dedicated “Profile Strength” tab in the Settings ProfileEditor (for talent only). Move the full card content there. Remove from dashboard. Rely on header Settings button for access.

**Files expected to change:**
- `app/talent/dashboard/client.tsx` — Remove Profile Strength card.
- `app/settings/profile-editor.tsx` — Add “Profile Strength” tab (talent only); move card content into that tab.
- `app/settings/page.tsx` — Pass talent/portfolio data.

**Data model impact:** None.

**Risks:**
- Extra tab may feel heavy for a single card. Profile Strength is more of a “status” than a form; a top-level card (A/B) may be clearer.

**Why this respects Constitution + Airport:**
- Same as A; different placement within Settings.

---

## STEP 4 — ACCEPTANCE CRITERIA (DEFINITION OF DONE)

### UI Behavior
- [ ] Profile Strength card no longer appears on talent dashboard Overview.
- [ ] Profile Strength appears on `/settings` for talent users only.
- [ ] Talent can reach Settings from the dashboard (header Settings button and/or Overview link).
- [ ] Profile Strength shows: completion %, Basic Info / Contact / Portfolio status, “Complete Profile” and “Settings” (or equivalent) actions.
- [ ] When `needsProfileCompletion`, the amber “Complete Your Profile” banner may remain on dashboard (or be removed if redundant).
- [ ] Available Opportunities (or equivalent) is more prominent on the Overview tab (e.g. first or second card).

### Data Correctness
- [ ] Completion logic matches current behavior: `needsProfileCompletion = !first_name || !last_name || !location`.
- [ ] Contact/Portfolio status reflects real data (or documented placeholder until wired).

### Permissions & Access Control
- [ ] Profile Strength visible only to talent users on `/settings`.
- [ ] No new RLS or auth changes.

### Failure Cases (Must NOT Happen)
- [ ] Profile Strength must not appear for client/admin on Settings.
- [ ] No redirect loops or auth/bootstrap regressions.
- [ ] No new Supabase reads in dashboard header/drawer.

---

## STEP 5 — TEST PLAN

### Manual Test Steps

**Happy path**
1. Log in as talent.
2. Go to `/talent/dashboard` → Overview tab.
3. Confirm Profile Strength card is gone; Opportunities/Quick Stats visible.
4. Click Settings (header) → confirm `/settings` loads.
5. Confirm Profile Strength card appears on Settings (above or in first section).
6. Verify completion %, checklist, and “Complete Profile” / “Settings” links work.

**Edge cases**
- Talent with incomplete profile: banner (if kept) and Settings Profile Strength both reflect “Needs work”.
- Client user: `/settings` does not show Profile Strength.
- Admin user: `/settings` does not show Profile Strength (or show only if admin has talent profile; document behavior).

**Mobile (390x844)**
- Dashboard: no horizontal overflow; Opportunities visible above fold.
- Settings: Profile Strength card readable; touch targets ≥ 44px.

### Automated Tests
- Update `tests/talent/talent-dashboard-route.spec.ts` (or equivalent): remove assertions for Profile Strength on dashboard; add assertion that Overview does not contain “Profile Strength” text.
- Optional: add test that `/settings` as talent contains “Profile Strength” or “Profile Completion”.

### RED ZONE Regression
- N/A (no middleware/auth/bootstrap/Stripe changes).

---

## STEP 6 — STOP AND WAIT

**Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?**
