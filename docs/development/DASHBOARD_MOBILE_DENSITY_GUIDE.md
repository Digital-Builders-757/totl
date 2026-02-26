# Dashboard Mobile Density Guide

**Date:** February 25, 2026  
**Status:** ✅ COMPLETE  
**Purpose:** Define a shared, mobile-first dashboard chrome pattern so dashboard surfaces do not become top-heavy or visually bloated.

## Scope

Apply this guide to all dashboard-like terminals (`/admin/*`, `/talent/*`, `/client/*`) when editing headers, nav, action bars, and above-the-fold content.

## Core Rules

- Keep mobile header compact: safe-area aware + 56px content row (`h-14`), not stacked multi-row nav.
- Use progressive disclosure: drawer for primary nav, overflow menu for secondary actions.
- Prioritize first meaningful content: users should see title + first content module on `390x844` without excessive chrome scroll.
- Keep iconography consistent: no emojis in persistent nav/buttons/badges; use one icon set and uniform size.
- Keep touch targets accessible: min `44px` tap height for interactive controls.

## Header Contract (Mobile)

- Top safe-area: `pt-[env(safe-area-inset-top)]` on the dashboard header container only.
- Header row: left drawer trigger, centered route title (truncate), right notifications + overflow.
- Do not add inline stats chips, tab rows, or multi-button action bars inside mobile header.

## Navigation Contract

- Drawer contains section navigation only.
- Do not introduce new data reads in header/drawer to compute badges or counts.
- Route authorization remains unchanged; nav visibility does not replace permission checks.

## Action Contract

- Keep one primary page action in content area (not in mobile header).
- Place settings and non-primary actions behind overflow menu on mobile.
- Avoid duplicate actions (same action in header + section + row menus).

## Information Density Contract

- Tighten top spacing before content (`py-4 sm:py-6` is preferred baseline for dashboard containers).
- Reduce heading size on mobile (`text-2xl`, optionally `sm:text-3xl`).
- Use compact status chips (`text-sm`, smaller horizontal padding).
- Prefer one badge emphasis per summary card on mobile.

## QA Checklist (Per Dashboard Route)

- No horizontal overflow at `390x844` and `360x800`.
- Header remains sticky and does not overlap content.
- Drawer trigger, drawer panel, and overflow trigger are keyboard and touch accessible.
- `data-testid` hooks exist for critical chrome controls on auth-protected dashboards.
- First content module appears above the fold on common iPhone viewport.

## Related Governance Docs

- `docs/UI_CONSTITUTION.md`
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/features/UI_VISUAL_LANGUAGE.md`

