# Portfolio gallery — current behavior (April 2026)

This doc reflects **today’s** product and code. Older sections below are **historical**; the schema and UI have moved on (no persisted reorder or “featured” row in generated types).

---

## Current product behavior

- **Order:** Portfolio items load with **`created_at` descending** (newest first) in settings and in `getPortfolioItems`.
- **Upload:** Two-step flow — `requestPortfolioImageUpload` (signed upload URL) → browser uploads to Supabase Storage → `finalizePortfolioImage` inserts metadata. See `docs/contracts/PORTFOLIO_UPLOADS_CONTRACT.md`.
- **Gallery UI:** Static grid with edit/delete; **no** drag-to-reorder (there is no `display_order` in `types/database.ts` for `portfolio_items`).
- **Featured / primary:** Not implemented in the current schema; UI does not promise starring.

---

## Components (file map)

| File | Role |
|------|------|
| `components/portfolio/portfolio-upload.tsx` | Compress → signed upload → finalize; glass/OKLCH styling. |
| `components/portfolio/portfolio-gallery.tsx` | Grid, edit inline, delete; helper copy for newest-first order. |
| `components/portfolio/portfolio-preview.tsx` | Up to 6 thumbs + Settings link; same visual system (may be embedded later). |
| `app/settings/sections/portfolio-section.tsx` | Settings header, empty-state onboarding, tips (honest copy). |

---

## Server actions

**File:** `lib/actions/portfolio-actions.ts`

- `requestPortfolioImageUpload` / `finalizePortfolioImage` — upload pipeline  
- `deletePortfolioItem` — DB + storage cleanup for `userId/…` paths  
- `updatePortfolioItem` — title / caption / description  
- `getPortfolioItems` — fetch with public image URLs  

---

## Storage

- **Bucket:** `portfolio`  
- **Path pattern:** `{user_id}/portfolio-{timestamp}-{random}.{ext}`  
- **Formats:** JPEG, PNG, WebP (aligned with server validation)

---

## Historical notes (superseded)

Earlier iterations described `display_order`, `is_primary`, drag reorder, and `uploadPortfolioImage(FormData)` through Server Actions. Those are **not** the current implementation; see `types/database.ts` and the contract doc for truth.
