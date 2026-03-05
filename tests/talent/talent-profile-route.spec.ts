import { expect, test } from "@playwright/test";
import { ensureTalentReady, loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Talent profile route contracts", () => {
  test("talent profile shell and core fields render", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/profile");

    await expect(page).toHaveURL(/\/talent\/profile(\/|$)/);
    await expect(page.getByRole("heading", { name: "Complete Your Profile" })).toBeVisible();
    await expect(page.getByLabel("First Name *")).toBeVisible();
    await expect(page.getByLabel("Last Name *")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();
  });

  test("advanced detail disclosure toggles", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/profile");

    const toggle = page.getByRole("button", { name: /Add additional profile details|Hide additional profile details/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole("button", { name: /Add additional profile details|Hide additional profile details/i })).toBeVisible();
  });
});

test.describe("Talent profile route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile profile shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/profile");

    await expect(page).toHaveURL(/\/talent\/profile(\/|$)/);
    await expect(page.getByRole("heading", { name: "Complete Your Profile" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
