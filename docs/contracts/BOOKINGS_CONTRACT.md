# Bookings Contract

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define booking creation and lifecycle, including who can confirm/see bookings.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/core-transaction-sequence.md`

---

## Routes involved (exact paths)
- `/client/bookings` (client bookings list)
- `/talent/dashboard` (talent sees bookings)
- `/client/dashboard` (client sees bookings)

**UNVERIFIED:** any booking detail route.

---

## Canonical server actions/services
- Booking is created via application acceptance:
  - `lib/actions/booking-actions.ts` → `acceptApplication(...)` (inserts into `bookings`).

---

## Data model touched
- `public.bookings`
  - `id`, `gig_id`, `talent_id`, `status`, `date`, `compensation`, `notes`, timestamps.

---

## RLS expectations (intent)
- Talent can read bookings where `talent_id = auth.uid()`.
- Client can read bookings for gigs they own.

**UNVERIFIED:** whether public read access exists; must be verified against migrations (do not trust older docs).

---

## Failure modes
- Booking created but application status not updated (should be non-fatal; code currently treats status update failure as non-blocking).

---

## Proof (acceptance + test steps)
- Client accepts an application → booking exists.
- Talent sees booking on dashboard.

---

## Related docs (reference)
- `docs/BOOKING_FLOW_IMPLEMENTATION.md` (to be reduced to pointer once migrated)
