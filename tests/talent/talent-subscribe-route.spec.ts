import { expect, test } from "@playwright/test";
import { ensureTalentReady, loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Talent subscribe route contracts", () => {
  test("subscribe route shows plans or redirects to billing", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/subscribe");

    if (/\/talent\/settings\/billing(\/|$)/.test(page.url())) {
      await expect(page.getByRole("heading", { name: "Billing Settings" })).toBeVisible();
      return;
    }

    await expect(page).toHaveURL(/\/talent\/subscribe(\/|$)/);
    await expect(page.getByRole("heading", { name: "Unlock Your Full Potential" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Monthly Plan" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Annual Plan" })).toBeVisible();
  });

  test("subscribe success and cancelled pages render expected CTAs", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);

    await safeGoto(page, "/talent/subscribe/success");
    await expect(page).toHaveURL(/\/talent\/subscribe\/success(\/|$)/);
    await expect(page.getByRole("heading", { name: "Welcome to TOTL Agency Premium!" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse Gigs" })).toBeVisible();

    await safeGoto(page, "/talent/subscribe/cancelled");
    await expect(page).toHaveURL(/\/talent\/subscribe\/cancelled(\/|$)/);
    await expect(page.getByRole("heading", { name: "Subscription Cancelled" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Try Again" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to Dashboard" })).toBeVisible();
  });
});

test.describe("Talent subscribe route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile subscribe flow remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/subscribe");

    if (/\/talent\/settings\/billing(\/|$)/.test(page.url())) {
      // Redirected billing heading is the stable contract marker for subscribed accounts.
      await expect(page.getByRole("heading", { name: "Billing Settings" })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/talent\/subscribe(\/|$)/);
      await expect(page.getByRole("heading", { name: "Unlock Your Full Potential" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Start Monthly Plan" })).toBeVisible();
    }

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
