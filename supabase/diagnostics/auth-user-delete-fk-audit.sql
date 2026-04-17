-- Run in Supabase SQL Editor (read-only audit) when auth.admin.deleteUser returns
-- "Database error deleting user" or 23503 in Postgres logs.
--
-- 1) Foreign keys referencing auth.users: check DELETE_RULE (CASCADE vs RESTRICT/NO ACTION)
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'auth'
  AND ccu.table_name = 'users'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 2) Foreign keys referencing public.profiles(id) (sample of delete behavior)
SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_schema = 'public'
  AND ccu.table_name = 'profiles'
  AND ccu.column_name = 'id'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 3) Per-user row counts (paste a profiles.id / auth user id)
-- SELECT count(*) AS content_flags_assigned_admin FROM public.content_flags WHERE assigned_admin_id = 'PASTE_UUID_HERE';
-- SELECT count(*) AS content_flags_reporter FROM public.content_flags WHERE reporter_id = 'PASTE_UUID_HERE';
