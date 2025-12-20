import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components", "lib"];
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir) {
  const out = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // Hard excludes (we only walk from the 3 roots, but keep defensive guards)
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

function findSelectStarMatches(content) {
  // Match `.select("...")`, `.select('...')`, `.select(`...`)` and flag any literal containing `*`.
  // This intentionally blocks join-style `*, other_table(...)` too.
  const regex = /\.select\s*\(\s*(["'`])([\s\S]*?)\1\s*\)/g;
  const matches = [];
  for (const m of content.matchAll(regex)) {
    const literal = m[2] ?? "";
    if (literal.includes("*")) {
      matches.push({ index: m.index ?? 0, snippet: m[0] });
    }
  }
  return matches;
}

function indexToLineCol(content, index) {
  const upTo = content.slice(0, index);
  const lines = upTo.split(/\r?\n/);
  return { line: lines.length, col: lines[lines.length - 1].length + 1 };
}

let hasErrors = false;

for (const root of ROOTS) {
  const rootPath = path.join(process.cwd(), root);
  if (!statSync(rootPath, { throwIfNoEntry: false })) continue;
  for (const file of walk(rootPath)) {
    const content = readFileSync(file, "utf8");
    const matches = findSelectStarMatches(content);
    if (matches.length === 0) continue;
    hasErrors = true;
    for (const match of matches) {
      const { line } = indexToLineCol(content, match.index);
      const rel = path.relative(process.cwd(), file);
      process.stderr.write(
        `[guard:no-select-star] ${rel}:${line}: Disallowed select('*') usage detected.\n`
      );
    }
  }
}

if (hasErrors) {
  process.stderr.write(
    "\nFix: replace select('*') / `*` in select strings with explicit column lists (or narrow joined selects).\n"
  );
  process.exit(1);
}

process.stdout.write("[guard:no-select-star] OK\n");


