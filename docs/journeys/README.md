# Journeys — Layer 3 Source of Truth

**Date:** March 11, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** User journeys define canonical acceptance tests and end-to-end flows. They are the Layer 3 source of truth.

## What this folder is

Journeys document **user-facing flows** as acceptance criteria: what a Talent, Client, or Admin experiences step-by-step. They complement contracts (Layer 2) by describing observable behavior rather than implementation details.

## When to use it

- When validating that a feature meets user expectations
- When writing or updating Playwright/e2e tests
- When `/plan` requires journey alignment for acceptance criteria

## Start here

- `INDEX.md` — Single index of all journey docs
- `TALENT_JOURNEY.md` — Talent flows (browse, apply, manage portfolio)
- `CLIENT_JOURNEY.md` — Client flows (post gigs, review applications, book talent)
- `ADMIN_JOURNEY.md` — Admin flows (moderation, user management, approvals)

## Do not put here

- Domain contracts (routes, server actions, RLS) → `contracts/`
- Implementation reports or PR summaries → `features/` or `audits/`
- QA runbooks or manual validation checklists → `qa/`
- Historical or superseded flows → `archive/`
