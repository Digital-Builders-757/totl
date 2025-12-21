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
| **P1** | BLOCKED | young | Talent: Apply → Accept → Booking proof cannot run end-to-end | Test: `npx playwright test tests/integration/booking-accept.spec.ts --project=chromium --retries=0 --reporter=list` | Fix **D3** first, then rerun and log in `docs/AUDIT_LOG.md` | `client_applications` RLS breaks Career Builder submission (see `AUDIT_LOG` P1) |
| **P2** | BLOCKED | young | Client: Status portal proof is blocked by Career Builder submission failing | Test: `npx playwright test tests/admin/career-builder-approval-pipeline.spec.ts --project=chromium --retries=0 --reporter=list` | Fix **D3** first, then rerun and log in `docs/AUDIT_LOG.md` | `client_applications` RLS breaks submit + status check (see `AUDIT_LOG` P2) |
| **D1** | DECISION NEEDED | young | Drift: `/client/apply` is public in routing constants but action requires auth | Law decision + update canonical docs: `lib/constants/routes.ts`, `docs/journeys/CLIENT_JOURNEY.md`, `docs/contracts/ADMIN_CONTRACT.md` | Decide: “auth required” vs “public submission”; implement smallest diff + proof | Conflicting truths (routes vs action vs journey) |
| **D2** | DECISION NEEDED | young | Drift: client-side profile writes reported in `PROFILES_CONTRACT` | Proof: grep guard + contract pointer; then migrate writes behind server actions | Decide remediation path + schedule | Requires code refactor (not audit-only) |
| **D3** | IN PROGRESS | young | BUG: `client_applications` RLS references `auth.users` → 42501 permission denied | Proof: rerun **P1/P2** (see `docs/AUDIT_LOG.md`) | Create a migration to replace policies with `user_id = auth.uid()` (no `auth.users` reads); update schema audit; re-run proofs | Requires DB migration applied to target environment |


