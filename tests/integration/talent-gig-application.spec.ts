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
    await expect(page.getByText(/apply for this gig/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in to apply/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in to apply/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  test("logged-in talent sees their application status badge", async ({ page }) => {
    await loginAsTalent(page);
    await page.goto(GIG_PATH);
    await expect(page.getByText(/apply for this gig/i)).toBeVisible();
    await expect(page.getByText(/application submitted/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /view dashboard/i })).toHaveAttribute(
      "href",
      "/talent/dashboard"
    );
    await expect(page.getByText(/you've already applied/i)).toBeVisible();
  });
});

