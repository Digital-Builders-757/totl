import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Admin moderation route contracts", () => {
  test("moderation shell and status buckets render", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/moderation");

    await expect(page).toHaveURL(/\/admin\/moderation(\/|$)/);
    await expect(page.getByRole("heading", { name: "Moderation Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: /All \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Open \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /In Review \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Resolved \(/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Dismissed \(/i })).toBeVisible();
  });

  test("open bucket supports empty and table states", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/moderation");

    await page.getByRole("button", { name: /Open \(/i }).click();
    await expect(page.getByRole("button", { name: /Open \(/i })).toBeVisible();

    const emptyState = page.getByText("No reports in this bucket.");
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(page.getByRole("columnheader", { name: "Resource" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  });
});

test.describe("Admin moderation route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile moderation shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/moderation");

    await expect(page).toHaveURL(/\/admin\/moderation(\/|$)/);
    await expect(page.getByRole("heading", { name: "Moderation Queue" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Open \(/i })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
