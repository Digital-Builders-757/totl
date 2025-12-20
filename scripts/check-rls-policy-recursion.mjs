/**
 * Guardrail: prevent self-referential RLS policies on `public.profiles`.
 *
 * Why:
 * - Postgres throws SQLSTATE 42P17 ("infinite recursion detected in policy for relation \"profiles\"")
 *   when an RLS policy on `profiles` queries `profiles` again (directly or via join).
 *
 * What this does:
 * - Scans `supabase/migrations/*.sql` in filename order.
 * - Simulates policy create/drop for policies ON (public.)profiles only.
 * - Fails the process if any ACTIVE policy on profiles contains `FROM profiles` or `JOIN profiles`.
 * - Prints warnings for historical self-referential policies that are later dropped.
 */

import fs from "node:fs";
import path from "node:path";

function listSqlMigrations(migrationsDir) {
  const entries = fs.readdirSync(migrationsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".sql"))
    .map((e) => path.join(migrationsDir, e.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function normalizeSql(sql) {
  return sql.replace(/\r\n/g, "\n");
}

function stripSqlComments(sql) {
  // Remove line comments and block comments (best-effort).
  const withoutBlock = sql.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutBlock.replace(/--.*$/gm, "");
}

function extractCreatePolicies(sql) {
  // Best-effort parser: capture "CREATE POLICY ... ;" blocks.
  const results = [];
  const re = /CREATE\s+POLICY\s+"([^"]+)"[\s\S]*?;/gi;
  let match;
  while ((match = re.exec(sql)) !== null) {
    results.push({ policyName: match[1], statement: match[0] });
  }
  return results;
}

function extractDropPolicies(sql) {
  // Capture DROP POLICY [IF EXISTS] "name" ON (public.)profiles;
  const results = [];
  const re =
    /DROP\s+POLICY\s+(?:IF\s+EXISTS\s+)?\"([^\"]+)\"\s+ON\s+(?:public\.)?profiles\s*;/gi;
  let match;
  while ((match = re.exec(sql)) !== null) {
    results.push({ policyName: match[1] });
  }
  return results;
}

function isCreateOnProfiles(statement) {
  return /\bON\s+(?:public\.)?profiles\b/i.test(statement);
}

function isSelfReferentialProfilesPolicy(statement) {
  // If the policy is ON profiles, then any FROM/JOIN profiles inside the statement is recursive.
  // We keep this intentionally strict and easy to understand.
  return /\b(from|join)\s+(?:public\.)?profiles\b/i.test(statement);
}

function main() {
  const repoRoot = process.cwd();
  const migrationsDir = path.join(repoRoot, "supabase", "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error(`RLS guardrail: migrations dir not found: ${migrationsDir}`);
    process.exit(2);
  }

  const migrationFiles = listSqlMigrations(migrationsDir);
  const activeProfilesPolicies = new Map(); // policyName -> { createdIn, isSelfRef }
  const historicalSelfRefCreates = []; // { policyName, createdIn, droppedIn? }
  const selfRefCreateStillActive = []; // { policyName, createdIn }

  for (const filePath of migrationFiles) {
    const raw = fs.readFileSync(filePath, "utf8");
    const sql = stripSqlComments(normalizeSql(raw));
    const fileName = path.basename(filePath);

    // Apply drops first (within the same migration, order can matter).
    for (const drop of extractDropPolicies(sql)) {
      activeProfilesPolicies.delete(drop.policyName);

      // If we previously recorded a self-ref create, annotate it as dropped.
      const idx = historicalSelfRefCreates.findIndex(
        (x) => x.policyName === drop.policyName && x.droppedIn == null
      );
      if (idx !== -1) {
        historicalSelfRefCreates[idx] = {
          ...historicalSelfRefCreates[idx],
          droppedIn: fileName,
        };
      }
    }

    for (const create of extractCreatePolicies(sql)) {
      if (!isCreateOnProfiles(create.statement)) continue;

      const selfRef = isSelfReferentialProfilesPolicy(create.statement);
      activeProfilesPolicies.set(create.policyName, { createdIn: fileName, isSelfRef: selfRef });

      if (selfRef) {
        historicalSelfRefCreates.push({
          policyName: create.policyName,
          createdIn: fileName,
          droppedIn: null,
        });
      }
    }
  }

  for (const [policyName, meta] of activeProfilesPolicies.entries()) {
    if (meta.isSelfRef) {
      selfRefCreateStillActive.push({ policyName, createdIn: meta.createdIn });
    }
  }

  for (const x of historicalSelfRefCreates) {
    if (x.droppedIn) {
      console.log(
        `RLS guardrail (info): historical self-referential profiles policy "${x.policyName}" created in ${x.createdIn} was later dropped in ${x.droppedIn}.`
      );
    }
  }

  if (selfRefCreateStillActive.length > 0) {
    console.error("RLS guardrail FAILED: active self-referential RLS policy detected on public.profiles.");
    for (const x of selfRefCreateStillActive) {
      console.error(`- Policy "${x.policyName}" (created in ${x.createdIn}) still appears active in migration sequence.`);
    }
    console.error("Fix: drop or rewrite the policy so it does not query/join profiles within a policy ON profiles.");
    process.exit(1);
  }

  console.log("RLS guardrail OK: no active self-referential RLS policies on public.profiles.");
}

main();


