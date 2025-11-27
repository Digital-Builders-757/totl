-- Migration: Ensure pg_trgm extension exists in the extensions schema
-- Date: 2025-10-16
-- Description: Installs pg_trgm inside the dedicated extensions schema so later
--              migrations that reference the extension succeed in all environments.

BEGIN;

-- Make sure the extensions schema exists locally
CREATE SCHEMA IF NOT EXISTS extensions;

-- Install pg_trgm in the extensions schema (idempotent for fresh environments)
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Document the reasoning so future migrations/tools know the expected location
COMMENT ON EXTENSION pg_trgm IS
  'Trigram matching for PostgreSQL - stored in extensions schema for security';

COMMIT;

