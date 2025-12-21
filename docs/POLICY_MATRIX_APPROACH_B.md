# TOTL Policy Matrix — Approach B (Hybrid) + G1

**Date:** December 21, 2025  
**Status:** ✅ LOCKED (Canonical)  
**Purpose:** Single source of truth for access/visibility rules. All routing, RLS, and UI must align to this matrix.

---

## 🎯 Core Policy (One-Line Summary)

> **Approach B:** Public talent profiles are shareable marketing pages (no sensitive fields), there is no talent directory, and client visibility of sensitive fields is relationship-bound (Applicants/Bookings only).

---

## Roles

- **SO** = Signed-out (anonymous)
- **T** = Signed-in Talent
- **C** = Signed-in Client / Career Builder
- **A** = Admin

---

## Field Classes (for `/talent/[slug]` and any talent view)

### Public Talent Fields (safe marketing)
- display name (or stage name)
- avatar / portfolio media
- location (general, e.g., city/state)
- experience bio (non-sensitive)
- height / measurements / hair / eyes / shoe (optional marketing fields)
- languages (optional)
- external portfolio link (optional)

### Sensitive Talent Fields (relationship-only)
- phone
- email / contact email
- private notes
- anything that enables direct off-platform contact unless relationship exists

---

## A) Public Pages & Top Funnel

### `/` (Home)

| Role | Access    | Notes                                          |
| ---- | --------- | ---------------------------------------------- |
| SO   | ✅ Allowed | Must not advertise "Browse Talent Directory."  |
| T    | ✅ Allowed | Can show "Find gigs" CTA.                      |
| C    | ✅ Allowed | Can show "Post a gig / Review applicants" CTA. |
| A    | ✅ Allowed | Optional admin link hidden/secondary.          |

### `/about`, `/how-it-works`, similar marketing pages

| Role     | Access    |
| -------- | --------- |
| SO/T/C/A | ✅ Allowed |

### `/login`, `/reset-password`, `/verification-pending`

| Role     | Access    | Notes                                          |
| -------- | --------- | ---------------------------------------------- |
| SO/T/C/A | ✅ Allowed | Always safe routes; must avoid redirect loops. |

---

## B) Talent Marketing Profile (public but intentional)

### `/talent/[slug]` (Marketing Profile Page)

| Role | Access    | Data Visible                                                          |
| ---- | --------- | --------------------------------------------------------------------- |
| SO   | ✅ Allowed | **Public Talent Fields only**                                         |
| T    | ✅ Allowed | Public fields + (optional) "connect" features if you build them later |
| C    | ✅ Allowed | Public fields only **unless relationship exists**                     |
| A    | ✅ Allowed | Public fields + sensitive (admin override)                            |

**Relationship rule for Clients (C):**

- If client has **relationship** to this talent (one of):
  - talent applied to a gig owned by that client
  - client has an active booking with that talent
  - then the client may see **Sensitive Talent Fields**.
- Otherwise: **no sensitive fields**.

✅ This preserves shareable marketing profiles while keeping "clients don't browse contact info."

---

## C) No Talent Directory (this is the core of Approach B)

### `/talent` (Directory / roster)

