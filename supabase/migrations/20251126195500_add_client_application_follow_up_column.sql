-- Track follow-up reminder emails for client applications
-- Ensures we only send "still reviewing" automations once per application

ALTER TABLE public.client_applications
  ADD COLUMN IF NOT EXISTS follow_up_sent_at TIMESTAMPTZ;

