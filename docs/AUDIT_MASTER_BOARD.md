# Audit Master Board (Rolling Queue)

**Date:** December 21, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** One-screen, executable queue of audit work. Snapshot judgments live in `docs/AUDIT_STATUS_REPORT.md`. Immutable receipts live in `docs/AUDIT_LOG.md`.

---

## Legend (status)

- **DONE**: reproducible proof exists (another dev can rerun)
- **IN PROGRESS**: actively being proven/fixed
- **BLOCKED**: missing env/credentials/data needed to prove
- **DECISION NEEDED**: conflicting truths; must pick law + update canonical doc

---

## Queue

| ID | Status | Owner | Symptom | Proof hook (rerunnable) | Next action | Blocking reason |
| --- | --- | --- | --- | --- | --- | --- |
| **P1** | DONE | young | Talent: Apply → Accept → Booking created after accept | Test: `npx playwright test tests/integration/booking-accept.spec.ts --project=chromium --retries=0 --reporter=list` | Capture proof receipt in `docs/AUDIT_LOG.md` | - |
| **P2** | DONE | young | Client: Status portal works end-to-end (pre/post approval) | Test: `npx playwright test tests/admin/career-builder-approval-pipeline.spec.ts --project=chromium --retries=0 --reporter=list` | Capture proof receipt in `docs/AUDIT_LOG.md` | - |
| **D1** | DONE | young | Drift resolved: Career Builder apply/status are auth-only | Proof: see `docs/AUDIT_LOG.md` (P1/P2) | Keep canonical docs aligned | - |
| **D2** | DECISION NEEDED | young | Drift: client-side profile writes reported in `PROFILES_CONTRACT` | Proof: grep guard + contract pointer; then migrate writes behind server actions | Decide remediation path + schedule | Requires code refactor (not audit-only) |
| **D3** | DONE | young | **Decision: AUTH REQUIRED.** Fixed: `client_applications` RLS no longer references `auth.users` | Proof: **P1/P2** green (see `docs/AUDIT_LOG.md`) | - | - |


