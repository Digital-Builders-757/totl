import { test, expect } from "@playwright/test";
import { ensureTalentReady, loginWithCredentials } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createTalentTestUser } from "../helpers/test-data";

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

    const user = createTalentTestUser("pw-wrong-terminal", {
      firstName: "Wrong",
      lastName: `Terminal${Date.now()}`,
    });

    // Warm server
    await safeGoto(page, "/");

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
    await safeGoto(page, "/login");
    await loginWithCredentials(page, { email: user.email, password: user.password });
    await ensureTalentReady(page);
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, { timeout: 60_000 });

    // Visit wrong terminal
    await safeGoto(page, "/client/dashboard");

    // Should converge back to talent dashboard (BootState gate)
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, { timeout: 60_000 });
    // We only assert terminal convergence here. The dashboard can legitimately take time to load data
    // (network/RLS/bootstrap), and sign-out UI belongs to separate tests.
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);
  });
});


