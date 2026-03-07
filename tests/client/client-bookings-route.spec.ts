import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Client bookings route contracts", () => {
  test("bookings shell and segmentation tabs render", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/bookings");

    await expect(page).toHaveURL(/\/client\/bookings(\/|$)/);
    await expect(page.getByRole("heading", { name: "Bookings" }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Pending \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Confirmed \(/i }).first()).toBeVisible();
  });

  test("bookings tabs are interactive and show empty or row state", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/bookings");

    await page.getByRole("tab", { name: /Pending \(/i }).first().click();
    await expect(page.getByRole("tab", { name: /Pending \(/i }).first()).toBeVisible();

    const emptyState = page.getByRole("heading", { name: "No bookings found" });
    if (await emptyState.isVisible()) {
      const pendingPanel = page.getByRole("tabpanel", { name: /Pending \(/i });
      await expect(
        pendingPanel.getByRole("link", { name: "View Applications" })
      ).toBeVisible();
      return;
    }

    await expect(page.getByRole("button", { name: "View Talent Profile" }).first()).toBeVisible();
  });
});

test.describe("Client bookings route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile bookings shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/bookings");

    await expect(page).toHaveURL(/\/client\/bookings(\/|$)/);
    await expect(page.getByRole("heading", { name: "Bookings" }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
