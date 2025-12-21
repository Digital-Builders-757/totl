import { test, expect } from "@playwright/test";
import { ensureTalentReady, loginWithCredentials } from "../helpers/auth";
import { createTalentTestUser } from "../helpers/test-data";

const GIG_ID = "d1d1d1d1-aaaa-4444-aaaa-111111111111";
const GIG_PATH = `/gigs/${GIG_ID}`;

test.describe("Talent gig application experience", () => {
  test("anonymous visitors see the sign-in CTA before applying", async ({ page }) => {
    await page.goto(GIG_PATH);
    const signInLink = page.getByTestId("gig-signin-link");
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", /\/login\?returnUrl=%2Fgigs%2F/);
  });

  test("non-subscribed talent sees the subscription gate after login", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-gig-apply", {
      firstName: "Gig",
      lastName: `Apply${Date.now()}`,
    });

    // Deterministic: create a verified talent user (no dependence on seeded env accounts).
    const createRes = await request.post("/api/admin/create-user", {
      data: {
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    await loginWithCredentials(page, { email: user.email, password: user.password });
    await ensureTalentReady(page);
    await page.goto(GIG_PATH);
    await expect(
      page.getByText(/you need an active subscription to apply to this gig/i)
    ).toBeVisible();
    const viewPlansLink = page
      .getByTestId("subscription-apply-gate")
      .getByRole("link", { name: /view plans.*subscribe/i });
    await expect(viewPlansLink).toBeVisible();
    await expect(viewPlansLink).toHaveAttribute("href", "/talent/subscribe");
  });
});

