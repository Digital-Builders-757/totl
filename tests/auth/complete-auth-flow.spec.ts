import { test, expect } from "@playwright/test";
import { ensureTalentReady, loginWithCredentials, loginAsClient } from "../helpers/auth";
import { createTalentTestUser } from "../helpers/test-data";

/**
 * Complete Auth Flow Test
 * Focused auth convergence proof:
 * - verified talent login converges (onboarding OR dashboard, then dashboard after onboarding)
 * - client login (env-driven) still converges (regression)
 * 
 * This test verifies:
 * - No stale cookie/cache issues
 * - No redirect loops
 */

test.describe("Complete Auth Flow - Talent Signup to Dashboard", () => {
  test("verified talent login converges and reaches dashboard (boot-state safe)", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-complete-auth", {
      firstName: "Complete",
      lastName: `Auth${Date.now()}`,
    });

    // Create a verified talent user (admin API shortcut; avoids email inbox)
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
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, { timeout: 60_000 });
  });

  test("client login still converges (env-driven regression)", async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_CLIENT_EMAIL || !process.env.PLAYWRIGHT_CLIENT_PASSWORD,
      "Set PLAYWRIGHT_CLIENT_EMAIL and PLAYWRIGHT_CLIENT_PASSWORD to run client auth regression"
    );

    await loginAsClient(page);
    await expect(page).toHaveURL(/\/(client\/dashboard|onboarding)(\/|$)/, { timeout: 60_000 });
  });
});

