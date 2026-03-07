import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Client dashboard route contracts", () => {
  test("dashboard shell and primary tabs render", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/dashboard");

    await expect(page).toHaveURL(/\/client\/dashboard(\/|$)/);
    await expect(page.locator("h1", { hasText: "Career Builder Dashboard" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Overview/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /My Gigs/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Applications/i }).first()).toBeVisible();
  });

  test("applications tab is reachable from dashboard segmentation", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/dashboard");

    await page.getByRole("tab", { name: /Applications/i }).first().click();
    await expect(page.getByRole("heading", { name: "Applications" }).first()).toBeVisible();
  });
});

test.describe("Client dashboard route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile dashboard shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/dashboard");

    await expect(page).toHaveURL(/\/client\/dashboard(\/|$)/);
    // Tab rail is the stable contract marker across mobile density states.
    await expect(page.getByRole("tab", { name: /Overview/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
