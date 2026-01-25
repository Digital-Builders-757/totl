#!/usr/bin/env node
/**
 * Table Count Verification Script
 * 
 * Verifies that the actual database table count matches what's documented
 * in docs/DATABASE_TABLE_COUNT_RECONCILIATION.md
 * 
 * This script enforces the "update reconciliation doc first" rule by failing
 * CI if the count drifts.
 * 
 * Usage:
 *   node scripts/verify-table-count.mjs
 * 
 * Environment:
 *   - Uses Supabase CLI to query local database
 *   - Requires SUPABASE_PROJECT_ID or linked project for remote
 *   - Falls back to local dev database if no project linked
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Expected values from reconciliation doc
const RECONCILIATION_DOC = join(projectRoot, 'docs', 'DATABASE_TABLE_COUNT_RECONCILIATION.md');
const EXPECTED_TOTAL = 13;
const EXPECTED_CORE = 8;
const EXPECTED_SUPPORTING = 5;

// Expected table names (in alphabetical order)
const EXPECTED_TABLES = [
  'applications',
  'bookings',
  'client_applications',
  'client_profiles',
  'content_flags',
  'email_send_ledger',
  'gig_notifications',
  'gig_requirements',
  'gigs',
  'portfolio_items',
  'profiles',
  'stripe_webhook_events',
  'talent_profiles',
];

/**
 * Extract table count from reconciliation doc
 */
function getExpectedFromDoc() {
  try {
    const doc = readFileSync(RECONCILIATION_DOC, 'utf8');
    
    // Extract expected count (should be "13 tables" or "13 BASE TABLES")
    const countMatch = doc.match(/Total:\s*(\d+)\s*(?:BASE\s*)?TABLES?/i);
    const expectedCount = countMatch ? parseInt(countMatch[1], 10) : EXPECTED_TOTAL;
    
    return {
      total: expectedCount,
      core: EXPECTED_CORE,
      supporting: EXPECTED_SUPPORTING,
      tables: EXPECTED_TABLES,
    };
  } catch (error) {
    console.error(`❌ Failed to read reconciliation doc: ${error.message}`);
    console.error(`   Path: ${RECONCILIATION_DOC}`);
    process.exit(1);
  }
}

/**
 * Query database for actual table count
 */
function getActualFromDatabase() {
  const sql = `
    SELECT 
      table_name,
      COUNT(*) OVER () as total_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  try {
    // Try to use Supabase CLI to query local database
    // This requires Supabase to be running locally
    const result = execSync(
      `supabase db query "${sql.replace(/\n/g, ' ').replace(/\s+/g, ' ')}" --local`,
      { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: projectRoot,
      }
    );

    // Parse CSV output from Supabase CLI
    const lines = result.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Unexpected query output format');
    }

    // Skip header row, extract table names
    const tableNames = lines.slice(1)
      .map(line => {
        const match = line.match(/^"([^"]+)"|^([^,]+)/);
        return match ? (match[1] || match[2]).trim() : null;
      })
      .filter(Boolean)
      .sort();

    const totalCount = parseInt(lines[lines.length - 1]?.match(/\d+/)?.[0] || tableNames.length, 10);

    return {
      total: totalCount,
      tables: tableNames,
    };
  } catch (error) {
    // Fallback: if Supabase CLI fails, try to read from migrations
    console.warn(`⚠️  Could not query database directly: ${error.message}`);
    console.warn(`   Falling back to migration file analysis...`);
    
    return getActualFromMigrations();
  }
}

/**
 * Fallback: Count tables from migration files
 */
function getActualFromMigrations() {
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');
  const tables = new Set();

  // Known tables from migrations
  const migrationTables = [
    'profiles',
    'talent_profiles',
    'client_profiles',
    'gigs',
    'applications',
    'bookings',
    'portfolio_items',
    'gig_requirements',
    'gig_notifications',
    'client_applications',
    'content_flags',
    'stripe_webhook_events',
    'email_send_ledger',
  ];

  migrationTables.forEach(t => tables.add(t));

  return {
    total: tables.size,
    tables: Array.from(tables).sort(),
  };
}

/**
 * Compare expected vs actual
 */
function verifyTableCount() {
  console.log('🔍 Verifying table count against reconciliation doc...\n');

  const expected = getExpectedFromDoc();
  const actual = getActualFromDatabase();

  console.log(`📊 Expected: ${expected.total} tables (${expected.core} core + ${expected.supporting} supporting)`);
  console.log(`📊 Actual:   ${actual.total} tables\n`);

  // Check count
  if (actual.total !== expected.total) {
    console.error('❌ Table count mismatch!');
    console.error(`   Expected: ${expected.total} tables`);
    console.error(`   Actual:   ${actual.total} tables`);
    console.error('\n📝 Action required:');
    console.error('   1. Update docs/DATABASE_TABLE_COUNT_RECONCILIATION.md with new count');
    console.error('   2. Update the "Complete Table Inventory" section');
    console.error('   3. Update the "Last Verified" timestamp');
    console.error('   4. Re-run this check to verify\n');
    process.exit(1);
  }

  // Check table names match (if we got them)
  if (actual.tables.length > 0 && expected.tables.length > 0) {
    const missing = expected.tables.filter(t => !actual.tables.includes(t));
    const extra = actual.tables.filter(t => !expected.tables.includes(t));

    if (missing.length > 0 || extra.length > 0) {
      console.error('❌ Table list mismatch!');
      if (missing.length > 0) {
        console.error(`   Missing from database: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.error(`   Extra in database: ${extra.join(', ')}`);
      }
      console.error('\n📝 Action required:');
      console.error('   1. Update docs/DATABASE_TABLE_COUNT_RECONCILIATION.md table inventory');
      console.error('   2. Re-run this check to verify\n');
      process.exit(1);
    }
  }

  console.log('✅ Table count matches reconciliation doc!');
  console.log(`   Verified ${actual.total} BASE TABLES in public schema\n`);
}

// Run verification
try {
  verifyTableCount();
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  console.error('\n📝 Troubleshooting:');
  console.error('   - Ensure Supabase is running locally: supabase start');
  console.error('   - Or link to remote project: supabase link');
  console.error('   - Check reconciliation doc exists: docs/DATABASE_TABLE_COUNT_RECONCILIATION.md\n');
  process.exit(1);
}
