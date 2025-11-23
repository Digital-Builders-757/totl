import { test, expect } from "@playwright/test";

const talentEmail = process.env.PLAYWRIGHT_TALENT_EMAIL;
const talentPassword = process.env.PLAYWRIGHT_TALENT_PASSWORD;
const testGigId = process.env.PLAYWRIGHT_TEST_GIG_ID;

async function loginAsTalent(page: import("@playwright/test").Page) {
  if (!talentEmail || !talentPassword) {
    test.skip(true, "PLAYWRIGHT_TALENT_EMAIL and PLAYWRIGHT_TALENT_PASSWORD must be set");
  }

  await page.goto("/login");
  await page.getByLabel(/email/i).fill(talentEmail!);
  await page.getByLabel(/password/i).fill(talentPassword!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForLoadState("networkidle");
}

test.describe("Talent subscription flow (requires test credentials)", () => {
  test.beforeEach(async ({ page }) => {
    if (!talentEmail || !talentPassword) {
      test.skip(true, "Set PLAYWRIGHT_TALENT_EMAIL and PLAYWRIGHT_TALENT_PASSWORD to run these tests");
    }
    await loginAsTalent(page);
  });

  test("shows subscription banner on dashboard for unsubscribed talent", async ({ page }) => {
    await page.goto("/talent/dashboard");
    await expect(page.getByTestId("subscription-banner")).toBeVisible();
  });

  test("locks gig details for unsubscribed talent", async ({ page }) => {
    test.skip(!testGigId, "Set PLAYWRIGHT_TEST_GIG_ID to run gig detail gating test");
    await page.goto(`/gigs/${testGigId}`);
    await expect(page.getByTestId("client-details-locked")).toBeVisible();
  });

  test("blocks apply form when subscription is inactive", async ({ page }) => {
    test.skip(!testGigId, "Set PLAYWRIGHT_TEST_GIG_ID to run apply gating test");
    await page.goto(`/gigs/${testGigId}/apply`);
    await expect(page.getByTestId("subscription-apply-form-gate")).toBeVisible();
  });
});

