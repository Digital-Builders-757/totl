import { expect, test } from "@playwright/test";
import { ensureTalentReady, loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Talent gigs/apply route contracts", () => {
  test("gigs listing shell renders for talent", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/gigs");

    await expect(page).toHaveURL(/\/gigs(\?|$)/);
    await expect(page.getByRole("heading", { name: "Find Opportunities" })).toBeVisible();
    await expect(page.getByPlaceholder("Search keywords...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  });

  test("gig details and apply route contracts stay reachable", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/gigs");

    const viewDetailsLink = page.getByRole("link", { name: /View Details/i }).first();
    const noGigsHeading = page.getByRole("heading", { name: "No Active Opportunities" });
    const hasNoGigs = await noGigsHeading.isVisible();
    test.skip(hasNoGigs, "Seed has no active gigs to validate details/apply route contracts");

    await viewDetailsLink.click();
    await expect(page).toHaveURL(/\/gigs\/[^/]+(\/|$)/);
    await expect(page.getByRole("heading", { name: "Apply for this Opportunity" })).toBeVisible();

    const gigId = page.url().match(/\/gigs\/([^/?#]+)/)?.[1];
    if (!gigId) {
      throw new Error(`Unable to extract gig id from URL: ${page.url()}`);
    }

    await safeGoto(page, `/gigs/${gigId}/apply`);
    await expect(page).toHaveURL(new RegExp(`/gigs/${gigId}/apply(\\?|$)`));
    await expect(page.getByRole("heading", { name: "Submit Application" })).toBeVisible();

    const canSubmit = await page
      .getByRole("button", { name: "Submit Application" })
      .isVisible()
      .catch(() => false);
    const alreadyApplied = await page
      .getByText("You have already applied for this gig.", { exact: false })
      .isVisible()
      .catch(() => false);
    const subscriptionGate = await page
      .getByText("Subscribe to unlock applications.", { exact: false })
      .isVisible()
      .catch(() => false);

    expect(canSubmit || alreadyApplied || subscriptionGate).toBeTruthy();
  });
});

test.describe("Talent gigs/apply route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("gigs listing shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/gigs");

    await expect(page).toHaveURL(/\/gigs(\?|$)/);
    await expect(page.getByRole("heading", { name: "Find Opportunities" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
