# Contracts — Layer 2 Source of Truth

**Date:** March 11, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Domain contracts define canonical behavior for routes, server actions, tables, and RLS. They are the Layer 2 source of truth.

## What this folder is

Domain contracts document the **intended behavior** of a subsystem: which routes exist, which server actions/services are canonical, which tables/columns are used, and what RLS expects. Contracts are authoritative; implementation docs must align with them.

## When to use it

- Before changing routes, server actions, or queries in a domain (auth, gigs, applications, bookings, etc.)
- When `/plan` or `/implement` requires contract alignment
- When resolving "who owns this behavior?" or "what is the canonical path?"

## Start here

- `INDEX.md` — Single index of all contract docs
- `AUTH_BOOTSTRAP_ONBOARDING_CONTRACT.md` — Auth bootstrap, routing-safe states, recovery invariants
- `PROFILES_CONTRACT.md` — Profile structure and role promotion
- `GIGS_CONTRACT.md` — Gig lifecycle and access
- `APPLICATIONS_CONTRACT.md` — Application flow and status
- `BOOKINGS_CONTRACT.md` — Booking lifecycle
- `ADMIN_CONTRACT.md` — Admin capabilities and setup

## Do not put here

- Implementation summaries or "how we fixed X" reports → `features/` or `audits/`
- Historical analyses or superseded plans → `archive/`
- User-facing journey flows (acceptance tests) → `journeys/`
- One-off design plans → `plans/`
