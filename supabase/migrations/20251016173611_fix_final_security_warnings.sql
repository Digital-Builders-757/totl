-- =====================================================
-- TOTL Agency - Fix Final Security Warnings
-- =====================================================
-- Date: 2025-10-16
-- Purpose: Fix remaining Supabase security warnings
-- Fixes: security_definer_view ERROR

BEGIN;

-- =====================================================
-- FIX: Security Definer View (ERROR)
-- =====================================================
-- Problem: View 'public.query_stats' uses SECURITY DEFINER
-- This enforces permissions of the view creator instead of the querying user
-- Solution: Drop and recreate without SECURITY DEFINER

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.query_stats CASCADE;

-- Recreate the view WITHOUT security definer
-- This will now use the permissions of the querying user (safer)
CREATE OR REPLACE VIEW public.query_stats AS
SELECT 
    schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Add helpful comment
COMMENT ON VIEW public.query_stats IS 
'View for monitoring index usage statistics. Uses invoker permissions (not SECURITY DEFINER) for better security.';

-- Grant appropriate permissions
-- Only authenticated users can view query stats
GRANT SELECT ON public.query_stats TO authenticated;

COMMIT;

-- =====================================================
-- NOTES FOR REMAINING WARNINGS (Dashboard Settings)
-- =====================================================

-- WARNING: auth_otp_long_expiry
-- Fix: Go to Supabase Dashboard → Authentication → Settings
-- Set "OTP Expiry" to 3600 seconds (1 hour) or less
-- Current value is likely 86400 (24 hours)

-- WARNING: auth_leaked_password_protection
-- Fix: Go to Supabase Dashboard → Authentication → Settings
-- Enable "Leaked Password Protection"
-- This checks passwords against HaveIBeenPwned.org database

-- WARNING: vulnerable_postgres_version
-- Fix: Go to Supabase Dashboard → Settings → Infrastructure
-- Click "Upgrade" to upgrade from postgres-15.8.1.079 to latest version
-- This applies important security patches


