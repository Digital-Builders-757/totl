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
  test("/client/dashboard matches baseline", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/client/dashboard", { waitUntil: "domcontentloaded" });

    if (process.env.RUN_CLIENT_SCREENSHOT === "1") {
      // Opt-in visual regression mode: assumes an authenticated seeded client session.
      await expect(page).toHaveURL(/\/client\/dashboard/);
      await page.waitForTimeout(750);
      await expect(page).toHaveScreenshot("client-dashboard-mobile.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
      return;
    }

    // Default deterministic mode: assert route contract (dashboard access or auth redirect).
    await expect(page).toHaveURL(/\/(client\/dashboard|login)(\?|$)/);
  });
});
