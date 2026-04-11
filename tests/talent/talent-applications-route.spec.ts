import { expect, test } from "@playwright/test";
import { ensureTalentReady, loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Talent applications route contracts", () => {
  test("applications tab shell renders on talent dashboard", async ({ page }) => {
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/dashboard");

    await page.getByRole("tab", { name: /Applications/i }).first().click();

    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);
    await expect(page.getByRole("heading", { name: "My Applications" })).toBeVisible();
    await expect(
      page.getByText("Track all your opportunity applications and their status")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Filter" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
  });

  test("applications tab exposes either empty state or application rows", async ({ page }) => {
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/dashboard");

    await page.getByRole("tab", { name: /Applications/i }).first().click();
    await expect(page.getByRole("heading", { name: "My Applications" })).toBeVisible();

    const emptyState = page.getByRole("heading", { name: "No Applications Yet" });
    const detailsAction = page.getByRole("button", { name: "View Details" });

    if (await emptyState.isVisible()) {
      await expect(
        page.getByRole("button", { name: "Browse Opportunities" })
      ).toBeVisible();
      return;
    }

    await expect(detailsAction.first()).toBeVisible();
  });
});

test.describe("Talent applications route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("applications tab remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/dashboard");

    await page.getByRole("tab", { name: /Applications/i }).first().click();
    await expect(page.getByRole("heading", { name: "My Applications" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
