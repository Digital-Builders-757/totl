#!/usr/bin/env node

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const typesFile = 'types/database.ts';
const tempFile = 'types/database.__fresh.ts';

try {
  // Check if SUPABASE_PROJECT_ID is set
  const projectId = process.env.SUPABASE_PROJECT_ID;
  if (!projectId) {
    console.error('SUPABASE_PROJECT_ID environment variable is required');
    process.exit(1);
  }

  // Check if types file exists
  if (!fs.existsSync(typesFile)) {
    console.error('types/database.ts missing. Run: npm run types:regen');
    process.exit(1);
  }

  // Generate fresh types
  console.log('Generating fresh types from Supabase schema...');
  execSync(`npx supabase gen types typescript --project-id "${projectId}" --schema public > ${tempFile}`, { stdio: 'inherit' });

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
    console.error('❌ types/database.ts is stale. Run: npm run types:regen');
    fs.unlinkSync(tempFile);
    process.exit(1);
  }

  // Clean up
  fs.unlinkSync(tempFile);
  console.log('✓ types/database.ts is in sync with live schema');

} catch (error) {
  console.error('Error verifying types:', error.message);
  
  // Clean up temp file if it exists
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
  
  process.exit(1);
}
