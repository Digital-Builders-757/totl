import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const env = {
  ...process.env,
  DISABLE_EMAIL_SENDING: "1",
  INTERNAL_EMAIL_API_KEY: "dev-internal-email-key",
  NEXT_TELEMETRY_DISABLED: "1",
};

const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
if (!existsSync(buildIdPath)) {
  const build = spawnSync("npm run build", {
    env,
    shell: true,
    stdio: "inherit",
  });

  if (build.status !== 0) {
    process.exit(build.status ?? 1);
  }
}

const start = spawn("npm run start", {
  env,
  shell: true,
  stdio: "inherit",
});

const forwardSignal = (signal) => {
  if (!start.killed) {
    start.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

start.on("exit", (code) => {
  process.exit(code ?? 1);
});
