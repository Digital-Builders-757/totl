# Career Builder (Client) UX Polish — P0/P1 Punchlist (Production Review)

**Date:** 2026-03-17

**Purpose:** Capture a copy/paste-ready punchlist of the highest-leverage Career Builder UX fixes from a production Browser Relay walkthrough.

## Scope
- Role: **Career Builder (Client)**
- Surfaces reviewed:
  - `/client/dashboard`
  - `/client/gigs` (My Opportunities)
  - `/client/applications` (Applications)
  - `/post-gig` (Post a New Opportunity)
  - Notifications dropdown (client terminal)

**Notes:** This walkthrough was performed on an account with **0 opportunities** and **0 applications**, so emphasis is on empty states, navigation, and form completion ergonomics.

---

## P0 — Must-do (conversion + completion)

### P0.1 Make the dashboard action model singular ✅ (implemented for Talent; Client pending)
**Problem:** The dashboard shows 6 KPI cards and each repeats a “Next action” link. This produces competing instructions and dilutes the primary job-to-be-done.

**Fix:**
- Add a single primary CTA near the top (mobile-first): **Post New Opportunity** → `/post-gig`
- Reduce/remove “Next action” footers on KPI cards (keep KPIs as status, not instructions)

**Acceptance:** A new Career Builder can immediately see *one* obvious next step without scanning.

---

### P0.2 Ensure “Create Opportunity” navigation is consistent ✅ (fixed)
**Observed:** “Create Opportunity” in the client terminal routes to `/post-gig`.

**Problem:** `/post-gig` renders the public site header (Opportunities + My Account) instead of the client terminal header chrome, which risks role confusion and inconsistent navigation.

**Fix options:**
- Preferred: render `/post-gig` inside the client terminal chrome (Career Builder header/drawer style), or
- Alternative: move create-opportunity route under `/client/...` and redirect `/post-gig` → canonical client route.

**Implemented:**
- ✅ Added canonical route: `/client/post-gig`
- ✅ Kept `/post-gig` as a stable alias, but it now redirects → `/client/post-gig`
- ✅ Updated client dashboard CTAs to link to `/client/post-gig`

**Acceptance:** Career Builder always stays inside client-scoped navigation while posting.

---

### P0.3 Long form completion: reduce abandonment
**Problem:** Posting is a long form with many required fields; on mobile it’s easy to abandon.

**Fix:**
- Add **Save draft** (ideal) or at minimum an **unsaved changes guard** when leaving.
- Visually break the form into sections:
  - **Quick Post (required):** Title, Type, Location, Pay, Date
  - **Details (optional):** Description, Duration, Deadline, Cover Image

**Acceptance:** Users can confidently start, pause, and finish without losing work.

---

## P1 — Professional polish (clarity + reduced friction)

### P1.1 Opportunity Type control: validate there’s no duplicate/select artifact
**Observed:** The accessibility snapshot suggests two combobox elements in the Opportunity Type area.

**Fix:** Confirm the UI does not render a duplicate select/portal artifact. If it does, remove the redundant control.

**Acceptance:** Only one clear “Opportunity Type” input is interactive.

---

### P1.2 Normalize examples + formatting hints for key fields
**Fields:** Compensation, Duration, Location

**Fix:**
- Compensation helper: “Use $500 or $500–$800”
- Duration helper: provide presets/chips (1 day, 2–3 days, ongoing) or example copy

**Acceptance:** More consistent data entry; fewer unclear submissions.

---

### P1.3 Dates: clarify defaults + meaning
**Problem:** Application Deadline is optional, but its behavior isn’t explained.

**Fix:**
- Helper text: “Leave blank for no deadline”
- Optional default: auto-set deadline to (date - 2 days) or +7 days depending on the product intent

**Acceptance:** Users understand what happens if they leave it empty.

---

### P1.4 Applications empty-state link should stay role-scoped ✅ (fixed)
**Observed:** On `/client/applications`, the empty state includes “How applications work” which routes to `/about` (public page).

**Problem:** Sends Career Builders to a public marketing page and breaks role-scoped navigation expectations.

**Fix options:**
- Replace with an in-terminal help route (e.g. `/client/help/applications`) or
- Open a modal/side sheet explaining statuses (New → Under Review → Shortlisted → Accepted/Rejected)

**Implemented:**
- ✅ Replaced `/about` link with `/client/help/applications`.

**Acceptance:** Help content remains inside the client terminal.

---

### P1.5 Notifications dropdown empty-state
**Observed:** Notifications dropdown shows “No notifications yet” + “View all” → `/client/applications`.

**Fix:** Keep this, but consider making “View all” contextually accurate:
- If notifications will later include bookings/invoices, route to a dedicated notifications page.

**Acceptance:** “View all” always matches user expectation.

---

## P2 — Nice-to-have (mobile density)

### P2.1 Sticky primary CTA on mobile for long pages
**Where:** `/post-gig`

**Fix:** Add a sticky bottom bar on mobile with primary **Post Opportunity** and secondary **Cancel**.

**Acceptance:** Users can submit without scrolling back to the bottom.

---

## Notes / Observations
- `/client/gigs` has a strong empty state (“Post Your First Opportunity”) and a clear “Post New Opportunity” button.
- Filters/search scaffolding on `/client/applications` is good; empty state is helpful but needs role-scoped help.
