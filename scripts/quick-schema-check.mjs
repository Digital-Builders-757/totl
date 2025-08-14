#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Quick schema status check...\n');

try {
  // Check if SUPABASE_PROJECT_ID is set
  const projectId = process.env.SUPABASE_PROJECT_ID;
  if (!projectId) {
    console.error('❌ SUPABASE_PROJECT_ID not set');
    console.log('💡 Run: npm run db:setup');
    process.exit(1);
  }

  // Check if types file exists
  if (!fs.existsSync('types/database.ts')) {
    console.error('❌ types/database.ts missing');
    console.log('💡 Run: npm run types:regen');
    process.exit(1);
  }

  // Test actual access to remote schema using linked project
  console.log('🔐 Testing remote schema access...');
  try {
    // Prefer linked project, fall back to project-id if provided
    const cmd = `npx supabase@latest gen types typescript --linked --schema public > NUL 2>&1`;
    execSync(cmd, { stdio: 'pipe' });
    console.log('✅ Remote schema access OK');
  } catch (error) {
    console.error('❌ Cannot access remote schema');
    console.log('💡 This could be due to:');
    console.log('   1. Not logged in to Supabase - run: npx supabase@latest login');
    console.log('   2. Project not linked - run: npx supabase@latest link --project-ref <REF>');
    console.log('   3. Network issues');
    process.exit(1);
  }

  console.log('✅ Basic checks passed');
  console.log(`   Project ID: ${projectId}`);
  console.log('   types/database.ts: exists');
  console.log('   Remote schema: accessible');
  console.log('');
  console.log('💡 For full verification, run:');
  console.log('   npm run schema:verify-local');
  console.log('');
  console.log('💡 To regenerate types, run:');
  console.log('   npm run types:regen');

} catch (error) {
  console.error('❌ Schema check failed:', error.message);
  console.log('💡 Run: npm run db:setup');
  process.exit(1);
}
