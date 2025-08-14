#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const typesFile = 'types/database.ts';
const tempFile = 'types/database.__fresh.ts';

console.log('🔍 Verifying schema synchronization...\n');

try {
  // Check if SUPABASE_PROJECT_ID is set
  const projectId = process.env.SUPABASE_PROJECT_ID;
  if (!projectId) {
    console.error('❌ SUPABASE_PROJECT_ID environment variable is required');
    console.log('💡 Run: npm run db:setup');
    process.exit(1);
  }

  // Check if types file exists
  if (!fs.existsSync(typesFile)) {
    console.error('❌ types/database.ts missing');
    console.log('💡 Run: npm run types:regen');
    process.exit(1);
  }

  // Test actual access to remote schema using linked project
  console.log('🔐 Testing remote schema access...');
  try {
    execSync(`npx supabase@latest gen types typescript --linked --schema public > NUL 2>&1`, { 
      stdio: 'pipe'
    });
  } catch (error) {
    console.error('❌ Cannot access remote schema');
    console.log('💡 This could be due to:');
    console.log('   1. Not logged in to Supabase - run: npx supabase@latest login');
    console.log('   2. Project not linked - run: npx supabase@latest link --project-ref <REF>');
    console.log('   3. Network issues');
    process.exit(1);
  }

  // Generate fresh types
  console.log('📡 Generating fresh types from remote schema...');
  execSync(`npx supabase@latest gen types typescript --linked --schema public > ${tempFile}`, { 
    stdio: 'pipe',
    encoding: 'utf8'
  });

  // Read both files
  const existingContent = fs.readFileSync(typesFile, 'utf8');
  const freshContent = fs.readFileSync(tempFile, 'utf8');

  // Normalize content by removing AUTO-GENERATED banner and trimming
  function normalizeContent(content) {
    return content
      .replace(/\/\*[\s\S]*?AUTO-GENERATED[\s\S]*?\*\/\s*/, '') // Remove banner
      .replace(/\r\n/g, '\n') // Normalize line endings
      .trim();
  }

  const normalizedExisting = normalizeContent(existingContent);
  const normalizedFresh = normalizeContent(freshContent);

  // Compare
  if (normalizedExisting !== normalizedFresh) {
    console.error('❌ Schema verification failed!');
    console.log('');
    console.log('📋 Your local types/database.ts is out of sync with the remote schema.');
    console.log('');
    console.log('🔧 To fix this, run:');
    console.log('   npm run types:regen');
    console.log('');
    console.log('📊 Quick diff preview:');
    console.log('   Lines starting with "-" are in your local file but not in remote');
    console.log('   Lines starting with "+" are in remote but missing from your local file');
    console.log('');
    
    // Show a brief diff
    try {
      const diff = execSync(`diff -u ${typesFile} ${tempFile}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('🔍 Diff preview (first 20 lines):');
      console.log(diff.split('\n').slice(0, 20).join('\n'));
      if (diff.split('\n').length > 20) {
        console.log('   ... (truncated)');
      }
    } catch (diffError) {
      // diff command failed, which means files are different
      console.log('   Files differ but diff command unavailable');
    }
    
    // Clean up
    fs.unlinkSync(tempFile);
    process.exit(1);
  }

  // Clean up
  fs.unlinkSync(tempFile);
  console.log('✅ Schema verification passed!');
  console.log('   types/database.ts is in sync with remote schema');

} catch (error) {
  console.error('❌ Error during schema verification:', error.message);
  
  // Clean up temp file if it exists
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
  
  console.log('');
  console.log('💡 Troubleshooting:');
  console.log('   1. Run: npm run supabase:login');
  console.log('   2. Check your internet connection');
  console.log('   3. Verify SUPABASE_PROJECT_ID is correct');
  console.log('   4. Run: npm run db:setup');
  console.log('   5. Try: npm run types:regen');
  
  process.exit(1);
}
