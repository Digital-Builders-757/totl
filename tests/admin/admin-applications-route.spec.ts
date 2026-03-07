import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Admin applications route contracts", () => {
  test("applications shell and segmentation tabs render", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/applications");

    await expect(page).toHaveURL(/\/admin\/applications(\/|$)/);
    await expect(page.getByRole("heading", { name: "Talent Applications" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /New \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Approved \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Rejected \(/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder("Search applications")).toBeVisible();
  });

  test("new applications tab supports empty or row state", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/applications");

    await page.getByRole("tab", { name: /New \(/i }).first().click();
    await expect(page.getByRole("tab", { name: /New \(/i }).first()).toBeVisible();

    const emptyState = page.getByText("No new applications found.");
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const desktopRow = await page.locator("tbody tr").first().isVisible().catch(() => false);
    const mobileRow = await page.getByText(/Application #/).first().isVisible().catch(() => false);
    expect(desktopRow || mobileRow).toBeTruthy();
  });

  test("application details route remains reachable from list when rows exist", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/applications");

    const emptyState = page.getByText("No new applications found.");
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const inlineDetailLink = page.getByRole("link", { name: /view details/i }).first();
    if (await inlineDetailLink.isVisible().catch(() => false)) {
      await inlineDetailLink.click();
    } else {
      const actionsTrigger = page.locator("tbody tr").first().getByRole("button");
      await expect(actionsTrigger).toBeVisible();
      await actionsTrigger.click();
      await page.getByRole("menuitem", { name: /view details/i }).click();
    }

    await expect(page).toHaveURL(/\/admin\/applications\/[^/?#]+/);
  });
});

test.describe("Admin applications route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile list/detail shell stays reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/applications");

    await expect(page).toHaveURL(/\/admin\/applications(\/|$)/);
    await expect(page.getByRole("heading", { name: "Talent Applications" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /New \(/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();

    const emptyState = page.getByText("No new applications found.");
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    const inlineDetailLink = page.getByRole("link", { name: /view details/i }).first();
    if (await inlineDetailLink.isVisible().catch(() => false)) {
      await inlineDetailLink.click();
    } else {
      const actionsTrigger = page.locator("tbody tr").first().getByRole("button");
      await expect(actionsTrigger).toBeVisible();
      await actionsTrigger.click();
      await page.getByRole("menuitem", { name: /view details/i }).click();
    }

    await expect(page).toHaveURL(/\/admin\/applications\/[^/?#]+/);
  });
});
