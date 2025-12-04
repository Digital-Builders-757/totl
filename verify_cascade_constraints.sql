-- Verification Query: Check all CASCADE constraints are applied
-- Run this in Supabase Dashboard SQL Editor to verify the migration

SELECT
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  rc.delete_rule,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'profiles', 
    'talent_profiles', 
    'client_profiles', 
    'applications', 
    'bookings', 
    'portfolio_items', 
    'gigs', 
    'gig_notifications',
    'content_flags'
  )
ORDER BY tc.table_name, tc.constraint_name;

