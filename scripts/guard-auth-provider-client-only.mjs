import { readFileSync } from "node:fs";
import path from "node:path";

const filePath = path.join(process.cwd(), "components", "auth", "auth-provider.tsx");
const content = readFileSync(filePath, "utf8");

function firstRealLine(source) {
  const lines = source.split(/\r?\n/);
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
    return line;
  }
  return "";
}

const first = firstRealLine(content);
if (first !== '"use client";' && first !== "'use client';") {
  process.stderr.write(
    '[guard:auth-provider-client-only] components/auth/auth-provider.tsx must start with "use client".\n'
  );
  process.exit(1);
}

process.stdout.write("[guard:auth-provider-client-only] OK\n");
