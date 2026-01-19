import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git"]);
const TARGET_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), out);
      continue;
    }
    const ext = path.extname(entry.name);
    if (TARGET_EXT.has(ext)) out.push(path.join(dir, entry.name));
  }
  return out;
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

const files = walk(ROOT);
const hits = [];

for (const file of files) {
  const src = read(file);

  // basic heuristic
  if (!src.includes(".single(") && !src.includes(".single()")) continue;

  // ignore generated / known-safe patterns if you want:
  // if (file.includes("types/")) continue;

  const rel = path.relative(ROOT, file);
  const lines = src.split("\n");

  lines.forEach((line, i) => {
    if (line.includes(".single(") || line.includes(".single()")) {
      hits.push({ file: rel, line: i + 1, code: line.trim() });
    }
  });
}

if (hits.length) {
  console.warn("\n⚠️ .single() usages found (review required):\n");
  for (const h of hits) {
    console.warn(`${h.file}:${h.line}  ${h.code}`);
  }
  console.warn(
    "\nRule: use .single() only when the row is guaranteed to exist. Otherwise .maybeSingle().\n"
  );

  // You can decide whether to fail CI or not:
  // process.exit(1);
}

console.log("✅ audit-single-vs-maybe-single: completed");
