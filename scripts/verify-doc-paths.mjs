#!/usr/bin/env node
/**
 * Verify that critical documentation paths exist.
 * Used by CI to catch accidental deletes of cursor-command-required docs.
 * Existence checks only — no content lint.
 *
 * Paths (relative to repo root):
 * - docs/ARCHITECTURE_CONSTITUTION.md
 * - docs/DOCUMENTATION_INDEX.md
 * - database_schema_audit.md
 * - docs/diagrams/airport-model.md
 * - docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md
 * - MVP_STATUS_NOTION.md
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");

const REQUIRED_PATHS = [
  "docs/ARCHITECTURE_CONSTITUTION.md",
  "docs/DOCUMENTATION_INDEX.md",
  "database_schema_audit.md",
  "docs/diagrams/airport-model.md",
  "docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md",
  "MVP_STATUS_NOTION.md",
];

let failed = 0;
for (const p of REQUIRED_PATHS) {
  const full = join(root, p);
  if (existsSync(full)) {
    console.log(`✅ ${p}`);
  } else {
    console.error(`❌ MISSING: ${p}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} required doc path(s) missing. Cursor commands depend on these.`);
  process.exit(1);
}

console.log("\n✅ All required doc paths exist.");
