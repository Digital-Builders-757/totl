# UI Layout Contract (Terminal Kit)

**Status:** ✅ CANONICAL (Terminal / UI)

Purpose: Prevent layout drift by enforcing a small set of reusable, presentational wrappers for pages, headers, sections, tables, and common UI states.

## Applicability (MANDATORY)

This contract applies to:
- **All new pages** under `/app/**`
- **Any existing page touched** for layout/spacing/visual changes

If a file renders a full-screen page (not just a modal), it **MUST** use `PageShell`.

## Components (canonical)

- `components/layout/page-shell.tsx` (`PageShell`)
  - Owns: page background + container padding rhythm
  - Rule: **never** applies global `overflow-x-hidden`
  - Default top padding matches the main navbar (`pt-20 sm:pt-24`)
  - Header rule:
    - If a page has a primary title, it **MUST** render a `PageHeader` as the first child within `PageShell` content.
- `components/layout/page-header.tsx` (`PageHeader`)
  - Owns: title/subtitle/actions layout + typography ladder
  - Supports optional breadcrumbs slot
- `components/layout/section-card.tsx` (`SectionCard`)
  - Canonical “panel” surface using TOTL premium primitives (`panel-frosted`, `card-backlit`)
  - Mobile-first padding default: `p-4 sm:p-6`
- `components/layout/data-table-shell.tsx` (`DataTableShell`)
  - Canonical table wrapper: `overflow-x-auto` + consistent border/surface
- `components/layout/page-loading.tsx` (`PageLoading`)
  - Canonical loading skeleton layout
- `components/layout/empty-state.tsx` (`EmptyState`)
  - Canonical empty state (icon + title + optional action)
- `components/ui/media-thumb.tsx` (`MediaThumb`)
  - Presentational only (no data access or hooks)
  - Variants: `talent` (aspect 4/5), `gig` (aspect-video), `avatar` (square)
  - Row anatomy rule (applications): thumb → title/meta → status → one next action
  - Accept/reject stays in overflow unless it is the primary action

## Spacing rhythm (defaults)

- Page container: `px-4 sm:px-6 lg:px-8`
- Page vertical padding: `py-6 sm:py-10`
- Section gaps: `space-y-6`
- Card padding: `p-4 sm:p-6`

## Typography ladder (defaults)

- H1: `text-2xl sm:text-3xl font-semibold tracking-tight`
- Body: `text-sm sm:text-base`
- Muted: `text-[var(--oklch-text-secondary)]`
- Labels: `text-xs uppercase tracking-wide`

## Mobile safety rules (non-negotiable)

- Long tokens (UUID/email/url) are **NOT allowed** to be rendered as raw text:
  - **MUST** use `components/ui/long-token.tsx` (`LongToken`)
  - Applies to: **IDs**, **emails**, **URLs**, **Stripe IDs**, and other external references
- Flex label/value rows must allow shrink:
  - Apply `min-w-0` to the text container when paired with right-side metadata/actions
- Tables must be wrapped:
  - “Table” includes:
    - `<table>` elements
    - Grid-based data layouts with more than 3 columns
    - Admin lists intended to scroll horizontally on mobile
  - Put tables inside `DataTableShell` (or an equivalent `overflow-x-auto` wrapper)

## Layout contract adoption checklist (for PRs)

- [ ] New/changed page uses `PageShell`
- [ ] Page title uses `PageHeader` (first child of the page content)
- [ ] Tables/grids-as-tables use `DataTableShell`
- [ ] Empty states use `components/layout/empty-state.tsx` (`EmptyState`)
- [ ] Loading states use `components/layout/page-loading.tsx` (`PageLoading`) or an existing route `loading.tsx` that matches the contract
- [ ] Long tokens use `LongToken` (no raw UUID/email/url rendering)
- [ ] Mobile overflow sentinel remains green

## Anti-patterns (DO NOT DO)

- Do not add `overflow-x-hidden` to:
  - `html`, `body`
  - `PageShell`
  - shared layout wrappers
- Do not invent new page-level wrappers outside `components/layout/`
- Do not apply ad-hoc spacing to page roots (`mt-*`, `px-*`, `pt-*`) instead of using the kit
- Do not render UUIDs/emails/URLs without `LongToken`

