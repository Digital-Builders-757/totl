import { test, expect } from "@playwright/test";
import { ensureTalentReady, loginAsClient, loginWithCredentials } from "../helpers/auth";
import { createTalentTestUser } from "../helpers/test-data";

/**
 * Post-Verification Login Flow Test (deterministic)
 *
 * Instead of relying on inbox verification, we create a verified user via the
 * admin API and validate post-login convergence (no stale session/redirect loops).
 */

const timestamp = Date.now();

test.describe("Post-Verification Login Flow", () => {
  test("verified talent: login converges and reaches dashboard (no stale session)", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-post-verify", {
      firstName: "John",
      lastName: `Doe${timestamp}`,
    });

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

    // Proof scope: convergence + no loops. Profile-completion prompts are allowed and can vary by UX rules.
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible({ timeout: 30_000 });
  });

  test("client login redirect still works (env-driven regression)", async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_CLIENT_EMAIL || !process.env.PLAYWRIGHT_CLIENT_PASSWORD,
      "Set PLAYWRIGHT_CLIENT_EMAIL and PLAYWRIGHT_CLIENT_PASSWORD to run client auth regression"
    );

    await loginAsClient(page);
    await expect(page).toHaveURL(/\/(client\/dashboard|onboarding)(\/|$)/, { timeout: 60_000 });
  });
});


