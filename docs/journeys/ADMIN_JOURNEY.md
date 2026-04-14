# Admin Journey (End-to-End)

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Step-by-step admin journey across dashboards, approvals, and moderation.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/airport-model.md`

---

## Step-by-step route sequence

### 1) Sign in
- **Routes:** `/login` → `/admin/dashboard`
- **Reads:** `profiles.role` for routing
- **Contracts:** `docs/contracts/AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md`

### 2) Review Career Builder applications
- **Route:** `/admin/client-applications`
- **Reads:** `client_applications`
- **Writes:** approval/rejection updates
- **Contracts:** `docs/contracts/ADMIN_CONTRACT.md`

### 3) Manage users
- **Routes:** `/admin/users` (+ API routes)
- **Writes:** Supabase Auth admin operations (create/delete) + profile suspension / reinstate (`set-user-suspension`; legacy `disable-user` wrapper)
- **Contracts:** `docs/contracts/ADMIN_CONTRACT.md`

### 4) Moderate content
- **Route:** `/admin/moderation`
- **Reads/Writes:** `content_flags`, possibly `profiles.is_suspended`, `gigs.status`
- **Contracts:** `docs/contracts/ADMIN_CONTRACT.md`

---

## Proof checklist
- [ ] Admin can access `/admin/dashboard`.
- [ ] Admin can approve a client application.
- [ ] Admin can suspend and reinstate an account.
- [ ] Admin can disable a Career Builder from `/admin/users`.
- [ ] Hard delete is restricted to eligible Career Builder accounts only.

---

## Automated tests (pointers)
- `tests/admin/admin-functionality.spec.ts` (**UNVERIFIED contents**)
