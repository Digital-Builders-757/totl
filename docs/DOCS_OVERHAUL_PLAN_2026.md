# Documentation Overhaul Plan — March 2026

**Date:** March 11, 2026  
**Mode:** DESIGN ONLY (no implementation)  
**Purpose:** Archive superseded docs, add subdirectory READMEs, and ensure docs stay aligned with cursor commands and the /plan → /implement → /Ship → /pr flow.

---

## STEP 0 — MANDATORY CONTEXT (What Must Not Change)

### Cursor Command Dependencies (IMMUTABLE)

These paths are hard-coded in `.cursor/commands/*.md` and must **never** be renamed, moved, or deleted:

| Command | Required Docs | Purpose |
|---------|---------------|---------|
| `/plan` | `docs/ARCHITECTURE_CONSTITUTION.md` | Non-negotiables, red-zone rules |
| `/plan` | `docs/DOCUMENTATION_INDEX.md` | Documentation spine |
| `/plan` | `database_schema_audit.md` (root) | Schema source of truth |
| `/plan` | `docs/diagrams/airport-model.md` | Canonical mental model |
| `/plan` | `docs/diagrams/signup-bootstrap-flow.md` | Auth/bootstrap (when relevant) |
| `/plan` | `docs/diagrams/role-surfaces.md` | UI/role (when relevant) |
| `/plan` | `docs/diagrams/infrastructure-flow.md` | Server actions (when relevant) |
| `/plan` | `docs/diagrams/core-transaction-sequence.md` | Gigs/apps/bookings (when relevant) |
| `/plan` | `docs/diagrams/system-map-full.md` | Deep debug only (keep path immutable; treat as legacy/rarely used) |
| `/implement` | Same as plan | Implementation constraints |
| `/Ship` | `MVP_STATUS_NOTION.md` | Status update target |
| `/Ship` | `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` | Failure-mode entries |
| `/Ship` | `docs/DOCUMENTATION_INDEX.md` | New doc links |
| `/continue` | `docs/ARCHITECTURE_CONSTITUTION.md`, `DOCUMENTATION_INDEX.md`, `airport-model.md` | Context |

### Root Files (IMMUTABLE)

- `AGENT_ONBOARDING.md` — AI agent quick start
- `TOTL_PROJECT_CONTEXT_PROMPT.md` — Pre-change checklist
- `database_schema_audit.md` — Schema truth
- `MVP_STATUS_NOTION.md` — Status tracking

### Layer 1 Spine (IMMUTABLE)

- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/OFF_SYNC_INVENTORY.md`
- `docs/POLICY_MATRIX_APPROACH_B.md`
- `docs/contracts/INDEX.md`
- `docs/journeys/INDEX.md`

---

## STEP 1 — CONSTITUTION INVARIANTS (5 BULLETS)

1. **Middleware = security only** — Docs overhaul does not touch middleware, auth, or routing logic.
2. **No DB writes in client components** — Irrelevant to docs; no impact.
3. **RLS is final authority** — Docs must not contradict RLS/schema truth; `database_schema_audit.md` stays canonical.
4. **Never edit generated types** — Irrelevant; no type edits.
5. **Stripe webhooks must be idempotent** — Irrelevant; no webhook changes.

**RED ZONE INVOLVED:** NO — This is a docs-only overhaul. No middleware, auth callback, profile bootstrap, Stripe webhooks, or RLS changes.

---

## STEP 2 — AIRPORT MAP (Zones Touched)

| Zone | Why | What Stays Out |
|------|-----|----------------|
| **Terminal** | Subdirectory READMEs improve navigation for humans/agents | No code changes |
| **Control Tower** | Archive is a form of operational hygiene | No webhook or automation logic |
| **Locks** | `database_schema_audit.md` and schema truth remain untouched | No RLS or migration edits |

**Zones NOT touched:** Security, Ticketing, Staff, Announcements, Baggage, Manifest.

---

## STEP 3 — DESIGN PROPOSALS

### Approach A — Minimal Overhaul (Recommended)

**Description:** Add missing subdirectory READMEs only. Archive a small, clearly superseded set. No path renames. No stub removal.

**Files to create:**
- `docs/contracts/README.md` — Wraps `INDEX.md`, explains Layer 2
- `docs/journeys/README.md` — Wraps `INDEX.md`, explains Layer 3
- `docs/diagrams/README.md` — Explains airport model + selective diagram use (per plan command)
- `docs/audits/README.md` — Entry point for audit reports
- `docs/tests/README.md` — Entry point for test matrices (e.g. `AUTH_BOOTSTRAP_TEST_MATRIX.md`)
- `docs/plans/README.md` — Entry point for design plans (e.g. Stripe orphaned customer)

**Files to archive (move to `docs/archive/`):**
- `docs/ORGANIZATION_SUMMARY.md` — Superseded by `DOCUMENTATION_INDEX.md` (same info, more current)
- `docs/GOLD_STANDARD_IMPLEMENTATION_COMPLETE.md` — One-off completion report; historical only
- `docs/BETA_TESTING_CHECKLIST.md` — Superseded by `qa/BETA_SMOKE_TEST_CHECKLIST_2026-03-05.md`
- `docs/COMPREHENSIVE_QA_CHECKLIST.md` — Overlaps with `development/PRE_PUSH_CHECKLIST.md` + qa runbooks; consolidate pointer in development README
- `docs/UI_UX_TESTING_GUIDE.md` — Overlaps with `audits/UI_UX_SCREENSHOT_REMEDIATION_REPORT` + qa runbooks; archive as historical

**Data model impact:** None.

**Risks:**
- Low: Any doc moved to archive may be linked from elsewhere; add redirect stubs if heavily referenced.
- Mitigation: Search repo for links before archiving; add minimal stubs in original location if needed.

**Respects:** Constitution, Airport boundaries, cursor command paths. No changes to plan/implement/Ship/pr flow.

---

### Approach B — Moderate Overhaul

**Description:** Everything in A, plus:
- Consolidate root-level auth stubs: keep stubs but ensure they all point to `archive/` or `contracts/`
- Move `docs/AUTH_*.md` stubs to `docs/archive/` and add a single `docs/AUTH_LEGACY_STUBS_INDEX.md` that forwards to archive
- Add `docs/README.md` at docs root explaining the 3-layer spine and cursor command flow

**Risks:**
- Medium: `DOCUMENTATION_INDEX.md` and `TOTL_PROJECT_CONTEXT_PROMPT.md` reference `AUTH_*.md` stubs; changing stub layout could break links.
- Mitigation: Keep stubs in place; do not remove. Only add `docs/README.md`.

**Respects:** Same as A. Slightly more churn.

---

### Approach C — Full Overhaul

**Description:** Everything in B, plus:
- Reorganize `DOCUMENTATION_INDEX.md` into a shorter "spine" + link to subdirectory READMEs for categories
- Audit every doc in `docs/` root and move into subdirs where logical (e.g. `AUTH_DATABASE_TRIGGER_CHECKLIST.md` → `security/` or `contracts/`)
- Create `docs/CURSOR_COMMANDS_REFERENCE.md` — single doc that maps each command to required reads

**Risks:**
- High: Mass path changes will break existing links in `TOTL_PROJECT_CONTEXT_PROMPT.md`, `AGENT_ONBOARDING.md`, `DOCUMENTATION_INDEX.md`, and possibly cursor rules.
- Mitigation: Would require a full link audit and update pass. Not recommended unless you have tooling to update all references.

**Respects:** Constitution, but introduces significant churn and regression risk for cursor commands.

---

## STEP 4 — ACCEPTANCE CRITERIA (Definition of Done)

### UI / Navigation
- [ ] Every `docs/*/` subdirectory with content has a README that explains purpose and links to key docs
- [ ] `docs/archive/README.md` remains the archive entry point
- [ ] `docs/DOCUMENTATION_INDEX.md` continues to list canonical entry points and Layer 1–3 spine

### Data Correctness
- [ ] No doc moves break cursor command required paths
- [ ] `database_schema_audit.md` path unchanged
- [ ] All archived docs are reachable from `docs/archive/README.md` or stub

### Permissions & Access Control
- [ ] N/A (docs only)

### Failure Cases (Must NOT Happen)
- [ ] `/plan` fails to find `docs/ARCHITECTURE_CONSTITUTION.md` or `docs/DOCUMENTATION_INDEX.md`
- [ ] `/plan` fails to find `docs/diagrams/airport-model.md`
- [ ] `/Ship` fails to find `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`
- [ ] `AGENT_ONBOARDING.md` or `TOTL_PROJECT_CONTEXT_PROMPT.md` references broken paths
- [ ] New READMEs contradict or override cursor command instructions

---

## STEP 5 — TEST PLAN

### Manual Test Steps
1. Run `/plan` with a dummy feature — verify it reads constitution, index, schema audit, airport model
2. Run `/Ship` (dry run) — verify it references `MVP_STATUS_NOTION.md` and `COMMON_ERRORS_QUICK_REFERENCE.md`
3. Open `docs/DOCUMENTATION_INDEX.md` — verify all linked paths resolve
4. Open each new subdirectory README — verify links resolve
5. Search repo for `ORGANIZATION_SUMMARY`, `GOLD_STANDARD`, `BETA_TESTING_CHECKLIST`, `COMPREHENSIVE_QA`, `UI_UX_TESTING` — update any references to new locations

### Automated Tests
- None required (docs-only). Optional: add a CI check that verifies `docs/ARCHITECTURE_CONSTITUTION.md`, `docs/DOCUMENTATION_INDEX.md`, `database_schema_audit.md` exist at expected paths.

### RED ZONE Regression
- N/A — no red zone changes.

---

## Summary: Recommended Approach

**Approach A** is recommended because:
- Adds subdirectory READMEs (your stated goal)
- Archives a small, clearly superseded set
- Preserves all cursor command paths
- Minimal risk of breaking `/plan` → `/implement` → `/Ship` → `/pr` flow
- No mass renames or moves that would require link audits

---

## STOP AND WAIT

Which approach should I implement (A / B / C), and are there any constraints or adjustments before coding?
