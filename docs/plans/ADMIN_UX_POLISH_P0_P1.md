# Admin UX Polish — P0/P1 Punchlist (Production Critical Flows)

**Date:** 2026-03-17

**Purpose:** Capture the highest-leverage Admin UX/reliability fixes discovered during a production walkthrough of critical admin flows.

## Scope (paths reviewed)
- `/admin/dashboard`
- `/admin/gigs` (All Opportunities list)
- `/admin/gigs/create` (Create Opportunity form)
- `/admin/applications` (Talent Applications list)
- `/admin/client-applications` (Career Builder Applications list)
- `/admin/moderation` (Moderation queue)
- `/admin/users` (Users list)

---

## P0 — Must-fix (blocks core admin workflows)

### P0.1 Admin detail pages return 404 in production ✅ (fixed)
**Observed (production):**
- Clicking **View Opportunity** from `/admin/gigs` actions menu navigates to `/admin/gigs/[id]` and returns **404**.
- Clicking **View Details** from `/admin/applications` action menu navigates to `/admin/applications/[id]` and returns **404**.
- Clicking **View Details** from `/admin/client-applications` action menu navigates to `/admin/client-applications/[id]` and returns **404**.

**Impact:** Admin can’t inspect or manage individual records in detail (hard blocker for launch operations).

**Fix:** Ensure these routes exist and are deployed with the admin layout + auth gates:
- ✅ `app/admin/gigs/[id]/page.tsx`
- ✅ `app/admin/applications/[id]/page.tsx` (already existed)
- ⏳ `app/admin/client-applications/[id]/page.tsx` (not required — client-applications uses drawer/modal; no route needed)

**Acceptance:** Navigating to each detail page as an authenticated admin renders the detail UI (not public header, not 404) and supports intended actions.

---

### P0.2 Confirm “Admin Portal” chrome persists across all admin routes
**Observed:** When the 404 happens, the page renders with the public header (Sign In / Create Account), indicating a route/layout boundary mismatch.

**Fix:** Ensure admin routes consistently render under the admin layout and enforce auth before route render.

**Acceptance:** Admin routes never fall back to public chrome when an authenticated admin navigates.

---

## P1 — High value polish (clarity + consistency)

### P1.1 Terminology consistency: “Opportunities” vs “Gigs” ✅ (mostly fixed)
**Observed:** `/admin/gigs` page header is “All Opportunities,” but a section heading still reads “Gigs.”

**Fix:** Use a single term in admin UI (prefer “Opportunities” to match the rest of the product).

**Acceptance:** No mixed “Gig/Gigs” headings on opportunity management pages.

**Status / notes:**
- ✅ `/admin/gigs` list + empty state copy standardized to “Opportunities”.
- ✅ `/admin/dashboard` opportunity cards no longer link to public `/gigs/[id]`.
- ✅ `/admin/applications/[id]` no longer links to public gig page for admin triage.
- ⏳ Remaining non-user-facing variable names (e.g. `filteredGigs`) can be left as-is.

---

### P1.2 Admin create opportunity form: validate no duplicate select artifact ⏳ (not yet verified)
**Observed:** The accessibility snapshot shows multiple combobox nodes around **Opportunity Type**.

**Fix:** Confirm only one interactive control is rendered for Opportunity Type; remove redundant/hidden controls.

**Acceptance:** One clear “Opportunity Type” input; no duplicate focus targets.

---

### P1.3 Admin applications list: reduce reliance on IDs only ✅ (fixed)
**Observed:** Talent Applications list table surfaces Application ID / Gig ID / Talent ID, which is operationally hard to use.

**Fix:** Add human identifiers (opportunity title, talent name, company) as columns or in a secondary line within the cell.

**Acceptance:** An admin can triage without copying IDs.

---

### P1.4 Users page: verify counts are internally consistent ✅ (improved display names + search)
**Observed (example):** Header stats show **210 Suspended** while the All tab shows **98**. Could be “All excludes suspended,” but then the label should communicate that.

**Fix:** Make counts clearly scoped:
- If “All” excludes suspended, label it (e.g., “All Active”) or show both totals.

**Acceptance:** An operator can trust counts without doing mental math.

**Status / notes:**
- ✅ Users list now prefers real names (display_name → talent profile → fallback) and search matches that display.
- ⏳ The specific suspended-count mismatch should be re-verified in production data; may require relabeling or scoped counts depending on query semantics.

---

## Verified working in production
- **Admin applications inline approve** works:
  - Action menu → Approve opens modal
  - Approve completes successfully
  - Counts update (New decreases, Approved increases)
  - Success toast shown
- `/admin/moderation` loads and shows empty buckets correctly (no errors)

---

## Notes
This punchlist is intentionally minimal-diff and focused on launch-blocking reliability (P0) plus small clarity wins (P1). Once detail routes work, re-run the admin walkthrough to validate create → view → edit → close flows end-to-end.
