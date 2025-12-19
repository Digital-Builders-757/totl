import { test, expect, type Page } from "@playwright/test";

/**
 * Auth-required horizontal overflow sentinel (admin)
 *
 * Keep this separate from the public sentinel to avoid inheriting auth flakiness.
 * Uses the existing deterministic admin seed endpoint.
 */

const adminUser = {
  email: "admin@totlagency.com",
  password: "AdminPassword123!",
};

async function loginAsAdmin(page: Page) {
  await page.request.post("/api/admin/create-user", {
    data: {
      email: adminUser.email,
      password: adminUser.password,
      firstName: "Admin",
      lastName: "TOTL",
      role: "admin",
    },
  });

  await page.context().clearCookies();
  // Use explicit returnUrl so the login page deterministically navigates to the admin surface.
  await page.goto("/login?returnUrl=/admin/dashboard&signedOut=true", { waitUntil: "domcontentloaded" });
  await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 60_000 });
  await page.getByTestId("email").fill(adminUser.email);
  await page.getByTestId("password").fill(adminUser.password);
  await Promise.all([
    page.waitForURL((url) => new URL(url).pathname === "/admin/dashboard", { timeout: 60_000 }),
    page.getByTestId("login-button").click(),
  ]);
}

async function expectNoHorizontalOverflow(page: Page, label: string) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    const el = document.documentElement;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  });

  expect(
    metrics.scrollWidth,
    `${label}: horizontal overflow detected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test.describe("Admin overflow sentinel (mobile)", () => {
  test.skip(
    process.env.RUN_AUTH_OVERFLOW !== "1",
    "Auth overflow sentinel is opt-in (RUN_AUTH_OVERFLOW=1) until admin login flow is fully stable in CI/dev."
  );
  test.setTimeout(120_000);
  test.use({ viewport: { width: 390, height: 844 } });
  test.describe.configure({ mode: "serial" });

  test("admin dashboard has no horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator('[data-testid="admin-header"]')).toBeVisible({ timeout: 60_000 });
    await expectNoHorizontalOverflow(page, "admin dashboard");
  });
});

