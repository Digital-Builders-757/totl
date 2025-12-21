import { test, expect } from "@playwright/test";

/**
 * Finish onboarding flow (BootState gate + finishOnboardingAction)
 *
 * Proves:
 * - If required profile fields are blanked, /talent/dashboard routes to /onboarding
 * - Submitting onboarding form updates server truth and routes to the correct dashboard
 */
test.describe("BootState: finish onboarding", () => {
  test("blanked name fields force onboarding; submit completes and redirects", async ({ page, request }) => {
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
      email: `pw-onboarding-${timestamp}@example.com`,
      password: "TestPassword123!",
      firstName: "Onboarding",
      lastName: `User${timestamp}`,
    };

    // Warm server
    await safeGoto("/");

    // Create a verified talent user
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
    const created = (await createRes.json()) as { user?: { id?: string } };
    const userId = created.user?.id;
    expect(userId).toBeTruthy();

    // Blank required onboarding fields (DEV-ONLY helper)
    const blankRes = await request.post("/api/dev/profile-bootstrap", {
      data: { action: "blank-onboarding-fields", userId },
    });
    expect(blankRes.ok()).toBeTruthy();

    // Login
    await page.context().clearCookies();
    await safeGoto("/login");
    await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 30_000 });
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Should route to onboarding due to BootState needsOnboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 60_000 });

    // Fill onboarding form (must include first + last)
    await page.getByLabel("Full Name").fill("Onboarding Completed");
    await page.getByLabel("Location").fill("New York, NY");
    await page.getByLabel("Bio").fill("Test bio");
    await page.getByLabel("Website").fill("https://example.com");
    await page.getByRole("button", { name: "Complete Profile" }).click();

    // Should converge to talent dashboard
    await expect(page).toHaveURL(/\/talent\/dashboard/, { timeout: 60_000 });
  });
});


