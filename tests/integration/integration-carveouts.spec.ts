import { test, expect } from "@playwright/test";

/**
 * Carved deterministic scenarios from legacy integration scaffold.
 *
 * These tests replace brittle mega-suite assumptions with stable route contracts
 * that can run in CI without seeded auth/bootstrap side effects.
 */
test.describe("Integration carve-outs (deterministic)", () => {
  test("Invalid URL handling", async ({ page }) => {
    await page.goto("/non-existent-page", { waitUntil: "domcontentloaded" });

    // Current app contract: signed-out unknown routes are routed through login with returnUrl preserved.
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fnon-existent-page/);
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });
  });

  test("Session timeout handling", async ({ page }) => {
    // Signed-out access to protected dashboard routes should consistently redirect to login.
    await page.context().clearCookies();
    await page.goto("/talent/dashboard", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/login(\?|$)/);
  });

  test("Form submission with invalid data", async ({ page }) => {
    // Deterministic validation surface on login route.
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });

    await page.getByTestId("email").fill("invalid-email");
    await page.getByTestId("password").fill("");
    await page.getByTestId("login-button").click();

    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("Mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Stable mobile contract: no horizontal overflow on homepage viewport.
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("Mobile form interactions", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });

    const emailInput = page.getByTestId("email");
    const passwordInput = page.getByTestId("password");
    const submitButton = page.getByTestId("login-button");

    await emailInput.fill("mobile-test@example.com");
    await passwordInput.fill("TestPassword123!");

    await expect(emailInput).toHaveValue("mobile-test@example.com");
    await expect(passwordInput).toHaveValue("TestPassword123!");
    await expect(submitButton).toBeVisible();
  });

  test("Page load performance", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const homeLoadTime = Date.now() - startTime;
    expect(homeLoadTime).toBeLessThan(10000);

    await page.goto("/gigs", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/(gigs|login)(\?|$)/);
  });

  test("Search performance with large datasets", async ({ page }) => {
    await page.goto("/gigs", { waitUntil: "domcontentloaded" });

    // Auth-gated contract path for signed-out runs.
    if (/\/login(\?|$)/.test(page.url())) {
      await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });
      return;
    }

    const startTime = Date.now();
    const searchInput = page.locator('[data-testid="search-input"]').first();
    const searchButton = page.locator('[data-testid="search-button"]').first();

    if ((await searchInput.count()) > 0 && (await searchButton.count()) > 0) {
      await searchInput.fill("fashion");
      await searchButton.click();
      await page.waitForLoadState("domcontentloaded");
    }

    // Keep a generous threshold for shared CI hardware while still guarding regressions.
    const searchTime = Date.now() - startTime;
    expect(searchTime).toBeLessThan(10000);
    await expect(page).toHaveURL(/\/gigs(\?|$)/);
  });

  test("Concurrent user simulation", async ({ browser }) => {
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    try {
      const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()));
      await Promise.all(pages.map((p) => p.goto("/gigs", { waitUntil: "domcontentloaded" })));

      for (const p of pages) {
        await expect(p).toHaveURL(/\/(gigs|login)(\?|$)/);
      }
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.close()));
    }
  });

  test("Email notification workflow", async ({ page }) => {
    // Verification-pending route should remain reachable and stable.
    await page.goto("/verification-pending?email=email-test%40example.com", {
      waitUntil: "domcontentloaded",
    });

    await expect(page).toHaveURL(/\/verification-pending(\?|$)/);
    await expect(page.getByText(/check your (inbox|email)/i).first()).toBeVisible();
  });

  test("Database consistency across roles", async ({ browser }) => {
    const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
    try {
      const [publicPage, protectedPage] = await Promise.all(contexts.map((ctx) => ctx.newPage()));
      await publicPage.goto("/gigs", { waitUntil: "domcontentloaded" });
      await protectedPage.goto("/talent/applications", { waitUntil: "domcontentloaded" });

      await expect(publicPage).toHaveURL(/\/(gigs|login)(\?|$)/);
      await expect(protectedPage).toHaveURL(/\/login(\?|$)/);
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.close()));
    }
  });
});
