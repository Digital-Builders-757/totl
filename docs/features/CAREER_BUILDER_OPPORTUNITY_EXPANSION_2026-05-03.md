# Career Builder Opportunity Expansion

**Date:** May 3, 2026  
**Status:** ✅ COMPLETE  
**Purpose:** Track the ship for opportunity-type expansion, on-platform collaboration requests, paid-compensation support, and comp-card schema prep.

---

## Scope shipped

- Expanded opportunity type taxonomy in `lib/constants/gig-categories.ts` and all UI consumers using `VISIBLE_GIG_CATEGORIES`.
- Added an on-platform one-click collaboration request action:
  - New server action `lib/actions/collaboration-actions.ts`.
  - Request entry point on talent public profile in `app/talent/[slug]/talent-profile-client.tsx`.
  - Uses `user_notifications` and existing notification dropdown patterns.
- Added simple paid-compensation support on admin opportunity creation:
  - New `Paid Opportunity` toggle in `app/admin/gigs/create/create-gig-form.tsx`.
  - Compensation formatter now preserves existing min/max behavior and can emit `Paid` / `Paid · $min-$max` in `app/admin/gigs/create/actions.ts`.
- Added migration scaffolding for comp-card and provenance expansion:
  - `supabase/migrations/20260503171000_expand_opportunities_collab_compcard.sql`
  - Includes new `notification_type` value `collaboration_request`
  - Adds comp-card fields on `talent_profiles` (`bust`, `hips`, `waist`, `suit`, `resume_link`)
  - Adds invite/referral provenance columns on `client_applications` (`invited_by_admin_id`, `referral_source`)

## Safety notes

- Collaboration requests are server-validated:
  - Requires authenticated sender.
  - Blocks self-requests.
  - Rejects suspended sender/recipient accounts.
  - Reuses idempotent notification semantics (reference-id stable hash pair).
- Admin visibility is preserved by emitting admin notifications for collaboration requests through the existing admin notification surface.

## Verification run

- `npm run schema:verify:comprehensive` ✅
- `npm run types:check` ✅
- `npm run build` ✅
- `npm run lint` ✅

## Follow-up (P1)

- Apply migration to target Supabase project and regenerate types before any code starts selecting or writing the new comp-card/provenance columns.
- Extend settings/profile forms to expose and persist the newly added comp-card fields once types are regenerated.
