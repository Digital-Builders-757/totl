#!/usr/bin/env node
/**
 * Environment Variables Check Script
 * Loads .env.local and verifies all required variables are set
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load .env.local manually
try {
  const envPath = join(projectRoot, '.env.local');
  const envFile = readFileSync(envPath, 'utf8');
  
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error('⚠️  Warning: Could not load .env.local file');
}

// Required variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
];

// Optional but recommended variables
const optionalVars = [
  'SUPABASE_PROJECT_ID',
  'SUPABASE_ACCESS_TOKEN',
  'SENTRY_DSN_DEV',
  'ADMIN_EMAIL',
];

console.log('🔍 Environment Variables Check\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let missingCount = 0;

console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const isSet = !!process.env[varName];
  const status = isSet ? '✅' : '❌';
  console.log(`  ${status} ${varName}: ${isSet ? 'Set' : 'Missing'}`);
  if (!isSet) missingCount++;
});

console.log('\n🔧 Optional Variables:');
optionalVars.forEach(varName => {
  const isSet = !!process.env[varName];
  const status = isSet ? '✅' : '⚠️ ';
  console.log(`  ${status} ${varName}: ${isSet ? 'Set' : 'Not set'}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (missingCount > 0) {
  console.log(`❌ ${missingCount} required variable(s) missing!`);
  console.log('💡 Copy .env.example to .env.local and fill in your values\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!\n');
}

