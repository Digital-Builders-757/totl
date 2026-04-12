# Portfolio uploads contract

**Last updated:** April 12, 2026  
**Status:** Current  
**Purpose:** How talent portfolio images are uploaded, stored, and recorded in `portfolio_items`.

---

## Layer 1 links

- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`

---

## Routes

- `/settings` — talent portfolio management (gallery + upload)

---

## Canonical server actions

**File:** `lib/actions/portfolio-actions.ts`

| Action | Role |
|--------|------|
| `requestPortfolioImageUpload({ contentType, byteSize })` | Auth, validate intent, build path `{userId}/portfolio-{ts}-{rand}.{ext}`, call Storage `createSignedUploadUrl`, return `{ path, token }` for the browser client. |
| `finalizePortfolioImage({ path, title, description, caption })` | Auth, confirm `path` is under the caller’s `userId/`, list folder to verify the object exists, `insert` into `portfolio_items` with `image_url: path`. On insert failure, `remove` the object from Storage. |
| `deletePortfolioItem(id)` | Delete row; remove Storage object when `image_url` is under the user’s prefix. |
| `updatePortfolioItem(id, updates)` | Metadata only. |
| `getPortfolioItems(talentId)` | Select explicit columns; order `created_at` **descending**; map `image_url` path → public URL via `publicBucketUrl`. |

**Removed / not in schema:** drag reorder and “featured” primary image are not persisted (no `display_order` / `is_primary` in generated `types/database.ts`).

---

## Client flow (direct to Storage)

1. User picks a file; client validates type/size and runs `browser-image-compression` (same limits as server: JPEG/PNG/WebP, 10MB max before compression).
2. `requestPortfolioImageUpload` (Server Action) returns `path` + `token`.
3. Browser `createSupabaseBrowser()` → `storage.from('portfolio').uploadToSignedUrl(path, token, file, { contentType })`.
4. On success, `finalizePortfolioImage` (Server Action) inserts metadata only.

**Why:** Avoids sending large file bodies through Next.js Server Actions; keeps a single metadata write after Storage succeeds.

---

## Data model

**Table:** `public.portfolio_items`  
**Columns (generated types):** `id`, `talent_id`, `title`, `description`, `caption`, `image_url`, `created_at`, `updated_at`.

**Storage:** bucket `portfolio`, paths `{user_id}/portfolio-{timestamp}-{random}.{ext}`.

---

## RLS and Storage

- **DB:** Talent can insert/update/delete own rows (existing policies).
- **Storage:** Authenticated users can upload/update/delete objects under their prefix; public read on `portfolio` bucket (see migration `20260314031246_ensure_portfolio_bucket_exists.sql`).

`createSignedUploadUrl` requires insert permission on `storage.objects` for the bucket; `uploadToSignedUrl` uses the returned token.

---

## Failure modes and rollback

| Scenario | Behavior |
|----------|----------|
| Signed URL step fails | No Storage write; user sees error from `requestPortfolioImageUpload`. |
| `uploadToSignedUrl` fails | No DB row; user retries upload. |
| DB insert fails after Storage success | `finalizePortfolioImage` deletes the new object at `path` and returns an error. |
| Delete portfolio item | Row removed; Storage object removed when path is under `user.id/`. |

---

## Proof (manual)

1. Talent uploads an image → item appears in gallery (newest first).
2. Talent deletes item → row and storage object gone (verify in Storage UI if needed).
3. Network tab: image bytes go to Supabase Storage, not to the Server Action body.

---

## Related docs

- `docs/features/PORTFOLIO_GALLERY_IMPLEMENTATION.md` — UI overview (keep in sync with this contract).
- `next.config.mjs` — `serverActions.bodySizeLimit` may still be raised for other flows (e.g. gigs); portfolio no longer depends on large action bodies for the image bytes.
