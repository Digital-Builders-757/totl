import type { TestInfo } from "@playwright/test";

export interface TestUserIdentity {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export function getTestPassword() {
  return process.env.PLAYWRIGHT_TEST_PASSWORD ?? "TestPassword123!";
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getRunId() {
  return (
    process.env.PLAYWRIGHT_RUN_ID ??
    process.env.GITHUB_RUN_ID ??
    process.env.GITHUB_SHA?.slice(0, 7) ??
    (process.env.CI ? "ci" : "local")
  );
}

/**
 * Deterministic email for a spec, based on test identity + worker.
 * This avoids random/Date.now() drift while staying collision-resistant across parallel workers.
 */
export function createDeterministicTestEmail(prefix: string, testInfo: TestInfo, variant?: string) {
  const runId = getRunId();
  const scope = slugify([testInfo.project.name, `w${testInfo.workerIndex}`, testInfo.title, variant]
    .filter(Boolean)
    .join("-"));
  return `${slugify(prefix)}-${runId}-${scope}@example.com`;
}

function isTestInfo(x: unknown): x is TestInfo {
  return Boolean(
    x &&
      typeof x === "object" &&
      "title" in x &&
      "workerIndex" in x &&
      "project" in x
  );
}

let legacyCounter = 0;

function getFallbackTestInfo(prefix: string, variant?: string): TestInfo {
  // NOTE: Only used as a transitional fallback for older specs.
  // Prefer passing `testInfo` so identities are deterministic per spec.
  const title = `${prefix}-${variant ?? "default"}-${legacyCounter++}`;
  return {
    // minimal shape for our email builder
    title,
    workerIndex: 0,
    project: { name: "chromium" },
  } as unknown as TestInfo;
}

export function createTalentTestUser(
  prefix: string,
  testInfoOrOverrides: TestInfo | (Partial<TestUserIdentity> & { variant?: string }),
  overridesMaybe?: Partial<TestUserIdentity> & { variant?: string }
): TestUserIdentity {
  const testInfo = isTestInfo(testInfoOrOverrides)
    ? testInfoOrOverrides
    : getFallbackTestInfo(prefix, testInfoOrOverrides?.variant);

  const overrides = (isTestInfo(testInfoOrOverrides) ? overridesMaybe : testInfoOrOverrides) ?? undefined;

  const email = overrides?.email ?? createDeterministicTestEmail(prefix, testInfo, overrides?.variant);
  const password = overrides?.password ?? getTestPassword();
  const firstName = overrides?.firstName ?? "Playwright";
  const lastName = overrides?.lastName ?? `Talent W${testInfo.workerIndex}`;

  return { email, password, firstName, lastName };
}
