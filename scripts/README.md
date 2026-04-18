# Scripts and verification commands

**Date:** April 18, 2026  
**Purpose:** Orient humans and agents to `package.json` scripts and key files in this folder. For Cursor command doctrine, see `docs/development/ENGINEERING_COMMANDS.md`.

## Canonical verification (npm)

| Script | Audience | What it does |
|--------|----------|----------------|
| `npm run verify-fast` | Daily dev | Import/guard scripts + `types:check` + `typecheck` + `lint` (no build) |
| `npm run pre-push:check` | Before push | Guards + `schema:verify:comprehensive` + `types:check` + **build** + `lint` + `audit:all` |
| `npm run verify-all` | Release / heavy CI parity | Guards + RLS guard + schema + types + type-safety + security + typecheck + lint + **build** |
| `npm run docs:verify-paths` | Docs / CI | Ensures Cursor-required doc paths still exist |
| `npm run typecheck` | All | `tsc --noEmit` |
| `npm run lint` | All | `next lint` |
| `npm run pre-commit` | Git hook | Runs `scripts/pre-commit-checks.ps1` |
| `npm run pre-commit:legacy` | Legacy | `schema:verify:comprehensive` + `lint` + `tsc` (narrower than `pre-commit`) |

## Guards and audits (node / PowerShell)

- **`guard:*`** — `scripts/guard-*.mjs` (select star, client writes, import paths, etc.)
- **`audit:*`** — `scripts/audit-*.mjs` and `audit-all`
- **`schema:*`** — schema drift vs migrations / types (`verify-schema-sync-comprehensive.mjs`, PowerShell helpers)

## When in doubt

1. Pre-push: `docs/PRE_PUSH_CHECKLIST.md` → `docs/development/PRE_PUSH_CHECKLIST.md`  
2. Architecture: `docs/ARCHITECTURE_CONSTITUTION.md`  
3. Command workflow: `docs/development/ENGINEERING_COMMANDS.md`
