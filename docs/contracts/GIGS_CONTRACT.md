# Gigs Contract

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define gig visibility, gig creation, and the public gig browsing surfaces.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/core-transaction-sequence.md`

---

## Routes involved (exact paths)
- `/gigs` (public listing)
- `/gigs/[id]` (public detail)
- `/gigs/[id]/apply` (talent-only; subscription-gated)

Admin/ops
- `/admin/gigs`
- `/admin/gigs/create`

**UNVERIFIED:** `/post-gig` is present and may be a legacy surface.

---

## Canonical server actions/services

- `app/admin/gigs/create/actions.ts`
  - `createGig(formData)`

- `app/gigs/[id]/apply/actions.ts`
  - `applyToGig({ gigId, message? })`

---

## Data model touched
- `public.gigs`
  - Observed selects: `id, title, client_id, status, location, compensation, created_at, updated_at`
- `public.gig_requirements` (**UNVERIFIED usage in app code**)

---

## RLS expectations (intent)
- Public can read active gigs.
- Only the gig owner (client/admin depending on model) can create/update gigs.

**UNVERIFIED:** exact policy shape; must be verified in migrations.

---

## Known failure modes
- **Gig apply page loads but apply fails**: usually subscription gating or missing talent profile.

---

## Proof (acceptance + test steps)
- Anonymous: can view `/gigs` and `/gigs/[id]`.
- Talent with active subscription: can submit application at `/gigs/[id]/apply`.
- Admin: can create a gig at `/admin/gigs/create` and see it in `/gigs` when active.

---

## Related docs (reference)
- `docs/CLIENT_TALENT_VISIBILITY.md`
