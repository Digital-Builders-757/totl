import { test, expect } from "@playwright/test";
import { loginAsClient } from "../helpers/auth";

test("client accepts an application and creates booking", async ({ page }) => {
  if (!process.env.PLAYWRIGHT_CLIENT_EMAIL || !process.env.PLAYWRIGHT_CLIENT_PASSWORD) {
    test.skip(true, "Set PLAYWRIGHT_CLIENT_EMAIL and PLAYWRIGHT_CLIENT_PASSWORD to run client booking tests");
  }

  await loginAsClient(page, { returnUrl: "/client/applications" });
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


