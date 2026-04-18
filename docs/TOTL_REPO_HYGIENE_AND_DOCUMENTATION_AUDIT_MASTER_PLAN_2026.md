# TOTL Repo Hygiene and Documentation Audit — Master Plan (2026)

**Date:** April 18, 2026  
**Status:** Completed (see §9–§10)  
**Purpose:** Single ledger for the 2026 maintainability pass: code hygiene, documentation hygiene, validation, and deferred work. Does not replace the documentation spine (`DOCUMENTATION_INDEX.md`, `DOCS_OVERHAUL_PLAN_2026.md`, `ARCHITECTURE_CONSTITUTION.md`).

---

## 1. Audit summary

Focused pass to reduce root clutter, fix high-confidence documentation path drift, clarify tooling entrypoints, and document ESLint dual-config behavior — without auth/middleware/RLS/Stripe changes. Canonical paths from `DOCS_OVERHAUL_PLAN_2026.md` were preserved.

---

## 2. Current repo hygiene risks (at start of pass)

| Risk | Severity | Notes |
|------|----------|--------|
| Untracked `.pr-body-*.md` at repo root | Low | PR description scratch files; clutter and accidental commit risk |
| `.git-commit-msg.txt` at root | Low | Stale one-off commit message; not part of documented workflow |
| `.eslintrc.js` + `.eslintrc.json` coexisting | **Medium** | ESLint loads **only** `.eslintrc.js`; stricter rules in `.eslintrc.json` were effectively orphaned (documented; adoption deferred) |
| `package.json` name `my-v0-project` | Low | Cosmetic drift from product name; deferred |

---

## 3. Current docs hygiene risks (at start of pass)

| Risk | Severity | Notes |
|------|----------|--------|
| `docs/PRE_PUSH_CHECKLIST.md` linked from many places but missing | **High** | Canonical body lives in `docs/development/PRE_PUSH_CHECKLIST.md` |
| `DOCUMENTATION_INDEX.md` listed `ENGINEERING_COMMANDS.md` as if at `docs/` root | Medium | File lives at `docs/development/ENGINEERING_COMMANDS.md` |
| `.cursorrules` duplicate “FORBIDDEN PATTERNS” and broken markdown fences | Low | Reader trust / parsing noise |
| README / AGENT_ONBOARDING version strings vs `package.json` | Low | Next.js patch version drift |

---

## 4. Source-of-truth constraints

- **Immutable for Cursor/commands** (do not rename/move/delete without full link audit):  
  `docs/DOCUMENTATION_INDEX.md`, `docs/ARCHITECTURE_CONSTITUTION.md`, `docs/DOCS_OVERHAUL_PLAN_2026.md`, `database_schema_audit.md`, `TOTL_PROJECT_CONTEXT_PROMPT.md`, `.cursorrules`, and paths listed under “Cursor Command Dependencies” in `DOCS_OVERHAUL_PLAN_2026.md`.
- **Red zone:** No middleware/auth/RLS/Stripe webhook churn per `ARCHITECTURE_CONSTITUTION.md`.
- **Migrations / generated types:** Not touched in this pass.

---

## 5. Cleanup priorities

| Priority | Item | Action taken |
|----------|------|----------------|
| P0 | Missing `docs/PRE_PUSH_CHECKLIST.md` | Added thin stub pointing to `docs/development/PRE_PUSH_CHECKLIST.md` |
| P0 | Root `.pr-body-*.md` | Deleted; `.gitignore` pattern added |
| P1 | ENGINEERING_COMMANDS path in index | Corrected to `development/ENGINEERING_COMMANDS.md` |
| P1 | ESLint dual-config clarity | Comment on `.eslintrc.js`; deferred merge of `.eslintrc.json` rules |
| P1 | Scripts discoverability | Added `scripts/README.md` |
| P2 | `.cursorrules` markdown hygiene | Merged duplicate headings; fixed code fences |
| P2 | `.git-commit-msg.txt` | Deleted (stale artifact) |
| P2 | Onboarding / README drift | Aligned Next.js version and root-doc list |

---

## 6. Exact files / areas reviewed

- Root: `.pr-body-*.md`, `.gitignore`, `.git-commit-msg.txt`, `.eslintrc.js`, `.eslintrc.json`, `README.md`, `package.json`, `AGENT_ONBOARDING.md`
- Docs spine: `docs/DOCUMENTATION_INDEX.md`, `docs/development/PRE_PUSH_CHECKLIST.md`, `docs/development/ENGINEERING_COMMANDS.md`, `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` (PRE_PUSH references)
- Automation: `scripts/verify-doc-paths.mjs`, `package.json` scripts
- Governance: `.cursorrules`, `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` (ESLint line)

---

## 7. Definition of done

- [x] Master plan file created and filled out  
- [x] Repo root cleaner (PR body artifacts, stale commit msg)  
- [x] `docs/PRE_PUSH_CHECKLIST.md` resolves for all existing links  
- [x] Documentation index corrected for ENGINEERING_COMMANDS  
- [x] Scripts entrypoint documented  
- [x] Onboarding + README factual alignment (where touched)  
- [x] `npm run typecheck`, `npm run lint`, `npm run docs:verify-paths` recorded  
- [x] Open follow-ups explicitly listed (§8)  

---

## 8. Deferred follow-ups

1. **ESLint:** Merge `.eslintrc.json` stricter rules into the active config (or make `.eslintrc.js` `extends: ['./.eslintrc.json']` and fix the resulting violations in a dedicated PR). Today only `.eslintrc.js` is loaded when both files exist.
2. **`package.json` `name`:** Consider renaming `my-v0-project` → `totl-agency` (coordination with any tooling assumptions).
3. **Mass doc path audit:** Run link checker across `docs/` for historical `docs/*.md` paths that moved under `guides/`, `features/`, or `troubleshooting/`; fix or add stubs incrementally.
4. **`next lint` deprecation:** Next.js 16 migration note in `ENGINEERING_COMMANDS` or dev README when upgrading.

---

## 9. Validation results

| Command | Result | Date |
|---------|--------|------|
| `npm run typecheck` | Pass (`tsc --noEmit`) | 2026-04-18 |
| `npm run lint` | Pass (`next lint`, no warnings/errors) | 2026-04-18 |
| `npm run docs:verify-paths` | Pass (7 required paths, including new `docs/PRE_PUSH_CHECKLIST.md`) | 2026-04-18 |
| `npm run build` | Pass (`next build`) — full `/Ship` run, 2026-04-18 | 2026-04-18 |

---

## 10. Final repo-state summary

Root clutter from untracked PR-body scratch files and a stale `.git-commit-msg.txt` is removed, with `.pr-body-*.md` ignored going forward. The long-standing broken link target `docs/PRE_PUSH_CHECKLIST.md` now exists as a stub that points at the canonical `docs/development/PRE_PUSH_CHECKLIST.md`, and `docs:verify-paths` enforces that stub so regressions are caught in CI. The documentation index lists `development/ENGINEERING_COMMANDS.md` correctly and links this audit ledger for maintenance context. `scripts/README.md` plus a small table in `ENGINEERING_COMMANDS.md` clarify which npm scripts are for fast vs full verification. `.cursorrules` is cleaned up (duplicate sections, broken fences, erroneous outer wrapper) and aligned with current Next versioning practice. ESLint behavior is unchanged for CI (still `.eslintrc.js`); the dual-file situation is documented in this plan, `ARCHITECTURE_SOURCE_OF_TRUTH.md`, and a comment on `.eslintrc.js`. The repo is in a **materially cleaner and more trustworthy** state for onboarding and hygiene follow-ups without product behavior changes.
