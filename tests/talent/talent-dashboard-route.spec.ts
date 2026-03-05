import { expect, test } from "@playwright/test";
import { ensureTalentReady, loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Talent dashboard route contracts", () => {
  test("dashboard overview shell renders", async ({ page }) => {
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/dashboard");

    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);
    await expect(page.getByRole("heading", { name: "Overview" }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Overview/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Applications/i }).first()).toBeVisible();
  });

  test("applications tab is accessible from dashboard", async ({ page }) => {
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/dashboard");

    await page.getByRole("tab", { name: /Applications/i }).first().click();
    await expect(page.getByText(/My TalentApplications/i).first()).toBeVisible();
  });
});

test.describe("Talent dashboard route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile dashboard shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/dashboard");

    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);
    // Mobile header density can collapse the large section heading;
    // tab-rail visibility is the stable contract marker.
    await expect(page.getByRole("tab", { name: /Overview/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
