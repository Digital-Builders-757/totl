import { test, expect } from "@playwright/test";

/**
 * Wrong-terminal redirect (BootState gate)
 *
 * Proves:
 * - A signed-in Talent cannot sit on /client/dashboard
 * - The system converges to the correct terminal without redirect loops
 */
test.describe("BootState: wrong-terminal redirect", () => {
  test("talent visiting client dashboard is redirected to talent dashboard", async ({ page, request }) => {
    test.setTimeout(180_000);

    const safeGoto = async (url: string) => {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      } catch {
        await page.waitForTimeout(1500);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      }
    };

    const timestamp = Date.now();
    const user = {
      email: `pw-wrong-terminal-${timestamp}@example.com`,
      password: "TestPassword123!",
      firstName: "Wrong",
      lastName: `Terminal${timestamp}`,
    };

    // Warm server
    await safeGoto("/");

    // Create a verified talent user (admin API shortcut)
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

    // Login
    await page.context().clearCookies();
    await safeGoto("/login");
    await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 30_000 });
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();
    await expect(page).toHaveURL(/\/talent\/dashboard/, { timeout: 60_000 });

    // Visit wrong terminal
    await safeGoto("/client/dashboard");

    // Should converge back to talent dashboard (BootState gate)
    await expect(page).toHaveURL(/\/talent\/dashboard/, { timeout: 60_000 });
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/talent\/dashboard/);
  });
});


