#!/usr/bin/env node

import fs from "fs";
import path from "path";

const targetPath = process.argv[2] ?? "types/database.ts";
const resolvedPath = path.resolve(process.cwd(), targetPath);
const banner = `/**
 * AUTO-GENERATED FILE – DO NOT EDIT.
 * Source of truth: Supabase schema.
 */

`;

try {
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Target file not found: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, "utf8");

  if (content.startsWith(banner)) {
    console.log(`AUTO-GENERATED banner already exists in ${targetPath}`);
    process.exit(0);
  }

  fs.writeFileSync(resolvedPath, banner + content, "utf8");
  console.log(`✓ AUTO-GENERATED banner added to ${targetPath}`);
} catch (error) {
  console.error("Error adding AUTO-GENERATED banner:", error.message);
  process.exit(1);
}
