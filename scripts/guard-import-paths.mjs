import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Guard: block known-wrong import paths that frequently cause CI/build failures.
 *
 * This is the canonical, cross-platform replacement for equivalent checks that existed only in PowerShell.
 *
 * Rules (repo-specific):
 * - Never import `@/types/database` (should be `@/types/supabase`)
 * - Never import `@/lib/supabase/supabase-admin-client` (should be `@/lib/supabase-admin-client`)
 */
const WRONG_PATTERNS = [
  {
    name: "types/database import",
    pattern: "@/types/database",
    fix: "Use `@/types/supabase` instead.",
  },
  {
    name: "supabase admin client import (extra /supabase/ segment)",
    pattern: "@/lib/supabase/supabase-admin-client",
    fix: "Use `@/lib/supabase-admin-client` instead.",
  },
];

// Only scan source roots; avoid substring matches in docs/scripts tooling, and keep runtime stable.
const ROOTS = ["app", "components", "lib", "tests"];
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const HARD_EXCLUDES = new Set(["node_modules", ".git", ".next", "playwright-report", "test-results", "docs", "types"]);

function walk(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (HARD_EXCLUDES.has(ent.name)) continue;
      out.push(...walk(full));
      continue;
    }
    if (!ent.isFile()) continue;
    const ext = path.extname(ent.name);
    if (!ALLOWED_EXTS.has(ext)) continue;
    out.push(full);
  }
  return out;
}

function indexToLine(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

const failures = [];

const EXACT_BAD_IMPORT_RE = /(?:import\s+[\s\S]*?\sfrom\s*|export\s+[\s\S]*?\sfrom\s*)["']@\/types\/database["']\s*;?/g;
const EXACT_BAD_REQUIRE_RE = /require\s*\(\s*["']@\/types\/database["']\s*\)/g;
const EXACT_BAD_ADMIN_IMPORT_RE =
  /(?:import\s+[\s\S]*?\sfrom\s*|export\s+[\s\S]*?\sfrom\s*)["']@\/lib\/supabase\/supabase-admin-client["']\s*;?/g;
const EXACT_BAD_ADMIN_REQUIRE_RE =
  /require\s*\(\s*["']@\/lib\/supabase\/supabase-admin-client["']\s*\)/g;

for (const root of ROOTS) {
  const rootPath = path.join(process.cwd(), root);
  if (!statSync(rootPath, { throwIfNoEntry: false })) continue;
  for (const file of walk(rootPath)) {
    const rel = path.relative(process.cwd(), file);
    const content = readFileSync(file, "utf8");

    // Rule 1: exact bad types import
    {
      const indices = [
        ...content.matchAll(EXACT_BAD_IMPORT_RE),
        ...content.matchAll(EXACT_BAD_REQUIRE_RE),
      ].map((m) => m.index ?? 0);
      if (indices.length) {
        const rule = WRONG_PATTERNS[0];
        failures.push({ rule, matches: indices.map((i) => `${rel}:${indexToLine(content, i)}`) });
      }
    }

    // Rule 2: exact bad admin client import
    {
      const indices = [
        ...content.matchAll(EXACT_BAD_ADMIN_IMPORT_RE),
        ...content.matchAll(EXACT_BAD_ADMIN_REQUIRE_RE),
      ].map((m) => m.index ?? 0);
      if (indices.length) {
        const rule = WRONG_PATTERNS[1];
        failures.push({ rule, matches: indices.map((i) => `${rel}:${indexToLine(content, i)}`) });
      }
    }
  }
}

if (!failures.length) {
  console.log("[guard:import-paths] OK");
  process.exit(0);
}

console.error("[guard:import-paths] FAILED");
for (const f of failures) {
  console.error(`\n- Rule: ${f.rule.name}`);
  console.error(`  Pattern: ${f.rule.pattern}`);
  console.error(`  Fix: ${f.rule.fix}`);
  console.error("  Matches:");
  for (const line of f.matches.slice(0, 50)) console.error(`    ${line}`);
  if (f.matches.length > 50) console.error(`    ...and ${f.matches.length - 50} more`);
}
process.exit(1);


