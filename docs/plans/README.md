# Plans — Design Plans and Implementation Summaries

**Date:** March 11, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Design plans and implementation summaries for specific features or fixes. Used when a change requires a documented plan before coding.

## What this folder is

Plans document **design decisions and implementation approaches** for targeted work (e.g. Stripe webhook orphaned customer handling). They are design-only or design-then-implement artifacts, not ongoing contracts.

## When to use it

- When a feature or fix requires a documented plan before `/implement`
- When referencing "how we decided to handle X" for Stripe, webhooks, or similar
- When the plan is scoped to a specific subsystem (not system-wide)

## Start here

- `TOTL_CATCHUP_ROADMAP.md` — Current execution order for the next TOTL improvement batches
- `STRIPE_WEBHOOK_ORPHANED_CUSTOMER_PLAN.md` — Design plan for orphaned Stripe webhook events
- `STRIPE_WEBHOOK_ORPHANED_CUSTOMER_IMPLEMENTATION.md` — Implementation summary for orphaned customer handling

## Do not put here

- Domain contracts (canonical behavior) → `contracts/`
- User journeys (acceptance flows) → `journeys/`
- Audit reports or compliance summaries → `audits/`
- Completed/superseded plans → `archive/`
