import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
// Target only source directories
const TARGET_DIRS = ["app", "lib", "components", "hooks"];
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

// Patterns to match select('*'), select("*"), select(`*`)
const SELECT_STAR_PATTERNS = [
  /\.select\(['"]\*['"]\)/g,
  /\.select\(`\*`\)/g,
  /\.select\(['"]\s*\*\s*['"]\)/g, // with whitespace
];

const files = [];
for (const dir of TARGET_DIRS) {
  const dirPath = path.join(ROOT, dir);
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    files.push(...walk(dirPath));
  }
}

const violations = [];

for (const file of files) {
  const src = read(file);
  const rel = path.relative(ROOT, file);
  const lines = src.split("\n");

  lines.forEach((line, i) => {
    for (const pattern of SELECT_STAR_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({ file: rel, line: i + 1, code: line.trim() });
        break; // Only report once per line
      }
    }
  });
}

if (violations.length) {
  console.error("\n❌ select('*') violations found:\n");
  for (const v of violations) {
    console.error(`${v.file}:${v.line}  ${v.code}`);
  }
  console.error(
    "\nRule: Use explicit column selection. select('*') exposes all columns and breaks on schema changes.\n"
  );
  console.error("Fix: Replace select('*') with explicit columns:");
  console.error("  ❌ .select('*')");
  console.error("  ✅ .select('id, name, email')\n");
  process.exit(1);
}

console.log("✅ audit-select-star: no violations found");
