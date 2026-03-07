import { test, expect } from "@playwright/test";
import { ensureTalentReady, loginWithCredentials } from "../helpers/auth";
import {
  createActiveGigForClient,
  ensureClientFixture,
  ensureTalentFixture,
} from "../helpers/integration-fixtures";
import { createTalentTestUser } from "../helpers/test-data";

let testGigId: string | null = null;

test.describe("Talent subscription flow", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const talentUser = createTalentTestUser("pw-subscription-talent", testInfo, {
      firstName: "Subscription",
      lastName: "Talent",
      variant: "integration",
    });
    const clientUser = createTalentTestUser("pw-subscription-client", testInfo, {
      firstName: "Subscription",
      lastName: "Client",
      variant: "integration",
    });

    const { userId: clientUserId } = await ensureClientFixture(clientUser);
    await ensureTalentFixture(talentUser);
    testGigId = await createActiveGigForClient(clientUserId, `subscription-${testInfo.workerIndex}`);

    await loginWithCredentials(
      page,
      { email: talentUser.email, password: talentUser.password },
      { returnUrl: "/talent/dashboard" }
    );
    await ensureTalentReady(page);
  });

  test("shows subscription banner on dashboard for unsubscribed talent", async ({ page }) => {
    await page.goto("/talent/dashboard");
    await expect(page.getByTestId("subscription-banner")).toBeVisible();
  });

  test("locks gig details for unsubscribed talent", async ({ page }) => {
    expect(testGigId).toBeTruthy();
    await page.goto(`/gigs/${testGigId}`);
    await expect(page.getByTestId("client-details-locked")).toBeVisible();
  });

  test("blocks apply form when subscription is inactive", async ({ page }) => {
    expect(testGigId).toBeTruthy();
    await page.goto(`/gigs/${testGigId}/apply`);
    await expect(page.getByTestId("subscription-apply-form-gate")).toBeVisible();
  });
});

