# Profiles Contract (App identity + public/private profile surfaces)

**Date:** December 18, 2025  
**Status:** 🚧 IN PROGRESS  
**Purpose:** Define profile surfaces, canonical profile mutation paths, and which profile fields are allowed to be public.

---

## Layer 1 links
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/diagrams/role-surfaces.md`

---

## Routes involved (exact paths)

### Public profile surfaces
- `/talent/[slug]` (public talent profile page)

### Profile management (authenticated)
- `/settings`
- `/client/profile`
- `/talent/profile`

**UNVERIFIED:** whether `/profile` is used as a first-class route in current UI.

---

## Canonical server actions/services

### Profile mutations
- `app/settings/actions.ts`
  - `updateBasicProfile(formData)`
  - `updateEmail(newEmail)`
  - `changePassword(password)`
  - `upsertTalentProfile(payload)`
  - `upsertClientProfile(payload)`
  - `uploadAvatar(formData)`

### Profile bootstrap / repair
- `lib/actions/auth-actions.ts`
  - `ensureProfileExists()`

---

## Data model touched (tables / columns)

### `public.profiles`
- Observed in code:
  - `id`, `display_name`, `role`, `account_type`
  - `avatar_url`, `avatar_path`
  - `email_verified`
  - `bio`, `instagram_handle`, `website` (**present in generated types; usage in app is UNVERIFIED**)

### `public.talent_profiles`
- Observed: `user_id`, `first_name`, `last_name`, `phone`, `age`, `location`, `experience`, `portfolio_url`, and more optional fields.

### `public.client_profiles`
- Observed: `user_id`, `company_name`, `industry`, `website`, `contact_name`, `contact_email`, `contact_phone`, `company_size`.

### Storage
- Bucket: `avatars` (path format observed in `uploadAvatar`: `{userId}/avatar-{timestamp}.{ext}`)

---

## RLS expectations (intent)
- Users can update their own `profiles` row.
- Talent can upsert their own `talent_profiles` row.
- Client can upsert their own `client_profiles` row.
- Public access to talent profile surface should not expose sensitive columns (application must select safe fields).

**UNVERIFIED:** exact public policy and which columns are considered “safe”.

---

## Known failure modes

1) **Avatar upload succeeds but profile doesn’t update**
- Symptom: file exists in storage, UI still shows old avatar.
- Likely cause: storage upload succeeded but `profiles.avatar_path` update failed.

2) **Public profile leaks sensitive info**
- Symptom: anon can see phone/contact data.
- Likely cause: selecting too many columns under permissive RLS.

---

## Proof (acceptance + test steps)

### Acceptance checklist
- Talent can update their own profile + avatar.
- Client can update their own profile.
- Public `/talent/[slug]` renders without requiring auth.

### Tests
- Playwright: `tests/integration/talent-public-profile.spec.ts` (public profile surface).
- Manual: update profile in `/settings` and refresh.

---

## Related docs (reference)
- `docs/PROFILE_IMAGE_UPLOAD_SETUP.md` (should be reduced to a pointer once fully migrated)
- `docs/CLIENT_TALENT_VISIBILITY.md`
