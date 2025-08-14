#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const typesFile = 'types/database.ts';
const banner = `/**
 * AUTO-GENERATED FILE – DO NOT EDIT.
 * Source of truth: Supabase schema.
 * Generated: ${new Date().toISOString()}
 */

`;

try {
  // Read the current content
  const content = fs.readFileSync(typesFile, 'utf8');
  
  // Check if banner already exists
  if (content.includes('AUTO-GENERATED FILE')) {
    console.log('AUTO-GENERATED banner already exists in types/database.ts');
    process.exit(0);
  }
  
  // Prepend banner
  const newContent = banner + content;
  fs.writeFileSync(typesFile, newContent, 'utf8');
  
  console.log('✓ AUTO-GENERATED banner added to types/database.ts');
} catch (error) {
  console.error('Error adding AUTO-GENERATED banner:', error.message);
  process.exit(1);
}
