# TOTL Engineering Command System

**Date:** December 19, 2025  
**Status:** ✅ COMPLETE  
**Purpose:** Define the canonical Cursor command set (what each command does, when to use it, and what output shape to enforce).

---

## Where these commands live

- **Cursor command definitions**: `.cursor/commands/*.md`
- **Canonical architecture constraints**: `docs/ARCHITECTURE_CONSTITUTION.md` + `docs/diagrams/airport-model.md`

These command files are designed to be **copy/paste-safe operating doctrine** for both humans and agents.

---

## Core pipeline (the spine)

### `/plan`
- **Use when**: deciding what to build or fix
- **Mode**: design only (no code)
- **Output**: A/B/C approaches + risks + acceptance criteria + test plan

### `/implement`
- **Use when**: a `/plan` approach is explicitly approved
- **Mode**: implementation only (no scope expansion)
- **Output**: minimal diff, typed, explicit selects, deliverables + tests + doc updates

### `/verify`
- **Use when**: you want a go/no-go before committing
- **Mode**: execution
- **Output**: pass/fail summary + next action

### `/continue`
- **Use when**: you want the agent to keep making the best next roadmap-safe improvement without re-prompting
- **Mode**: execution
- **Output**: current thread resumed, smallest useful next win implemented, checks run, next continuation point
- **Hardening notes**:
  - continue the same active workstream already visible in the dirty tree when possible
  - prefer shared primitives / high-leverage cleanup over one-off tweaks
  - do not start commit/PR/release flows unless explicitly requested
  - avoid touching unrelated dirty files

### `/ship`
- **Use when**: code is complete and verified
- **Mode**: execution + docs hygiene
- **Output**: docs updated, intended files only staged, single commit, pushed to `develop`
- **Hardening notes**:
  - inspect dirty worktree before staging
  - do not blindly `git add -A`
  - use PowerShell-safe command execution
  - stop if git author identity is missing instead of changing git config automatically

### `/pr`
- **Use when**: ready to merge `develop` → `main`
- **Mode**: PR narrative creation
- **Output**: standardized PR body with risk + rollback
- **Hardening notes**:
  - check for an existing `develop` → `main` PR before creating one
  - update existing PRs instead of duplicating them
  - if `gh pr edit` fails due to GitHub GraphQL / Projects Classic issues, fall back to `gh api` REST PATCH
  - describe the actual `main...develop` branch delta honestly

---

## Guard-rail commands (when reality gets messy)

### `/triage`
- **Use when**: multiple fires / unclear priority
- **Mode**: analysis only
- **Output**: P0/P1/P2 list + airport zones + containment steps

### `/debug`
- **Use when**: unclear root cause
- **Mode**: design only
- **Output**: hypothesis tree + evidence checklist + minimal instrumentation plan

### `/redzone`
- **Use when**: touching middleware/auth/bootstrap/Stripe/RLS
- **Mode**: strict design → implement
- **Output**: current behavior shown, smallest diff plan, explicit loop/idempotency/RLS proof, regression checklist

### `/schema`
- **Use when**: migrations, RLS, triggers, enums, schema drift, types regen
- **Mode**: design → execution
- **Output**: migration created (new file), SQL summary, types regen + schema verification results

### `/docs-sync`
- **Use when**: behavior changed but you’re not ready to commit
- **Mode**: analysis
- **Output**: doc update checklist + paste-ready bullets

### `/playwright-smoke`
- **Use when**: auth/redirects/dashboards/roles changed
- **Mode**: execution
- **Output**: pass/fail per spec file + next step if failing
- **Hardening notes**:
  - run with `--project=chromium --reporter=list --workers=1` by default
  - distinguish feature failures from broader app/runtime boot failures

### `/release`
- **Use when**: PR is approved and you’re about to merge to `main`
- **Mode**: analysis
- **Output**: release notes + rollout/rollback + post-merge verification
- **Hardening notes**:
  - archive output under `docs/releasenotes/` to match the documentation spine

### `/retro`
- **Use when**: painful fix cycle or recurring bug
- **Mode**: reflection
- **Output**: lessons learned + what to standardize + doc update targets

---

## Non-negotiables these commands enforce

All commands assume and must respect:
- Middleware = allow/deny/redirect only
- No DB writes in client components
- All mutations via Server Actions or API routes
- No `select('*')` in app code (explicit columns)
- RLS is final authority
- Never edit `types/database.ts` manually
- Red Zone files require smallest-diff protocol

---

## How to add a new command safely

1. Add a new file in `.cursor/commands/` named `<command>.md`
2. Include:
   - command name (`/name`)
   - intent
   - mode restriction
   - required inputs/reading
   - exact output shape
3. If it touches Red Zone domains, embed the Red Zone protocol and require showing current code first.

---

## Current command files

- `.cursor/commands/plan.md`
- `.cursor/commands/continue.md`
- `.cursor/commands/implement.md`
- `.cursor/commands/Ship.md`
- `.cursor/commands/pr.md`
- `.cursor/commands/triage.md`
- `.cursor/commands/debug.md`
- `.cursor/commands/redzone.md`
- `.cursor/commands/verify.md`
- `.cursor/commands/playwright-smoke.md`
- `.cursor/commands/schema.md`
- `.cursor/commands/docs-sync.md`
- `.cursor/commands/release.md`
- `.cursor/commands/retro.md`
