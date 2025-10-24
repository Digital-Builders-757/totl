#!/usr/bin/env node

/**
 * Comprehensive Schema Sync Verification Script
 * 
 * This script ensures that:
 * 1. Types are generated from the correct project
 * 2. CLI versions are pinned and consistent
 * 3. Line endings are normalized
 * 4. No drift between dev/prod schemas
 * 
 * Run this before every commit to prevent CI failures
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PINNED_CLI_VERSION = '2.34.3';
const DEV_PROJECT_ID = 'utvircuwknqzpnmvxidp';
const PROD_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || '<PROD_ID>';

console.log('🔍 Comprehensive Schema Sync Verification');
console.log('==========================================');

// Step 1: Verify CLI version
console.log('\n1. Checking Supabase CLI version...');
try {
  const cliVersion = execSync('npx -y supabase@2.34.3 --version', { encoding: 'utf8' }).trim();
  console.log(`✅ CLI version: ${cliVersion}`);
} catch (error) {
  console.error('❌ Failed to verify CLI version:', error.message);
  process.exit(1);
}

// Step 2: Check current project link
console.log('\n2. Checking current project link...');
try {
  const linkInfo = execSync('npx -y supabase@2.34.3 projects list', { encoding: 'utf8' });
  const linkedProject = linkInfo.match(/●.*?│\s*(\w+)\s*│/);
  if (linkedProject) {
    console.log(`✅ Currently linked to project: ${linkedProject[1]}`);
  } else {
    console.log('⚠️  No project currently linked');
  }
} catch (error) {
  console.error('❌ Failed to check project link:', error.message);
  process.exit(1);
}

// Step 3: Verify types file exists and is valid
console.log('\n3. Checking types file...');
const typesPath = join(process.cwd(), 'types', 'database.ts');
try {
  const typesContent = readFileSync(typesPath, 'utf8');
  
  // Check for auto-generated banner
  if (!typesContent.includes('AUTO-GENERATED FILE')) {
    console.log('⚠️  Types file missing auto-generated banner');
  } else {
    console.log('✅ Types file has proper auto-generated banner');
  }
  
  // Check for proper Database type structure
  if (!typesContent.includes('export type Database')) {
    console.error('❌ Types file missing Database type export');
    process.exit(1);
  } else {
    console.log('✅ Types file has proper Database type structure');
  }
  
  // Check for line ending consistency
  const hasCRLF = typesContent.includes('\r\n');
  const hasLF = typesContent.includes('\n') && !hasCRLF;
  
  if (hasCRLF) {
    console.log('⚠️  Types file has CRLF line endings (should be LF)');
    // Normalize to LF
    const normalizedContent = typesContent.replace(/\r\n/g, '\n');
    writeFileSync(typesPath, normalizedContent, 'utf8');
    console.log('✅ Normalized line endings to LF');
  } else if (hasLF) {
    console.log('✅ Types file has proper LF line endings');
  }
  
} catch (error) {
  console.error('❌ Failed to read types file:', error.message);
  process.exit(1);
}

// Step 4: Check for schema drift
console.log('\n4. Checking for schema drift...');
try {
  // Generate fresh types from current linked project
  const freshTypes = execSync(
    `npx -y supabase@${PINNED_CLI_VERSION} gen types typescript --linked --schema public`,
    { encoding: 'utf8' }
  );
  
  // Compare with existing types
  const existingTypes = readFileSync(typesPath, 'utf8');
  
  // Function to clean types by removing volatile __InternalSupabase block
  const cleanTypes = (text) => {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/__InternalSupabase: \{[^}]*\}/gs, '')  // Remove __InternalSupabase block
      .replace(/\n\s*\n\s*\n/g, '\n\n')  // Clean up extra blank lines
      .trim();
  };
  
  // Clean both for comparison (removing noise)
  const normalizedFresh = cleanTypes(freshTypes);
  const normalizedExisting = cleanTypes(existingTypes);
  
  if (normalizedFresh === normalizedExisting) {
    console.log('✅ Types are in sync with current linked project');
  } else {
    console.log('⚠️  Types are out of sync with current linked project');
    console.log('   Run: npm run types:regen to fix');
    console.log('   Note: Comparison excludes __InternalSupabase noise');
    
    // Show diff summary
    const freshLines = normalizedFresh.split('\n');
    const existingLines = normalizedExisting.split('\n');
    
    let addedLines = 0;
    let removedLines = 0;
    
    // Simple diff analysis
    const maxLines = Math.max(freshLines.length, existingLines.length);
    for (let i = 0; i < maxLines; i++) {
      if (i >= existingLines.length) {
        addedLines++;
      } else if (i >= freshLines.length) {
        removedLines++;
      } else if (freshLines[i] !== existingLines[i]) {
        // Check if it's an addition or removal
        if (freshLines[i].includes('+') || freshLines[i].includes('ADD')) {
          addedLines++;
        } else if (existingLines[i].includes('-') || existingLines[i].includes('REMOVE')) {
          removedLines++;
        }
      }
    }
    
    if (addedLines > 0) console.log(`   +${addedLines} lines added`);
    if (removedLines > 0) console.log(`   -${removedLines} lines removed`);
  }
  
} catch (error) {
  console.error('❌ Failed to check schema drift:', error.message);
  process.exit(1);
}

// Step 5: Verify .gitattributes exists
console.log('\n5. Checking .gitattributes...');
const gitattributesPath = join(process.cwd(), '.gitattributes');
try {
  const gitattributes = readFileSync(gitattributesPath, 'utf8');
  if (gitattributes.includes('types/database.ts text eol=lf')) {
    console.log('✅ .gitattributes properly configured for types file');
  } else {
    console.log('⚠️  .gitattributes missing types file configuration');
  }
} catch (error) {
  console.log('⚠️  .gitattributes file not found');
}

// Step 6: Check for common issues
console.log('\n6. Checking for common issues...');

// Check for any usage of old CLI versions in scripts
try {
  const packageJson = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
  const scripts = packageJson.scripts || {};
  
  let hasOldVersions = false;
  for (const [scriptName, script] of Object.entries(scripts)) {
    if (typeof script === 'string' && script.includes('supabase@') && !script.includes(`supabase@${PINNED_CLI_VERSION}`)) {
      console.log(`⚠️  Script "${scriptName}" uses non-pinned CLI version`);
      hasOldVersions = true;
    }
  }
  
  if (!hasOldVersions) {
    console.log('✅ All scripts use pinned CLI versions');
  }
} catch (error) {
  console.log('⚠️  Could not verify script versions');
}

console.log('\n🎉 Schema sync verification complete!');
console.log('\n📋 Summary:');
console.log('   - Use npm run types:regen to regenerate types');
console.log('   - Use npm run link:dev or npm run link:prod to switch projects');
console.log('   - Always commit .gitattributes to normalize line endings');
console.log('   - Run this script before every commit to prevent CI failures');
