#!/usr/bin/env node
/**
 * Environment Variable Verification Script
 * Verifies that all required environment variables are set in .env.local
 * 
 * Usage: npm run env:verify
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
const result = config({ path: resolve(__dirname, '../.env.local') });

if (result.error) {
  console.error('❌ Error loading .env.local file');
  console.error('   Make sure .env.local exists in the project root');
  console.error('   Copy .env.example to .env.local and fill in your values');
  process.exit(1);
}

console.log('🔍 Checking environment variables...\n');

// Required environment variables
const REQUIRED_VARS = {
  'Supabase Configuration': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_PROJECT_ID',
  ],
  'Email Configuration': [
    'RESEND_API_KEY',
    'ADMIN_EMAIL',
  ],
  'Site Configuration': [
    'NEXT_PUBLIC_SITE_URL',
  ],
};

// Optional environment variables
const OPTIONAL_VARS = {
  'Sentry (Optional)': [
    'SENTRY_DSN_DEV',
    'SENTRY_DSN_PROD',
    'SENTRY_AUTH_TOKEN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
  ],
  'Deployment': [
    'VERCEL_ENV',
  ],
};

let hasErrors = false;
let hasWarnings = false;

// Check required variables
for (const [category, vars] of Object.entries(REQUIRED_VARS)) {
  console.log(`📋 ${category}:`);
  for (const varName of vars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`   ❌ ${varName}: Missing`);
      hasErrors = true;
    } else if (value.includes('your_') || value.includes('_here')) {
      console.log(`   ⚠️  ${varName}: Placeholder value detected`);
      hasWarnings = true;
    } else {
      const maskedValue = value.substring(0, 10) + '...';
      console.log(`   ✅ ${varName}: ${maskedValue}`);
    }
  }
  console.log('');
}

// Check optional variables
for (const [category, vars] of Object.entries(OPTIONAL_VARS)) {
  console.log(`📋 ${category}:`);
  for (const varName of vars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`   ℹ️  ${varName}: Not set (optional)`);
    } else {
      const maskedValue = value.substring(0, 10) + '...';
      console.log(`   ✅ ${varName}: ${maskedValue}`);
    }
  }
  console.log('');
}

// Summary
console.log('═'.repeat(60));
if (hasErrors) {
  console.log('❌ Environment check FAILED!');
  console.log('   Missing required environment variables.');
  console.log('   Copy .env.example to .env.local and fill in your values.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  Environment check WARNING!');
  console.log('   Some variables still have placeholder values.');
  console.log('   Update them with real values before deploying.');
  process.exit(0);
} else {
  console.log('✅ All required environment variables are set!');
  console.log('   Your environment is properly configured.');
  process.exit(0);
}

