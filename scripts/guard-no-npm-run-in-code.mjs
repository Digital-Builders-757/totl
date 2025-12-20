import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Guard: block accidental `npm run ...` commands pasted into application code.
 *
 * We intentionally only scan TS/TSX sources under app/components/lib/scripts/tests,
 * excluding docs and config, to avoid false positives.
 */
const ROOTS = ["app", "components", "lib", "tests", "scripts"];
const ALLOWED_EXTS = new Set([".ts", ".tsx"]);
const HARD_EXCLUDES = new Set(["node_modules", ".git", ".next", "playwright-report", "test-results", "docs"]);

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

const matches = [];
for (const root of ROOTS) {
  const rootPath = path.join(process.cwd(), root);
  if (!statSync(rootPath, { throwIfNoEntry: false })) continue;
  for (const file of walk(rootPath)) {
    // Skip known config files that may contain legitimate `npm run` references.
    const base = path.basename(file);
    if (base === "playwright.config.ts" || base === "next.config.mjs") continue;

    const content = readFileSync(file, "utf8");
    let idx = 0;
    while (true) {
      const found = content.indexOf("npm run", idx);
      if (found === -1) break;
      const rel = path.relative(process.cwd(), file);
      matches.push(`${rel}:${indexToLine(content, found)}`);
      idx = found + "npm run".length;
    }
  }
}

if (!matches.length) {
  console.log("[guard:no-npm-run-in-code] OK");
  process.exit(0);
}

console.error("[guard:no-npm-run-in-code] FAILED");
console.error("Found `npm run` occurrences in source files (likely pasted commands).");
for (const line of matches.slice(0, 50)) console.error(`  ${line}`);
if (matches.length > 50) console.error(`  ...and ${matches.length - 50} more`);
process.exit(1);


