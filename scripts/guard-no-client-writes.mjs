import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components"];
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === ".git" || ent.name === ".next") continue;
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

function isUseClientFile(content) {
  // Detect `"use client";` directive allowing leading comments/blank lines.
  const lines = content.split(/\r?\n/);
  let inBlock = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (inBlock) {
      if (line.includes("*/")) inBlock = false;
      continue;
    }
    if (line.startsWith("/*")) {
      if (!line.includes("*/")) inBlock = true;
      continue;
    }
    if (line.startsWith("//")) continue;
    return line === '"use client";' || line === "'use client';";
  }
  return false;
}

function indexToLine(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

// We only want to flag Supabase-style table mutations, not generic `.delete()` on Maps/Sets/etc.
// This guard looks for `.from("table") ... .insert|update|upsert|delete|rpc(` within the same chain.
const FROM_REGEX = /\.from\s*\(\s*(["'`])([^"'`]+)\1\s*\)/g;
const MUTATION_REGEX = /\.(insert|update|upsert|delete|rpc)\s*\(/g;

let hasErrors = false;

for (const root of ROOTS) {
  const rootPath = path.join(process.cwd(), root);
  if (!statSync(rootPath, { throwIfNoEntry: false })) continue;
  for (const file of walk(rootPath)) {
    const content = readFileSync(file, "utf8");
    if (!isUseClientFile(content)) continue;

    const rel = path.relative(process.cwd(), file);
    for (const fromMatch of content.matchAll(FROM_REGEX)) {
      const fromIdx = fromMatch.index ?? 0;
      const table = fromMatch[2] ?? "unknown_table";

      // Search a bounded window after `.from(...)` for a mutation call in the same fluent chain.
      const window = content.slice(fromIdx, Math.min(content.length, fromIdx + 2500));
      const mutations = [...window.matchAll(MUTATION_REGEX)];
      if (mutations.length === 0) continue;

      hasErrors = true;
      for (const m of mutations) {
        const idx = fromIdx + (m.index ?? 0);
        const line = indexToLine(content, idx);
        process.stderr.write(
          `[guard:no-client-writes] ${rel}:${line}: Disallowed Supabase mutation in "use client" file: from("${table}")${m[0]}\n`
        );
      }
    }
  }
}

if (hasErrors) {
  process.stderr.write(
    "\nFix: move mutations into Server Actions or API routes; client components must be UI-only.\n"
  );
  process.exit(1);
}

process.stdout.write("[guard:no-client-writes] OK\n");


