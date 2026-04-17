-- =====================================================
-- TOTL Agency - Repair FKs that can block auth.users delete
-- =====================================================
-- Date (UTC): 2026-04-14
-- Why:
--   Admin hard-delete calls auth.admin.deleteUser(), which deletes auth.users and
--   relies on ON DELETE CASCADE / SET NULL through public.* tables.
-- Problem:
--   Environments that created public.content_flags before 2025-12-04, or where
--   CREATE TABLE IF NOT EXISTS later skipped constraint fixes, may still have
--   content_flags.assigned_admin_id -> profiles(id) without ON DELETE SET NULL.
--   Then rows with assigned_admin_id = the deleted talent block the cascade.
-- Fix:
--   Idempotently re-apply the intended FK definitions for content_flags and
--   gig_notifications (defensive; matches 20251204150904_add_cascade_delete_constraints).

BEGIN;

-- content_flags: reporter cascades with profile; assigned admin clears on delete
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'content_flags'
  ) THEN
    ALTER TABLE public.content_flags
      DROP CONSTRAINT IF EXISTS content_flags_reporter_id_fkey;
    ALTER TABLE public.content_flags
      ADD CONSTRAINT content_flags_reporter_id_fkey
        FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.content_flags
      DROP CONSTRAINT IF EXISTS content_flags_assigned_admin_id_fkey;
    ALTER TABLE public.content_flags
      ADD CONSTRAINT content_flags_assigned_admin_id_fkey
        FOREIGN KEY (assigned_admin_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- gig_notifications.user_id -> auth.users (direct)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'gig_notifications'
  ) THEN
    ALTER TABLE public.gig_notifications
      DROP CONSTRAINT IF EXISTS gig_notifications_user_id_fkey;
    ALTER TABLE public.gig_notifications
      ADD CONSTRAINT gig_notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
