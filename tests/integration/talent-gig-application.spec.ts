import { test, expect, type Page } from "@playwright/test";

const GIG_ID = "d1d1d1d1-aaaa-4444-aaaa-111111111111";
const GIG_PATH = `/gigs/${GIG_ID}`;

const TALENT_ACCOUNT = {
  email: "emma.seed@thetotlagency.local",
  password: "Password123!",
};

async function loginAsTalent(page: Page) {
  await page.goto("/login");
  await page.fill("#email", TALENT_ACCOUNT.email);
  await page.fill("#password", TALENT_ACCOUNT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/talent\/dashboard/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

test.describe("Talent gig application experience", () => {
  test("anonymous visitors see the sign-in CTA before applying", async ({ page }) => {
    await page.goto(GIG_PATH);
    await expect(page.getByText(/sign in to apply/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in to apply/i })).toBeVisible();
    const signInLink = page.getByRole("link", { name: /sign in to apply/i });
    await expect(signInLink).toHaveAttribute("href", /\/login\?returnUrl=%2Fgigs%2F/);
  });

  test("non-subscribed talent sees the subscription gate after login", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto(GIG_PATH);
    await expect(
      page.getByText(/you need an active subscription to apply to this gig/i)
    ).toBeVisible();
    const viewPlansLink = page.getByRole("link", { name: /view plans/i });
    await expect(viewPlansLink).toBeVisible();
    await expect(viewPlansLink).toHaveAttribute("href", "/talent/subscribe");
  });
});

