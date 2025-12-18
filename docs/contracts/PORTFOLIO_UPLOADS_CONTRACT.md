# Portfolio + Uploads Contract

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define how talent uploads portfolio items and avatars, and the storage/RLS expectations.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/infrastructure-flow.md`

---

## Routes involved (exact paths)
- `/settings` (avatar + profile management)
- `/talent/dashboard` (portfolio surfaces)
- `/talent/[slug]` (public portfolio display)

---

## Canonical server actions/services
- `lib/actions/portfolio-actions.ts`
  - `uploadPortfolioImage(formData)`
  - `deletePortfolioItem(portfolioItemId)`
  - `updatePortfolioItem(...)`

- `app/settings/actions.ts`
  - `uploadAvatar(formData)`

---

## Data model touched
- Table: `public.portfolio_items`
  - Observed columns: `id`, `talent_id`, `title`, `description`, `caption`, `image_url`, timestamps.
- Storage buckets:
  - `portfolio` (paths like `{userId}/portfolio-{timestamp}-{random}.{ext}`)
  - `avatars` (paths like `{userId}/avatar-{timestamp}.{ext}`)

---

## RLS expectations (intent)
- Authenticated talent can insert/update/delete their own `portfolio_items`.
- Public can read portfolio items if portfolio surface is public.

**UNVERIFIED:** exact storage bucket RLS policies.

---

## Known failure modes
- Upload succeeds to storage but insert fails → rollback should delete the uploaded file.
- Schema drift: code comments indicate removed fields; verify against generated types.

---

## Proof (acceptance + test steps)
- Talent uploads a portfolio image → item appears.
- Talent deletes item → item removed.

---

## Related docs (reference)
- `docs/PORTFOLIO_GALLERY_IMPLEMENTATION.md`
- `docs/PROFILE_IMAGE_UPLOAD_SETUP.md`
- `docs/AVATAR_UPLOAD_FIX.md`
