import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Admin dashboard route contracts", () => {
  test("dashboard shell and primary tabs render", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/dashboard");

    await expect(page).toHaveURL(/\/admin\/dashboard(\/|$)/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Overview" }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Gigs" }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Applications" }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Analytics" }).first()).toBeVisible();
  });

  test("dashboard quick actions and key cards remain reachable", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/dashboard");

    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create New Gig/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Review Applications/i })).toBeVisible();
    await expect(page.getByTestId("paid-talent-card")).toBeVisible();
  });
});

test.describe("Admin dashboard route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile dashboard shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/dashboard");

    await expect(page).toHaveURL(/\/admin\/dashboard(\/|$)/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Overview" }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
