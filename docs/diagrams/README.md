# Diagrams — Architecture Visual Documentation

**Date:** March 11, 2026  
**Status:** ✅ ACTIVE  
**Purpose:** Architecture diagrams and the Airport Model. Required by `/plan` and `/implement` for feature scoping.

## What this folder is

Diagrams provide the **canonical mental model** for the system. The Airport Model (`airport-model.md`) is always required. Other diagrams are used selectively based on feature scope (auth, UI, server actions, gigs/applications/bookings).

## When to use it

- **Always:** Read `airport-model.md` before any `/plan` or `/implement`
- Security / auth / redirects / bootstrap → `signup-bootstrap-flow.md`
- UI pages, dashboards, role-specific features → `role-surfaces.md`
- Server Actions, API routes, integrations → `infrastructure-flow.md`
- Gigs / applications / bookings lifecycle → `core-transaction-sequence.md`
- Deep debugging or system-wide refactor only → `system-map-full.md` (keep path immutable; treat as legacy/rarely used)

## Start here

- `airport-model.md` — **Required** — Canonical zones (Security, Terminal, Staff, Ticketing, etc.)
- `signup-bootstrap-flow.md` — Auth bootstrap, profile creation, safe routes
- `role-surfaces.md` — Role-specific UI and dashboards
- `infrastructure-flow.md` — Server actions and API routes
- `core-transaction-sequence.md` — Gig → application → booking flow
- `system-map-full.md` — Full system map (use only for deep debugging; do not default to this)

## Do not put here

- Domain contracts or journey flows → `contracts/` or `journeys/`
- Implementation summaries or audit reports → `features/` or `audits/`
- Screenshots or UI remediation matrices → `audits/`
