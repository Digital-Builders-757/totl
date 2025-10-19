-- Monitor YOUR Application's Slow Queries
-- Run this in Supabase SQL Editor to see actual application performance
-- This filters out Supabase Dashboard queries and shows only your app's queries

SELECT 
  substring(query, 1, 150) as query_preview,
  rolname as database_role,
  calls,
  round(mean_exec_time::numeric, 2) as mean_time_ms,
  round(total_exec_time::numeric, 2) as total_time_ms,
  rows as rows_returned,
  round((100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0))::numeric, 2) as cache_hit_rate_percent
FROM pg_stat_statements pss
JOIN pg_roles r ON pss.userid = r.oid
WHERE 
  -- Only show application queries (not dashboard/system queries)
  rolname IN ('authenticated', 'anon', 'service_role')
  
  -- Exclude monitoring queries themselves
  AND query NOT LIKE '%pg_stat_statements%'
  
  -- Exclude Supabase internal queries
  AND query NOT LIKE '%pg_catalog%'
  AND query NOT LIKE '%information_schema%'
  AND query NOT LIKE '%pg_type%'
  AND query NOT LIKE '%pg_class%'
  AND query NOT LIKE '%pg_namespace%'
  
  -- Only queries with significant usage
  AND calls > 5
  
ORDER BY mean_exec_time DESC
LIMIT 30;

-- Additional query to see most frequently called queries
-- Uncomment to run:
/*
SELECT 
  substring(query, 1, 150) as query_preview,
  rolname as database_role,
  calls,
  round(mean_exec_time::numeric, 2) as mean_time_ms,
  round((100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0))::numeric, 2) as cache_hit_rate_percent
FROM pg_stat_statements pss
JOIN pg_roles r ON pss.userid = r.oid
WHERE 
  rolname IN ('authenticated', 'anon', 'service_role')
  AND query NOT LIKE '%pg_stat_statements%'
  AND query NOT LIKE '%pg_catalog%'
ORDER BY calls DESC
LIMIT 30;
*/

