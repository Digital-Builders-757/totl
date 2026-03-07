import { expect, test } from "@playwright/test";
import { ensureTalentReady, loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Talent billing route contracts", () => {
  test("billing settings shell and key cards render", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/settings/billing");

    await expect(page).toHaveURL(/\/talent\/settings\/billing(\/|$)/);
    await expect(page.getByRole("heading", { name: "Billing Settings" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Subscription Snapshot" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Billing Actions" })).toBeVisible();
    await expect(page.getByText("Status:", { exact: false }).first()).toBeVisible();
  });

  test("billing page action and plan-details disclosure are interactive", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/settings/billing");

    const showPlanDetailsButton = page.getByRole("button", { name: "Show plan details" });
    const hidePlanDetailsButton = page.getByRole("button", { name: "Hide plan details" });

    if (await showPlanDetailsButton.isVisible()) {
      await showPlanDetailsButton.click();
      await expect(hidePlanDetailsButton).toBeVisible();
    } else {
      await expect(hidePlanDetailsButton).toBeVisible();
      await hidePlanDetailsButton.click();
      await expect(showPlanDetailsButton).toBeVisible();
    }

    const choosePlanLink = page.getByRole("link", { name: "Choose Plan" });
    const manageSubscriptionButton = page.getByRole("button", { name: "Manage Subscription" });

    if (await choosePlanLink.isVisible().catch(() => false)) {
      await expect(choosePlanLink).toHaveAttribute("href", "/talent/subscribe");
      return;
    }

    await expect(manageSubscriptionButton).toBeVisible();
  });
});

test.describe("Talent billing route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile billing shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/talent/settings/billing");

    await expect(page).toHaveURL(/\/talent\/settings\/billing(\/|$)/);
    // Heading is the stable ownership marker for this route on mobile.
    await expect(page.getByRole("heading", { name: "Billing Settings" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
