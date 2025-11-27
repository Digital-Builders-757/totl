import { test, expect, type Page } from "@playwright/test";

const talentSlug = "emma-rodriguez";
const PUBLIC_PROFILE_PATH = `/talent/${talentSlug}`;

const CLIENT_ACCOUNT = {
  email: "northwind.events@thetotlagency.local",
  password: "Password123!",
};

async function loginAsClient(page: Page) {
  await page.goto("/login");
  await page.fill("#email", CLIENT_ACCOUNT.email);
  await page.fill("#password", CLIENT_ACCOUNT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/client\/dashboard/, { timeout: 20000 });
  await page.waitForLoadState("networkidle");
}

test.describe("Talent public profile", () => {
  test("renders SafeImage hero + keeps the flag CTA gated for anonymous visitors", async ({ page }) => {
    await page.goto(PUBLIC_PROFILE_PATH);

    await expect(page.getByAltText(/Emma Rodriguez/i)).toBeVisible();
    await expect(page.getByText(/Contact details are only visible to registered clients/i)).toBeVisible();

    const gatedReportButton = page.getByRole("button", { name: /sign in to report this profile/i });
    await expect(gatedReportButton).toBeDisabled();
  });

  test("allows a logged-in client to open the flag dialog and view sensitive info", async ({ page }) => {
    await loginAsClient(page);
    await page.goto(PUBLIC_PROFILE_PATH);

    await expect(page.getByText(/Contact through agency/i)).toBeVisible();
    await expect(page.getByText(/Contact Information/i)).toBeVisible();

    const reportButton = page.getByRole("button", { name: /report this profile/i });
    await expect(reportButton).toBeEnabled();
    await reportButton.click();

    await expect(page.getByRole("heading", { name: /report this profile/i })).toBeVisible();
    await expect(page.getByText(/Tell us what feels off about this account/i)).toBeVisible();

    await page.getByRole("button", { name: /^cancel$/i }).click();
    await expect(page.getByRole("heading", { name: /report this profile/i })).not.toBeVisible();
  });
});

