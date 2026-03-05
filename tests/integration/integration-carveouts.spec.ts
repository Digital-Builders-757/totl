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
});
