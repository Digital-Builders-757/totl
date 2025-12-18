# Talent Journey (End-to-End)

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** A plain-English, step-by-step journey for a Talent user, with route sequence, reads/writes, and pointers to domain contracts.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/airport-model.md`

---

## Step-by-step route sequence

### 0) Land on marketing surface
- **Route:** `/`
- **Reads:** none required
- **Writes:** none
- **Contracts:** N/A

### 1) Browse gigs
- **Route:** `/gigs` → `/gigs/[id]`
- **Reads:** `gigs` (public active listings)
- **Writes:** none
- **Contracts:** `docs/contracts/GIGS_CONTRACT.md`

### 2) Create account (Talent)
- **Routes:** `/choose-role` → `/talent/signup` → `/verification-pending` → `/auth/callback`
- **Reads/Writes:**
  - Writes: `auth.users` (Supabase Auth)
  - Writes (trigger): `profiles`, `talent_profiles` (bootstrap)
- **Contracts:** `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`

### 3) Enter Talent dashboard
- **Route:** `/talent/dashboard`
- **Reads:** `profiles`, `talent_profiles`, talent dashboard domain data
- **Writes:** none by default
- **Contracts:** `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`, `docs/contracts/PROFILES_CONTRACT.md`

### 4) Complete profile + uploads
- **Route:** `/settings`
- **Writes:**
  - `profiles.display_name` (basic)
  - `talent_profiles` (upsert)
  - Storage: `avatars` bucket + `profiles.avatar_path`
- **Contracts:** `docs/contracts/PROFILES_CONTRACT.md`, `docs/contracts/PORTFOLIO_UPLOADS_CONTRACT.md`

### 5) Subscribe (if applying is gated)
- **Routes:** `/talent/subscribe` → `/api/stripe/webhook` → `/talent/settings/billing`
- **Writes:** `profiles.stripe_customer_id`, subscription fields
- **Contracts:** `docs/contracts/STRIPE_WEBHOOKS_CONTRACT.md`

### 6) Apply to a gig
- **Route:** `/gigs/[id]/apply`
- **Reads:** `profiles.role`, `profiles.subscription_status`, `talent_profiles` minimal completeness, `gigs` active status
- **Writes:** `applications` (insert)
- **Side effects:** email notifications (must be canonical)
- **Contracts:** `docs/contracts/APPLICATIONS_CONTRACT.md`, `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md`

### 7) Track status + bookings
- **Route:** `/talent/dashboard`
- **Reads:** `applications`, `bookings`
- **Writes:** none
- **Contracts:** `docs/contracts/APPLICATIONS_CONTRACT.md`, `docs/contracts/BOOKINGS_CONTRACT.md`

---

## RLS expectations (high-level)
- Talent can read/write their own profile (`profiles.id = auth.uid()`), their own `talent_profiles`, and their own `applications`.

**UNVERIFIED:** exact RLS policies; verify against `supabase/migrations/**`.

---

## Proof checklist (manual)
- [ ] Can browse `/gigs` logged out.
- [ ] Can sign up, verify email, land in `/talent/dashboard`.
- [ ] Can update `/settings` and see changes.
- [ ] (If gated) Can subscribe and see subscription status updated.
- [ ] Can apply to a gig and see it listed in dashboard.

---

## Automated tests (pointers)
- `tests/auth/*` (signup/login)
- `tests/integration/gigs-filters.spec.ts` (gigs listing)
- `tests/integration/talent-gig-application.spec.ts` (apply)
- `tests/integration/portfolio-gallery.spec.ts` (portfolio)

**UNVERIFIED:** exact coverage of subscription gating and booking creation in tests.
