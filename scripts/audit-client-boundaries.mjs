import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
// Target only source directories (not root-walking + ignore hacks)
// This prevents missing boundary leaks in future directories like /src or /packages
const TARGET_DIRS = ["app", "lib", "components", "hooks"];
const IGNORE_DIRS = new Set(["node_modules", ".next", "dist", "build", ".git", "scripts", "tests", "docs", "supabase", "public", "styles", "types"]);
const TARGET_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

// Guard: Detect new top-level directories that might contain source code
// This prevents accidentally creating unscanned zones
const POTENTIAL_SOURCE_DIRS = ["src", "features", "packages", "server", "shared", "modules", "services"];

const BROWSER_IMPORT_PATTERNS = [
  "@/lib/supabase/supabase-browser",
  "lib/supabase/supabase-browser",
  "@/lib/supabase-browser", // if you have legacy paths
  "lib/supabase-browser",
];

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

function hasUseClient(src) {
  // Accept "use client"; or 'use client';
  return /^\s*["']use client["']\s*;?/m.test(src);
}

function importsBrowserSupabase(src) {
  return BROWSER_IMPORT_PATTERNS.some((p) => src.includes(p));
}

// Detect if createSupabaseBrowser() is called during render (component body, module scope)
// Allowed: useEffect, useLayoutEffect, event handlers
function callsBrowserSupabaseDuringRender(src) {
  const violations = [];
  const lines = src.split('\n');
  
  // Simple pattern: find createSupabaseBrowser() calls that are NOT inside:
  // - useEffect(() => { ... })
  // - useLayoutEffect(() => { ... })
  // - Event handlers (async functions, arrow functions in handlers)
  
  // Regex to find createSupabaseBrowser() calls
  const callPattern = /createSupabaseBrowser\s*\(/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!callPattern.test(line)) {
      callPattern.lastIndex = 0; // Reset regex
      continue;
    }
    callPattern.lastIndex = 0; // Reset regex
    
    const lineNum = i + 1;
    const trimmed = line.trim();
    
    // Check if this line is inside a useEffect/useLayoutEffect
    // Look backwards to find the nearest useEffect/useLayoutEffect
    let foundUseEffect = false;
    let braceCount = 0;
    for (let j = i; j >= 0; j--) {
      const prevLine = lines[j];
      braceCount += (prevLine.match(/{/g) || []).length;
      braceCount -= (prevLine.match(/}/g) || []).length;
      
      if (prevLine.includes('useEffect(') || prevLine.includes('useLayoutEffect(')) {
        // Check if we're still inside the effect (braceCount > 0 means we're inside)
        if (braceCount > 0) {
          foundUseEffect = true;
        }
        break;
      }
    }
    
    // Check if it's inside an async function handler (event handler pattern)
    const isInAsyncHandler = /async\s+(function|\()/.test(src.substring(Math.max(0, src.indexOf(line) - 500), src.indexOf(line)));
    
    // Check if it's a const handler = async () => pattern
    const isArrowHandler = /const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>/.test(src.substring(Math.max(0, src.indexOf(line) - 300), src.indexOf(line)));
    
    // Violation: called during render (not in useEffect/handler)
    if (!foundUseEffect && !isInAsyncHandler && !isArrowHandler) {
      // Additional check: is it at component function level?
      // Look for component declaration before this line
      const beforeLine = src.substring(0, src.indexOf(line));
      const hasComponentDecl = /(function\s+\w+|const\s+\w+\s*=\s*(\(|async\s*\()|export\s+(default\s+)?function)/.test(beforeLine);
      
      if (hasComponentDecl || trimmed.startsWith('const') || trimmed.startsWith('let') || trimmed.startsWith('var')) {
        violations.push({ line: lineNum, content: trimmed.substring(0, 80) });
      }
    }
  }
  
  return violations;
}

// Guard: Check for new top-level directories that aren't in TARGET_DIRS
const rootEntries = fs.readdirSync(ROOT, { withFileTypes: true });
const newDirs = [];
for (const entry of rootEntries) {
  if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
    if (!TARGET_DIRS.includes(entry.name) && POTENTIAL_SOURCE_DIRS.includes(entry.name)) {
      newDirs.push(entry.name);
    }
  }
}

if (newDirs.length > 0) {
  console.error("\n⚠️  New top-level directories detected that aren't in audit scope:");
  for (const dir of newDirs) {
    console.error(`   - ${dir}/`);
  }
  console.error("\n💡 Action required:");
  console.error("   1. If these directories contain source code, add them to TARGET_DIRS in this script");
  console.error("   2. If they're not source code, add them to IGNORE_DIRS");
  console.error(`\n   Current TARGET_DIRS: ${TARGET_DIRS.join(", ")}`);
  console.error(`   Current IGNORE_DIRS: ${Array.from(IGNORE_DIRS).join(", ")}\n`);
  process.exit(1);
}

// Scan only target directories (not root-walking)
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

  if (!importsBrowserSupabase(src)) continue;

  // Skip the browser file itself
  if (file.includes("supabase-browser.ts") || file.includes("supabase-browser.js")) continue;

  const useClient = hasUseClient(src);
  if (!useClient) {
    violations.push({ file, reason: "missing 'use client' directive" });
    continue;
  }

  // Check for render-time calls (component body, module scope)
  const renderTimeViolations = callsBrowserSupabaseDuringRender(src);
  if (renderTimeViolations.length > 0) {
    for (const violation of renderTimeViolations) {
      violations.push({ 
        file, 
        reason: `createSupabaseBrowser() called during render at line ${violation.line}: ${violation.content.substring(0, 60)}...` 
      });
    }
  }
}

if (violations.length) {
  console.error("\n❌ Client Boundary Violations:");
  for (const v of violations) {
    if (typeof v === 'string') {
      console.error(" -", path.relative(ROOT, v), "(missing 'use client')");
    } else {
      console.error(" -", path.relative(ROOT, v.file), `(${v.reason})`);
    }
  }
  console.error(
    "\nFix:"
  );
  console.error("  1. Add \"use client\" directive if missing");
  console.error("  2. Move createSupabaseBrowser() calls to useEffect, useLayoutEffect, or event handlers");
  console.error("  3. Never call createSupabaseBrowser() during render (component body, module scope)\n");
  process.exit(1);
}

console.log("✅ audit-client-boundaries: no violations found");
