import { test, expect } from "@playwright/test";

/**
 * Screenshot regression (opt-in)
 *
 * Goal: Catch obvious layout/theme regressions on /client/dashboard.
 *
 * This test is opt-in until we have deterministic auth seeding in CI.
 * Enable with: RUN_CLIENT_SCREENSHOT=1
 */

test.describe("client dashboard screenshot (opt-in)", () => {
  test.skip(
    process.env.RUN_CLIENT_SCREENSHOT !== "1",
    "Client dashboard screenshot regression is opt-in (RUN_CLIENT_SCREENSHOT=1) until seeded client login is deterministic."
  );

  test("/client/dashboard matches baseline", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Assumes runner already has an authenticated session cookie.
    await page.goto("/client/dashboard", { waitUntil: "domcontentloaded" });

    // Avoid false positives: if redirected to login, fail.
    await expect(page).toHaveURL(/\/client\/dashboard/);

    // Let client hydration settle.
    await page.waitForTimeout(750);

    // A small threshold keeps this stable across minor font rendering differences.
    await expect(page).toHaveScreenshot("client-dashboard-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});
