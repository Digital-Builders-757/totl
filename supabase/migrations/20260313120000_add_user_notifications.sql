-- =====================================================
-- user_notifications table for in-app notification center
-- =====================================================
-- Purpose: Clean separation for application status notifications.
-- Insert on: talent applies → client; client accepts/rejects → talent.
-- Badge count = unread (read_at IS NULL). Page-load fetch only, no Realtime.
--
-- Idempotency: dedupe_key prevents duplicate notifications per event.
-- Payload: title, body, reference_id, type — no large JSON snapshots.

BEGIN;

-- Create notification type enum for type safety
CREATE TYPE public.notification_type AS ENUM (
  'new_application',      -- talent applied → notify client
  'application_accepted', -- client accepted → notify talent
  'application_rejected'   -- client rejected → notify talent
);

CREATE TABLE public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  reference_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Idempotency: one notification per (recipient, type, reference_id)
  UNIQUE (recipient_id, type, reference_id)
);

-- Indexes for badge count and list queries
CREATE INDEX user_notifications_recipient_read_at_idx
  ON public.user_notifications (recipient_id, read_at)
  WHERE read_at IS NULL;

CREATE INDEX user_notifications_recipient_created_at_idx
  ON public.user_notifications (recipient_id, created_at DESC);

COMMENT ON TABLE public.user_notifications IS 'In-app notifications for application status changes. Fetched on page load only.';
COMMENT ON COLUMN public.user_notifications.reference_id IS 'ID of the related entity (application_id, etc.)';
COMMENT ON COLUMN public.user_notifications.read_at IS 'When the recipient marked as read; NULL = unread';

-- RLS: users see only their own notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_notifications_select_own
  ON public.user_notifications
  FOR SELECT
  USING (recipient_id = auth.uid());

CREATE POLICY user_notifications_update_own
  ON public.user_notifications
  FOR UPDATE
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- INSERT is done server-side via service role or SECURITY DEFINER; no policy for client inserts.
-- Regular users never insert their own notifications.

COMMIT;
