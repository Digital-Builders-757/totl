import { test, expect, type Page } from "@playwright/test";

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

test.describe("Portfolio Gallery", () => {
  test("renders the gallery grid, hover overlay, and edit controls", async ({ page }) => {
    await loginAsTalent(page);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await page.getByRole("tab", { name: /portfolio/i }).click();

    await expect(page.getByText("Portfolio Gallery")).toBeVisible();

    const titledCard = page.getByRole("heading", { name: "Vogue Editorial" }).first();
    await expect(titledCard).toBeVisible();

    await titledCard.hover();
    await expect(page.getByText(/Vogue \/ Milan/i)).toBeVisible({ timeout: 5000 });

    const editButton = page.getByRole("button", { name: /^edit$/i }).first();
    await editButton.click();

    await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^cancel$/i })).toBeVisible();

    await page.getByRole("button", { name: /^cancel$/i }).first().click();
  });
});

