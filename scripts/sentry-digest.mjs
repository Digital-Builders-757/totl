#!/usr/bin/env node
/**
 * Sentry Digest
 *
 * Minimal, read-only issue digest for a single org + project.
 * Uses SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT from .env.local (or process env).
 *
 * Usage:
 *   node scripts/sentry-digest.mjs
 *   node scripts/sentry-digest.mjs --since=24h --limit=10
 *   node scripts/sentry-digest.mjs --project=totlmodelagency --since=24h --limit=10
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, "../.env.local") });

function parseArgs(argv) {
  const args = { since: "24h", limit: 10, project: undefined };
  for (const raw of argv.slice(2)) {
    if (raw.startsWith("--since=")) args.since = raw.split("=", 2)[1] || args.since;
    if (raw.startsWith("--limit=")) {
      const n = Number(raw.split("=", 2)[1]);
      if (Number.isFinite(n) && n > 0) args.limit = n;
    }
    if (raw.startsWith("--project=")) args.project = raw.split("=", 2)[1] || args.project;
  }
  return args;
}

const apiBase = "https://sentry.io/api/0";

async function main() {
  const { since, limit, project: projectArg } = parseArgs(process.argv);

  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const projectEnv = process.env.SENTRY_PROJECT;
  const project = projectArg || projectEnv;

  if (!token || !org) {
    console.error("❌ Missing Sentry env vars. Need SENTRY_AUTH_TOKEN and SENTRY_ORG in .env.local");
    process.exitCode = 1;
    return;
  }

  const projectFilter = project ? `project:${project}` : "";

  async function sentryGet(path) {
    const res = await fetch(`${apiBase}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Sentry API error ${res.status} ${res.statusText}: ${body}`);
    }

    return res.json();
  }

  function issueUrl(orgSlug, issueId) {
    return `https://${orgSlug}.sentry.io/issues/${issueId}/`;
  }

  console.log(`\n📡 Sentry digest: org=${org} project=${project} since=${since} limit=${limit}\n`);

  // Most actionable: unresolved issues, ordered by frequency.
  const sinceFilter = since.startsWith("+") || since.startsWith("-")
    ? `lastSeen:${since}`
    : since.match(/^\d{4}-\d{2}-\d{2}/)
      ? `lastSeen:${since}`
      : `lastSeen:+${since}`;

  const query = new URLSearchParams({
    query: `is:unresolved ${projectFilter} ${sinceFilter}`,
    sort: "freq",
    limit: String(limit),
  }).toString();

  const issues = await sentryGet(`/organizations/${org}/issues/?${query}`);

  if (!Array.isArray(issues) || issues.length === 0) {
    console.log("✅ No unresolved issues found for that window.");
    process.exitCode = 0;
    return;
  }

  for (const i of issues) {
    const id = i.id;
    const title = i.title || i.metadata?.value || i.culprit || "(no title)";
    const level = i.level || "unknown";
    const events = i.count ?? "?";
    const users = i.userCount ?? "?";
    const lastSeen = i.lastSeen ?? "?";

    console.log(`- [${level}] ${title}`);
    console.log(`  events=${events} users=${users} lastSeen=${lastSeen}`);
    console.log(`  ${issueUrl(org, id)}`);
  }

  console.log("");
}

main().catch((err) => {
  console.error("\n❌ Sentry digest failed:\n", err?.message || err);
  process.exitCode = 1;
});
