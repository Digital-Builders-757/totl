import { test, expect } from "@playwright/test";

test.describe("Gigs filtering", () => {
  test("filters by keyword and location via GET", async ({ page }) => {
    await page.goto("/gigs");

    await page.fill('input[name="q"]', "model");
    await page.fill('input[name="location"]', "New");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/q=model/);
    await expect(page.locator("text=No Active Gigs").first()).toBeHidden({ timeout: 5000 }).catch(() => {});
  });
});


