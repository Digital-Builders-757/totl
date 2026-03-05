import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Admin talent route contracts", () => {
  test("talent shell and controls render", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/talent");

    await expect(page).toHaveURL(/\/admin\/talent(\/|$)/);
    await expect(page.getByRole("heading", { name: "All Talent" })).toBeVisible();
    await expect(
      page.getByPlaceholder("Search by name, location, or specialty...")
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Talent Profiles" })).toBeVisible();
  });

  test("talent list supports empty and row states", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/talent");

    const emptyState = page.getByRole("heading", { name: "No Talent Found" });
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const mobileRow = await page.locator('[class*="MobileListRowCard"], [data-testid*="mobile"]').first().isVisible().catch(() => false);
    const desktopRow = await page.locator("tbody tr").first().isVisible().catch(() => false);
    expect(mobileRow || desktopRow).toBeTruthy();
  });
});

test.describe("Admin talent route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile list shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/talent");

    await expect(page).toHaveURL(/\/admin\/talent(\/|$)/);
    await expect(page.getByRole("heading", { name: "All Talent" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
