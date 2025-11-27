#!/usr/bin/env node

import { execSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";

const DEFAULT_PROJECT_ID = "utvircuwknqzpnmvxidp";
const projectId = process.env.SUPABASE_PROJECT_ID || DEFAULT_PROJECT_ID;

console.log(`🔐 Generating remote types for comparison (project ${projectId})...`);
const cmd = `npx -y supabase@2.34.3 gen types typescript --project-id ${projectId} --schema public`;

const remote = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], shell: true }).toString("utf8");
writeFileSync("types/temp_schema_types.ts", remote, "utf8");

console.log("🧮 Comparing with committed types/database.ts...");
const local = readFileSync("types/database.ts", "utf8");

// Remove AUTO-GENERATED banner from local file for comparison
const localWithoutBanner = local.replace(/\/\*\s*AUTO-GENERATED[\s\S]*?\*\/\s*/, '').replace(/^\s*\n/, '').trim();
const remoteTrimmed = remote.trim();

// If banner removal didn't work, try a more aggressive approach
const localClean = localWithoutBanner.startsWith('/**') 
  ? localWithoutBanner.substring(localWithoutBanner.indexOf('export type Json'))
  : localWithoutBanner;



if (localClean !== remoteTrimmed) {
  console.error("❌ types/database.ts is not up-to-date with remote schema.");
  console.error(
    `   Run: npx -y supabase@2.34.3 gen types typescript --project-id ${projectId} --schema public > types/database.ts`
  );
  process.exit(1);
}
console.log("✅ types/database.ts matches remote schema");
