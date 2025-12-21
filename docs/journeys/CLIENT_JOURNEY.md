# Client (Career Builder) Journey (End-to-End)

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Step-by-step Career Builder journey. Career Builder is a **promoted state** (admin approval), not a signup choice.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/role-surfaces.md`

---

## Step-by-step route sequence

### 0) Start as authenticated Talent
- **Route:** `/login` (or signup flow)
- **Contracts:** `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`

### 1) Submit Career Builder application
- **Route:** `/client/apply`
- **Writes:** `client_applications` (insert)
- **Side effects:** confirmation email + admin notification email
- **Contracts:** `docs/contracts/ADMIN_CONTRACT.md`, `docs/contracts/EMAIL_NOTIFICATIONS_CONTRACT.md`
 
**LAW (canonical):** Career Builder application requires authentication (signed-out users must be redirected to `/login?returnUrl=/client/apply`).

### 2) Wait for approval
- **Route:** `/client/application-status` (authenticated)
- **Reads:** `client_applications` status
- **Contracts:** `docs/contracts/ADMIN_CONTRACT.md`

### 3) Admin approves
- **Route (admin):** `/admin/client-applications`
- **Writes:**
  - `client_applications.status='approved'`
  - `profiles.role='client' AND profiles.account_type='client'`
  - `client_profiles` created (idempotent)
- **Contracts:** `docs/contracts/ADMIN_CONTRACT.md`

### 4) Client signs in and lands in client dashboard
- **Routes:** `/login` → `/client/dashboard`
- **Reads:** `profiles` for routing
- **Contracts:** `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`

### 5) Post/manage gigs and review applications
- **Routes:** `/client/gigs`, `/client/applications`, `/client/bookings`
- **Reads/Writes:** `gigs`, `applications`, `bookings`
- **Contracts:** `docs/contracts/GIGS_CONTRACT.md`, `docs/contracts/APPLICATIONS_CONTRACT.md`, `docs/contracts/BOOKINGS_CONTRACT.md`

---

## RLS expectations (high-level)
- Client can create gigs where `gigs.client_id = auth.uid()`.
- Client can read applications where `gigs.client_id = auth.uid()`.

**UNVERIFIED:** exact policies.

---

## Proof checklist
- [ ] Authenticated user can submit Career Builder application.
- [ ] Admin can approve and promotion persists.
- [ ] Promoted user lands at `/client/dashboard`.

---

## Automated tests (pointers)
- `tests/client/client-functionality.spec.ts`
- `tests/integration/application-email-workflow.spec.ts` (**UNVERIFIED**)
