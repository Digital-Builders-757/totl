# Audits — Audit Reports and Implementation Summaries

**Date:** March 11, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Evidence-based audit reports, policy decisions, and implementation summaries. Used for compliance verification and remediation tracking.

## What this folder is

Audits document **proven state** at a point in time: what was audited, what was found, and what was fixed. They support quality gates, foundation PR status, and drift/duplicate remediation.

## When to use it

- When verifying compliance with contracts, constitutions, or policies
- When investigating "what was the state when we shipped X?"
- When planning remediation for drift or duplicate primitives

## Start here

- `AUDIT_STATUS_REPORT.md` — Evidence-based repo audit snapshot (quality gates, foundation PR status, journey QA)
- `AUDIT_MASTER_BOARD.md` — Rolling one-screen audit queue (IDs + proof hooks + next actions)
- `AUDIT_LOG.md` — Append-only audit proof ledger (timestamped command receipts)
- `AUTH_REDIRECT_END_TO_END_AUDIT.md` — Login → redirect pipeline audit
- `UI_UX_SCREENSHOT_REMEDIATION_REPORT_2026-03-03.md` — Screenshot-driven MVP UI/UX remediation
- `AUDIT_POLICY_DECISIONS.md` — Policy decisions from audits

## Do not put here

- Domain contracts (canonical behavior) → `contracts/`
- User journeys (acceptance flows) → `journeys/`
- Design plans before implementation → `plans/`
- Historical or superseded audits → `archive/`
