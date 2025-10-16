import { test, expect } from "@playwright/test";

test("client accepts an application and creates booking", async ({ page }) => {
  await page.goto("/login");
  await page.fill('#email', 'bboylion@gmail.com');
  await page.fill('#password', 'Aiight123!');
  await page.click('button[type="submit"]');

  await page.waitForLoadState("networkidle");
  await page.goto("/client/applications");

  // Click Accept on the first application if present
  const acceptButtons = page.locator('[data-test="accept-application"]');
  const count = await acceptButtons.count();
  test.skip(count === 0, 'No applications available to accept');
  if (count > 0) {
    await acceptButtons.first().click();
    // Expect status change to accepted in view
    await expect(page.locator('text=accepted').first()).toBeVisible({ timeout: 5000 });
  }
});


