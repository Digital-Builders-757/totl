# Tests — Test Documentation and Matrices

**Date:** March 11, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Test matrices and proof ledgers that map contract scenarios to Playwright/e2e coverage. Used for auth/bootstrap and other critical path verification.

## What this folder is

Test docs provide **scenario-to-proof ledgers**: which contract scenarios are covered by which specs, and what evidence exists for each. They bridge contracts (Layer 2) and automated tests.

## When to use it

- When adding or updating auth/bootstrap tests
- When verifying that a contract scenario has Playwright coverage
- When `/plan` or `/implement` requires test matrix alignment

## Start here

- `AUTH_BOOTSTRAP_TEST_MATRIX.md` — Proof ledger mapping Auth contract scenarios → Playwright coverage

## Do not put here

- QA runbooks, manual validation checklists, or beta execution docs → `qa/`
- Domain contracts or journeys → `contracts/` or `journeys/`
- Implementation summaries or audit reports → `features/` or `audits/`
