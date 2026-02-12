import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * Mobile horizontal overflow sentinel
 *
 * Goal: Catch regressions where the page becomes horizontally scrollable on mobile.
 * Keep this suite small + public-route only to stay fast and reliable.
 */

async function expectNoHorizontalOverflow(page: Page, label: string) {
  // Avoid networkidle in dev-mode (can hang due to long-lived connections).
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

async function gotoAndAssertNoOverflow(
  page: Page,
  url: string,
  label: string,
  ready?: Locator
) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (ready) {
    // In Next.js dev mode, first-hit route compilation can be slow.
    await expect(ready).toBeVisible({ timeout: 60000 });
  }
  await expectNoHorizontalOverflow(page, label);
}

test.describe("UI overflow sentinel (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14-ish
  test.describe.configure({ mode: "serial" }); // avoid dev-server compile contention

  test("home has no horizontal overflow", async ({ page }) => {
    await gotoAndAssertNoOverflow(
      page,
      "/",
      "home",
      page.locator('text=Connect with').first()
    );
  });

  test("login has no horizontal overflow", async ({ page }) => {
    await gotoAndAssertNoOverflow(
      page,
      "/login",
      "login",
      page.getByTestId("login-hydrated")
    );
  });

  test("choose role has no horizontal overflow", async ({ page }) => {
    await page.goto("/choose-role", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60000 });
    await expectNoHorizontalOverflow(page, "choose role");
  });

  test("verification pending (long email) has no horizontal overflow", async ({ page }) => {
    const longEmail =
      "very.long.email.address.with.lots.of.parts.and.a.long.subdomain+tag@example-very-long-domain-name.com";

    await gotoAndAssertNoOverflow(
      page,
      `/verification-pending?email=${encodeURIComponent(longEmail)}&new=true`,
      "verification pending",
      page.locator('text=Verify your email')
    );
  });

  test("talent signup redirect (to choose role) has no horizontal overflow", async ({ page }) => {
    await page.goto("/talent/signup", { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/choose-role/, { timeout: 60000 });
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60000 });
    await expectNoHorizontalOverflow(page, "talent signup redirect → choose role");
  });

  test("client apply page has no horizontal overflow", async ({ page }) => {
    await gotoAndAssertNoOverflow(
      page,
      "/client/apply",
      "client apply",
      page.locator('h1:has-text("Career Builder Application")')
    );
  });

  test("client apply success (long applicationId) has no horizontal overflow", async ({ page }) => {
    const longId = "4f4e99aa-1234-5678-9abc-0123456789ab";
    await gotoAndAssertNoOverflow(
      page,
      `/client/apply/success?applicationId=${encodeURIComponent(longId)}`,
      "client apply success",
      page.locator('text=Application Submitted Successfully')
    );
  });

  test("client application status (prefilled long applicationId) has no horizontal overflow", async ({
    page,
  }) => {
    const longId = "4f4e99aa-1234-5678-9abc-0123456789ab";
    await gotoAndAssertNoOverflow(
      page,
      `/client/application-status?applicationId=${encodeURIComponent(longId)}`,
      "client application status",
      page.locator('text=Check Your Application Status')
    );
  });

  test("gigs (signed out sign-in gate) has no horizontal overflow", async ({ page }) => {
    await gotoAndAssertNoOverflow(
      page,
      "/gigs",
      "gigs (signed out)",
      page.locator('h1:has-text("Unlock Amazing Gigs")')
    );
  });

  test("talent (signed out) has no horizontal overflow", async ({ page }) => {
    // /talent is intentionally disabled (true 404). Ensure no mobile overflow on the 404 surface.
    await gotoAndAssertNoOverflow(page, "/talent", "talent (404)");
  });

  test("client dashboard has no horizontal overflow", async ({ page }) => {
    test.skip(
      process.env.RUN_CLIENT_OVERFLOW !== "1",
      "Client overflow sentinel is opt-in (RUN_CLIENT_OVERFLOW=1) until seeded client login is deterministic in CI/dev."
    );

    // NOTE: This test assumes the runner is already authenticated.
    await page.goto("/client/dashboard", { waitUntil: "domcontentloaded" });

    // If auth isn't present, Next will redirect to /login; fail fast to avoid false confidence.
    await expect(page).toHaveURL(/\/client\/dashboard/);

    await expectNoHorizontalOverflow(page, "client dashboard");
  });
});

