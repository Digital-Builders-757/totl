-- New-member admin in-app notifications + onboarding email idempotency columns
--
-- 1) Extends notification_type for talent signup alerts to admin recipients (user_notifications).
-- 2) Adds profile timestamps so welcome + admin alert emails send at most once (app layer).
-- 3) AFTER INSERT on profiles: one in-app row per admin (idempotent).

BEGIN;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_member_signup';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_new_member_email_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.welcome_email_sent_at IS
  'Timestamp when post-verification welcome email was sent; NULL = not sent yet.';
COMMENT ON COLUMN public.profiles.admin_new_member_email_sent_at IS
  'Timestamp when ADMIN_EMAIL new-member alert was sent for this account; NULL = not sent yet.';

-- Existing talent: do not send historical blast on deploy
UPDATE public.profiles
SET
  welcome_email_sent_at = COALESCE(welcome_email_sent_at, now()),
  admin_new_member_email_sent_at = COALESCE(admin_new_member_email_sent_at, now())
WHERE role = 'talent'::public.user_role;

CREATE OR REPLACE FUNCTION public.notify_admins_new_talent_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  member_email text;
  body_text text;
BEGIN
  IF NEW.role IS DISTINCT FROM 'talent'::public.user_role THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT u.email INTO member_email FROM auth.users u WHERE u.id = NEW.id LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    member_email := NULL;
  END;

  body_text := COALESCE(NEW.display_name, 'A new member') || ' registered as talent.';
  IF member_email IS NOT NULL AND member_email <> '' THEN
    body_text := body_text || ' Email: ' || member_email || '.';
  END IF;
  body_text := body_text || ' Review in Admin → Users.';

  INSERT INTO public.user_notifications (recipient_id, type, reference_id, title, body)
  SELECT
    p.id,
    'new_member_signup'::public.notification_type,
    NEW.id,
    'New member joined',
    body_text
  FROM public.profiles p
  WHERE p.role = 'admin'::public.user_role
  ON CONFLICT (recipient_id, type, reference_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'notify_admins_new_talent_signup: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_notify_admins_on_talent_insert ON public.profiles;
CREATE TRIGGER profiles_notify_admins_on_talent_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_talent_signup();

COMMENT ON FUNCTION public.notify_admins_new_talent_signup() IS
  'Creates one in-app notification per admin when a new talent profiles row is inserted.';

COMMIT;
