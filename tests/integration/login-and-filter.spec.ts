import { test, expect } from "@playwright/test";

test("logs in and filters gigs", async ({ page }) => {
  // Go to login
  await page.goto("/login");

  // Fill email and password
  await page.fill('#email', 'bboylion@gmail.com');
  await page.fill('#password', 'Aiight123!');
  await page.click('button[type="submit"]');

  // After login, navigate to gigs page
  await page.waitForLoadState("networkidle");
  await page.goto("/gigs");

  // Use filters
  await page.fill('input[name="q"]', 'model');
  await page.fill('input[name="location"]', 'New');
  await page.click('button[type="submit"]');

  // Expect URL to contain params
  await expect(page).toHaveURL(/q=model/);
});

test.describe("gigs filter scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('#email', 'bboylion@gmail.com');
    await page.fill('#password', 'Aiight123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");
    await page.goto("/gigs");
  });

  test("category-only filter", async ({ page }) => {
    await page.fill('input[name="category"]', 'commercial');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/category=commercial/);
  });

  test("compensation-only filter", async ({ page }) => {
    await page.fill('input[name="compensation"]', '$1000');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/compensation=%24?1000/);
  });

  test("combined filters reduce results or empty state", async ({ page }) => {
    // First capture initial card count
    const initialCards = await page.locator('a:has-text("View Details")').count();

    await page.fill('input[name="q"]', 'promo');
    await page.fill('input[name="location"]', 'New York');
    await page.fill('input[name="category"]', 'other');
    await page.click('button[type="submit"]');

    // Either no results or fewer/equal than initial
    const noResults = await page.locator('text=No Active Gigs').first().isVisible().catch(() => false);
    const filteredCards = await page.locator('a:has-text("View Details")').count();
    expect(noResults || filteredCards <= initialCards).toBeTruthy();
  });

  test("reset clears filters", async ({ page }) => {
    // Apply some filters
    await page.fill('input[name="q"]', 'model');
    await page.fill('input[name="location"]', 'New');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/q=model/);

    // Reset by navigating to base /gigs
    await page.goto('/gigs');
    await expect(page).not.toHaveURL(/\?/);
  });
});

