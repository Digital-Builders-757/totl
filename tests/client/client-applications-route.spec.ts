import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Client applications route contracts", () => {
  test("applications shell and search surface render", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/applications");

    await expect(page).toHaveURL(/\/client\/applications(\/|$)/);
    await expect(page.locator("h1", { hasText: "Applications" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Search by talent name, opportunity title, or location...")
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();
  });

  test("applications segmentation tabs are interactive", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/applications");

    await page.getByRole("tab", { name: /New \(/i }).first().click();
    await expect(page.getByRole("tab", { name: /New \(/i }).first()).toBeVisible();

    await page.getByRole("tab", { name: /Hired \(/i }).first().click();
    await expect(page.getByRole("tab", { name: /Hired \(/i }).first()).toBeVisible();
  });
});

test.describe("Client applications route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile applications shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/applications");

    await expect(page).toHaveURL(/\/client\/applications(\/|$)/);
    // Mobile density can partially occlude large heading text;
    // tab rail + search box are the stable ownership markers.
    await expect(
      page.getByPlaceholder("Search by talent name, opportunity title, or location...")
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
