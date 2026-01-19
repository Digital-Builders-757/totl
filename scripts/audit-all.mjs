import { spawnSync } from "node:child_process";

const cmds = [
  ["node", "scripts/audit-client-boundaries.mjs"],
  ["node", "scripts/audit-select-star.mjs"],
  ["node", "scripts/audit-single-vs-maybe-single.mjs"],
];

let failed = false;

for (const cmd of cmds) {
  const res = spawnSync(cmd[0], cmd.slice(1), { stdio: "inherit" });
  if (res.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
