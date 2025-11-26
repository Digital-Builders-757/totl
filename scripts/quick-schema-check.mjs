#!/usr/bin/env node

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

console.log("🔍 Quick schema status check...\n");
console.log("🔐 Testing remote schema access...");

const tmp = join(tmpdir(), `supabase_types_${Date.now()}.ts`);

try {
  // Prefer linked project; fall back to explicit project id
  const cmd = process.env.SUPABASE_PROJECT_ID
    ? `npx supabase@v2.34.3 gen types typescript --project-id ${process.env.SUPABASE_PROJECT_ID} --schema public`
    : `npx supabase@v2.34.3 gen types typescript --linked --schema public`;

  // Capture stdout to avoid any shell redirection differences (Windows vs *nix)
  const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], shell: true }).toString("utf8");
  writeFileSync(tmp, out, "utf8");

  console.log("✅ Remote schema accessible");
  process.exit(0);
} catch (e) {
  console.error("❌ Cannot access remote schema");
  // Surface useful hint if CLI not logged in / project not linked
  const msg = String(e?.stderr || e?.message || e);
  if (msg.includes("not logged in") || msg.includes("401")) {
    console.error("💡 Run: npx supabase@v2.34.3 login");
  }
  if (msg.includes("No linked project") || msg.includes("link this project")) {
    console.error("💡 Run: npx supabase@v2.34.3 link --project-ref <YOUR_PROJECT_REF>");
  }
  process.exit(1);
}
