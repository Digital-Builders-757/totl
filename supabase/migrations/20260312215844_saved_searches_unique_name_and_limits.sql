-- Prevent duplicate saved search names per user.
-- Users can have multiple saved searches but not two with the same name.

CREATE UNIQUE INDEX IF NOT EXISTS saved_searches_user_id_name_key
  ON public.saved_searches (user_id, name);

COMMENT ON INDEX public.saved_searches_user_id_name_key IS
  'Prevents duplicate saved search names per user';
