-- =====================================================
-- TOTL Agency - Add profiles.avatar_path (fix local schema drift)
-- =====================================================
-- Date: December 20, 2025
-- Purpose:
--   The app/types expect `public.profiles.avatar_path` to exist (storage object path).
--   Local schema created from migrations lacked this column, causing:
--     SQLSTATE 42703: column "avatar_path" of relation "profiles" does not exist
--
-- Notes:
--   - Minimal, additive, safe.
--   - Uses IF NOT EXISTS so environments that already have the column won't fail.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path text;

COMMIT;


