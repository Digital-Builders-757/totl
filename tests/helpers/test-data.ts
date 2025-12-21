export interface TestUserIdentity {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

function randomToken(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function getTestPassword() {
  return process.env.PLAYWRIGHT_TEST_PASSWORD ?? "TestPassword123!";
}

export function createTestEmail(prefix: string) {
  const runId = Date.now();
  return `${prefix}-${runId}-${randomToken()}@example.com`;
}

export function createTalentTestUser(prefix: string, overrides?: Partial<TestUserIdentity>): TestUserIdentity {
  const email = overrides?.email ?? createTestEmail(prefix);
  const password = overrides?.password ?? getTestPassword();
  const firstName = overrides?.firstName ?? "Playwright";
  const lastName = overrides?.lastName ?? `Talent${Date.now()}`;

  return { email, password, firstName, lastName };
}


