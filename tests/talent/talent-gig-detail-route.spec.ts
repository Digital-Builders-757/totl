import { expect, test } from "@playwright/test";
import { ensureTalentReady, loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Talent gig detail route contracts", () => {
  test("gig detail shell renders stable sections", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/gigs");

    const noGigsHeading = page.getByRole("heading", { name: "No Active Opportunities" });
    if (await noGigsHeading.isVisible()) {
      test.skip(true, "Seed has no active gigs to validate /gigs/[id] contracts");
    }

    await page.getByRole("link", { name: /View Details/i }).first().click();
    await expect(page).toHaveURL(/\/gigs\/[^/]+(\/|$)/);

    await expect(page.getByRole("heading", { name: "Gig Details" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Client Information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Apply for this Opportunity" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Quick Info" })).toBeVisible();
  });

  test("gig detail route preserves back navigation to gigs list", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/gigs");

    const noGigsHeading = page.getByRole("heading", { name: "No Active Opportunities" });
    if (await noGigsHeading.isVisible()) {
      test.skip(true, "Seed has no active gigs to validate apply sidebar contracts");
    }

    await page.getByRole("link", { name: /View Details/i }).first().click();
    await expect(page).toHaveURL(/\/gigs\/[^/]+(\/|$)/);
    await expect(page.getByRole("heading", { name: "Apply for this Opportunity" })).toBeVisible();

    const backLink = page.getByRole("link", { name: "Back to All Opportunities" });
    await expect(backLink).toHaveAttribute("href", "/gigs");
    await safeGoto(page, "/gigs");
    await expect(page).toHaveURL(/\/gigs(\?|$)/);
  });
});

test.describe("Talent gig detail route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("gig detail/apply surfaces remain reachable on mobile viewport", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);
    await safeGoto(page, "/gigs");

    const noGigsHeading = page.getByRole("heading", { name: "No Active Opportunities" });
    if (await noGigsHeading.isVisible()) {
      test.skip(true, "Seed has no active gigs to validate mobile /gigs/[id] contracts");
    }

    await page.getByRole("link", { name: /View Details/i }).first().click();
    await expect(page).toHaveURL(/\/gigs\/[^/]+(\/|$)/);
    await expect(page.getByRole("heading", { name: "Apply for this Opportunity" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();

    const gigId = page.url().match(/\/gigs\/([^/?#]+)/)?.[1];
    if (!gigId) {
      throw new Error(`Unable to extract gig id from URL: ${page.url()}`);
    }

    await safeGoto(page, `/gigs/${gigId}/apply`);
    await expect(page).toHaveURL(new RegExp(`/gigs/${gigId}/apply(\\?|$)`));
    await expect(page.getByRole("heading", { name: "Submit Application" })).toBeVisible();
  });
});