| Role | Access                      | Behavior                                                                                   |
| ---- | --------------------------- | ------------------------------------------------------------------------------------------ |
| SO   | ❌ Not allowed               | Redirect to home or 404.                                                                   |
| T    | ❌ Not allowed (recommended) | (Optional exception: talent-only "community directory," but that breaks B's spirit—avoid.) |
| C    | ❌ Not allowed               | Must never exist for clients.                                                              |
| A    | ✅ Allowed (optional)        | Only if you need an admin-only roster for moderation; better as `/admin/talent`.           |

**Decision baked in:** there is **no roster browsing** as a product surface.

---

## D) Gigs (Opportunities) — G1 Posture (LOCKED)

### `/gigs` (Gig list)

| Role | Access        | Notes                                    |
| ---- | ------------- | ---------------------------------------- |
| SO   | ❌ Not allowed | Requires sign-in                         |
| T    | ✅ Allowed     | Can browse and apply (if eligible)       |
| C    | ✅ Allowed     | Can browse opportunities, but not apply  |
| A    | ✅ Allowed     | Full view                                |

### `/gigs/[id]` (Gig detail — active gigs only)

| Role | Access    | Notes                            |
| ---- | --------- | -------------------------------- |
| SO   | ✅ Allowed | No apply CTA without sign-in     |
| T    | ✅ Allowed | Apply CTA shown only if eligible |
| C    | ✅ Allowed | No apply CTA                     |
| A    | ✅ Allowed | Full view                        |

**G1 Rationale:**
- Supports events + sharing (public gig links)
- Preserves privacy (no public roster)
- Keeps intent high (browsing requires sign-in)

---

## E) Applying (hard gated)

### `/gigs/[id]/apply`

| Role | Access                       | Notes                                                          |
| ---- | ---------------------------- | -------------------------------------------------------------- |
| SO   | ❌ Not allowed                | Redirect to login with returnUrl.                              |
| T    | ✅ Allowed *only if eligible* | Eligibility can include email verified + subscription.         |
| C    | ❌ Not allowed                | Redirect to client dashboard or explain "clients can't apply." |
| A    | ✅ Allowed (optional)         | Usually not necessary, but safe for debugging.                 |

---

## F) Client Terminal (relationship surfaces)

### `/client/dashboard`

| Role | Access                                                |
| ---- | ----------------------------------------------------- |
| SO   | ❌                                                     |
| T    | ❌ (unless you support dual-role; currently assume no) |
| C    | ✅                                                     |
| A    | ✅ (optional admin override)                           |

### `/client/gigs` (manage own gigs)

| Role | Access |
| ---- | ------ |
| C/A  | ✅      |
| SO/T | ❌      |

### `/client/applications` (applicants)

| Role | Access | Talent visibility                                                                                |
| ---- | ------ | ------------------------------------------------------------------------------------------------ |
| C/A  | ✅      | Client can view applicants for their gigs and see sensitive fields **for those applicants only** |
| SO/T | ❌      | —                                                                                                |

### `/client/bookings`

| Role | Access | Talent visibility                   |
| ---- | ------ | ----------------------------------- |
| C/A  | ✅      | Sensitive allowed for booked talent |
| SO/T | ❌      | —                                   |

---

## G) Talent Terminal

### `/talent/dashboard`

| Role | Access |
| ---- | ------ |
| T/A  | ✅      |
| SO/C | ❌      |

### `/talent/applications` (their own applications)

| Role | Access |
| ---- | ------ |
| T/A  | ✅      |
| SO/C | ❌      |

### `/talent/profile` (edit)

| Role | Access |
| ---- | ------ |
| T/A  | ✅      |
| SO/C | ❌      |

---

## H) Admin Terminal

### `/admin/*`

| Role   | Access |
| ------ | ------ |
| A      | ✅      |
| SO/T/C | ❌      |

**Important:** Do not route client actions through `/admin/*` (even if it works). That's a truth-surface violation.

---

## Implementation Checklist

When implementing changes, verify:

- [ ] No discoverability surfaces advertise "Browse Talent Directory"
- [ ] `/talent` directory route is disabled/redirected (not accessible to SO/C)
- [ ] `/talent/[slug]` is public but shows only public fields (unless relationship exists)
- [ ] `/gigs` list requires sign-in
- [ ] `/gigs/[id]` is public for active gigs only
- [ ] Apply flow is talent-only and eligibility-gated
- [ ] Clients see sensitive talent fields only via Applicants/Bookings
- [ ] RLS policies align with this matrix
- [ ] Middleware routing classification matches this matrix
- [ ] No enumeration reads ("fetch all talent then filter")

---

## Related Documentation

- `docs/CLIENT_TALENT_VISIBILITY.md` — Client visibility rules (must align)
- `docs/ARCHITECTURE_CONSTITUTION.md` — Non-negotiable boundaries
- `docs/diagrams/role-surfaces.md` — Terminal boundaries
- `lib/constants/routes.ts` — Route constants (must reflect this matrix)
- `middleware.ts` — Routing gates (must enforce this matrix)

