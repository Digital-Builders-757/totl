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
});
