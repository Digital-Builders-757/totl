import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOTS = ["app", "components"];
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const NEXT_HEADERS_IMPORT_REGEX = /from\s+["']next\/headers["']/g;

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

let hasErrors = false;

for (const root of ROOTS) {
  const rootPath = path.join(process.cwd(), root);
  if (!statSync(rootPath, { throwIfNoEntry: false })) continue;
  for (const file of walk(rootPath)) {
    const content = readFileSync(file, "utf8");
    if (!isUseClientFile(content)) continue;

    const matches = [...content.matchAll(NEXT_HEADERS_IMPORT_REGEX)];
    if (matches.length === 0) continue;

    hasErrors = true;
    const rel = path.relative(process.cwd(), file);
    for (const match of matches) {
      const line = indexToLine(content, match.index ?? 0);
      process.stderr.write(
        `[guard:no-next-headers-client] ${rel}:${line}: Disallowed next/headers import in "use client" file.\n`
      );
    }
  }
}

if (hasErrors) {
  process.stderr.write(
    '\nFix: move cookies()/headers() access to Server Components, Route Handlers, or server-only helpers.\n'
  );
  process.exit(1);
}

process.stdout.write("[guard:no-next-headers-client] OK\n");
