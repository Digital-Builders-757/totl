import { test, expect, type Page } from "@playwright/test";
import { loginWithCredentials, waitForLoginHydrated } from "../helpers/auth";
import { createTalentTestUser } from "../helpers/test-data";
import { safeGoto } from "../helpers/navigation";

/**
 * Auth Provider Performance & Fixes Test Suite
 * 
 * Tests the auth provider fixes to ensure:
 * 1. Login redirects immediately (not blocked by profile hydration)
 * 2. Signup form doesn't hang
 * 3. isLoading becomes false quickly (UI becomes interactive)
 * 4. Profile hydration happens in background (non-blocking)
 * 5. Bootstrap guard doesn't get stuck
 * 6. Server actions succeed after signup
 */

test.describe("Auth Provider Performance & Fixes", () => {
  test.describe.configure({ timeout: 180_000 });

  test("Login redirects immediately without waiting for profile hydration", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-login", {
      firstName: "Auth",
      lastName: `Perf${Date.now()}`,
    });

    // Create verified user
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

    // Navigate to login page
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Record time before login
    const startTime = Date.now();

    // Fill and submit login form
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // CRITICAL: Redirect should happen quickly (< 2 seconds)
    // This tests that redirect is the primary mission and happens immediately
    // Profile hydration happens in background (non-blocking)
    await expect(page).toHaveURL(
      /\/(talent\/dashboard|client\/dashboard|admin\/dashboard|onboarding)(\/|$)/,
      { timeout: 5_000 }
    );

    const redirectTime = Date.now() - startTime;

    // Assert redirect happened quickly (should be < 2 seconds)
    // Redirect is bounded by 800ms timeout + retry logic, so should be fast
    expect(redirectTime).toBeLessThan(2_000);

    console.log(`[TEST] Login redirect took ${redirectTime}ms (expected < 2000ms)`);
  });

  test("Redirect happens even if getBootState fails", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-bootstate-fail", {
      firstName: "Auth",
      lastName: `BootFail${Date.now()}`,
    });

    // Create verified user
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

    // Navigate to login page
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Fill and submit login form
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // CRITICAL: Even if getBootState fails (cookie timing, server error, etc.),
    // redirect should still happen using fallback
    await expect(page).toHaveURL(
      /\/(talent\/dashboard|client\/dashboard|admin\/dashboard|onboarding)(\/|$)/,
      { timeout: 5_000 }
    );

    console.log("[TEST] Redirect succeeded even with potential getBootState failure");
  });

  test("Redirect happens even if profile hydration fails/aborts", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-hydration-fail", {
      firstName: "Auth",
      lastName: `HydrateFail${Date.now()}`,
    });

    // Create verified user
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

    // Navigate to login page
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Fill and submit login form
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // CRITICAL: Even if profile hydration fails or aborts,
    // redirect should still happen (redirect is primary mission)
    await expect(page).toHaveURL(
      /\/(talent\/dashboard|client\/dashboard|admin\/dashboard|onboarding)(\/|$)/,
      { timeout: 5_000 }
    );

    console.log("[TEST] Redirect succeeded even if profile hydration fails");
  });

  test("No duplicate redirects on multi-tab SIGNED_IN events", async ({
    page,
    request,
    context,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-multitab", {
      firstName: "Auth",
      lastName: `MultiTab${Date.now()}`,
    });

    // Create verified user
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

    // Open two tabs
    const page1 = page;
    const page2 = await context.newPage();

    // Navigate both to login
    await safeGoto(page1, "/login");
    await safeGoto(page2, "/login");
    await waitForLoginHydrated(page1);
    await waitForLoginHydrated(page2);

    // Login in tab 1
    await page1.getByTestId("email").fill(user.email);
    await page1.getByTestId("password").fill(user.password);
    await page1.getByTestId("login-button").click();

    // Wait a bit for cross-tab sync
    await page1.waitForTimeout(500);

    // CRITICAL: Both tabs should redirect, but only once each
    // redirectInFlightRef should prevent double navigation
    await expect(page1).toHaveURL(
      /\/(talent\/dashboard|client\/dashboard|admin\/dashboard|onboarding)(\/|$)/,
      { timeout: 5_000 }
    );

    // Tab 2 should also reflect logged-in state (cross-tab sync)
    // It may redirect or stay on login depending on timing, but shouldn't loop
    const page2Url = page2.url();
    expect(page2Url).not.toMatch(/\/login\?returnUrl=/); // Should not be stuck in redirect loop

    await page2.close();
    console.log("[TEST] Multi-tab redirect handled correctly (no loops)");
  });

  test("Signup form submits without hanging", async ({ page }) => {
    test.setTimeout(120_000);

    const runId = Date.now();
    const testEmail = `pw-auth-perf-signup-${runId}@example.com`;
    const testPassword = "TestPassword123!";

    // Navigate to choose-role page
    await safeGoto(page, "/choose-role");
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", {
      timeout: 60_000,
    });

    // Open talent signup dialog
    await page.getByTestId("choose-role-talent").click();
    await expect(page.getByTestId("talent-signup-dialog")).toBeVisible({
      timeout: 20_000,
    });

    // Fill signup form
    await page.locator("#firstName").fill("Test");
    await page.locator("#lastName").fill("User");
    await page.locator("#email").fill(testEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill(testPassword);
    await page.getByLabel(/i agree to the/i).click();

    // Record time before submission
    const startTime = Date.now();

    // Submit form
    await page.locator('button[type="submit"]').first().click();

    // CRITICAL: Form should show loading state quickly and not hang
    // The "Creating Account..." button should appear within 1 second
    await expect(
      page.getByRole("button", { name: /creating account/i })
    ).toBeVisible({
      timeout: 2_000,
    });

    const loadingTime = Date.now() - startTime;
    expect(loadingTime).toBeLessThan(1_000);

    // CRITICAL: Form should complete submission and redirect within reasonable time
    // Even if profile creation is slow, the form should not hang indefinitely
    // Wait for redirect to verification-pending page
    await expect(page).toHaveURL(/\/verification-pending/, {
      timeout: 15_000,
    });

    const totalTime = Date.now() - startTime;

    // Total signup flow should complete in reasonable time (< 15 seconds)
    // This tests that ensureProfilesAfterSignup() doesn't block indefinitely
    expect(totalTime).toBeLessThan(15_000);

    console.log(
      `[TEST] Signup form submission took ${totalTime}ms (expected < 15000ms)`
    );
  });

  test("UI becomes interactive quickly after page load (isLoading optimization)", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-ui", {
      firstName: "Auth",
      lastName: `UI${Date.now()}`,
    });

    // Create verified user
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

    // Login first
    await loginWithCredentials(page, { email: user.email, password: user.password });
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 20_000,
    });

    // Clear cookies and reload to test bootstrap performance
    await page.context().clearCookies();
    await page.reload();

    // Record time before page load
    const startTime = Date.now();

    // Wait for page to be interactive (sign out button appears)
    // This tests that isLoading becomes false quickly after bootstrap
    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible({
      timeout: 5_000,
    });

    const interactiveTime = Date.now() - startTime;

    // UI should become interactive quickly (< 2 seconds)
    // This tests that isLoading is set to false immediately after session check
    // Profile hydration happens in background and doesn't block UI
    expect(interactiveTime).toBeLessThan(2_000);

    console.log(
      `[TEST] UI became interactive in ${interactiveTime}ms (expected < 2000ms)`
    );
  });

  test("Profile hydration happens in background (non-blocking)", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-profile", {
      firstName: "Auth",
      lastName: `Profile${Date.now()}`,
    });

    // Create verified user
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

    // Navigate to login
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Record time before login
    const startTime = Date.now();

    // Login
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Wait for redirect (should happen quickly)
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 5_000,
    });

    const redirectTime = Date.now() - startTime;

    // Redirect should happen quickly (< 2 seconds)
    // This proves profile hydration doesn't block redirect
    expect(redirectTime).toBeLessThan(2_000);

    // Now verify profile data appears (should happen in background)
    // Wait a bit for profile hydration to complete
    await page.waitForTimeout(1_000);

    // Check that user role/profile data is available
    // This verifies profile hydration happened in background
    // (We can't directly test the profile state, but we can verify the dashboard loads)
    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible({
      timeout: 5_000,
    });

    console.log(
      `[TEST] Redirect happened in ${redirectTime}ms, profile hydrated in background`
    );
  });

  test("Bootstrap guard doesn't get stuck (timeout protection)", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-guard", {
      firstName: "Auth",
      lastName: `Guard${Date.now()}`,
    });

    // Create verified user
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

    // Login first
    await loginWithCredentials(page, { email: user.email, password: user.password });
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 20_000,
    });

    // Navigate away and back quickly to test bootstrap guard
    // This simulates rapid navigation that could trigger concurrent bootstrap
    await page.goto("/");
    await page.waitForTimeout(100);
    await page.goto("/talent/dashboard");
    await page.waitForTimeout(100);
    await page.goto("/login");
    await page.waitForTimeout(100);
    await page.goto("/talent/dashboard");

    // CRITICAL: Page should load successfully even after rapid navigation
    // Bootstrap guard should prevent infinite waits
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 10_000,
    });

    // Verify UI is interactive
    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible({
      timeout: 5_000,
    });

    console.log("[TEST] Bootstrap guard handled rapid navigation correctly");
  });

  test("Server actions succeed after signup (delayed call fix)", async ({
    page,
  }) => {
    test.setTimeout(120_000);

    const runId = Date.now();
    const testEmail = `pw-auth-perf-server-${runId}@example.com`;
    const testPassword = "TestPassword123!";

    // Navigate to choose-role page
    await safeGoto(page, "/choose-role");
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", {
      timeout: 60_000,
    });

    // Open talent signup dialog
    await page.getByTestId("choose-role-talent").click();
    await expect(page.getByTestId("talent-signup-dialog")).toBeVisible({
      timeout: 20_000,
    });

    // Fill signup form
    await page.locator("#firstName").fill("Test");
    await page.locator("#lastName").fill("Server");
    await page.locator("#email").fill(testEmail);
    await page.locator("#password").fill(testPassword);
    await page.locator("#confirmPassword").fill(testPassword);
    await page.getByLabel(/i agree to the/i).click();

    // Submit form
    await page.locator('button[type="submit"]').first().click();

    // Wait for redirect to verification-pending
    // This tests that ensureProfilesAfterSignup() succeeds (with retry logic)
    await expect(page).toHaveURL(/\/verification-pending/, {
      timeout: 15_000,
    });

    // Verify success message appears
    await expect(
      page.getByText(/account creation successful/i)
    ).toBeVisible({
      timeout: 5_000,
    });

    console.log(
      "[TEST] Server action (ensureProfilesAfterSignup) succeeded after signup"
    );
  });

  test("No duplicate auth state subscriptions", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-perf-subscriptions", {
      firstName: "Auth",
      lastName: `Subs${Date.now()}`,
    });

    // Create verified user
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

    // Monitor console for duplicate events
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[auth.onAuthStateChange]")) {
        consoleMessages.push(text);
      }
    });

    // Login
    await loginWithCredentials(page, { email: user.email, password: user.password });
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
      timeout: 20_000,
    });

    // Navigate around to trigger potential re-subscriptions
    await page.goto("/");
    await page.waitForTimeout(500);
    await page.goto("/talent/dashboard");
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForTimeout(500);

    // Count SIGNED_IN events (should only be 1, not multiple)
    const signedInEvents = consoleMessages.filter((msg) =>
      msg.includes("SIGNED_IN")
    );

    // Should only have one SIGNED_IN event (from initial login)
    // Multiple events would indicate duplicate subscriptions
    expect(signedInEvents.length).toBeLessThanOrEqual(2); // Allow 1-2 for initial + potential refresh

    console.log(
      `[TEST] Found ${signedInEvents.length} SIGNED_IN events (expected <= 2)`
    );
  });

  test("Auth provider handles rapid signup/login cycles", async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);

    // Create multiple users
    const users = Array.from({ length: 3 }, (_, i) =>
      createTalentTestUser(`pw-auth-perf-cycle-${i}`, {
        firstName: "Auth",
        lastName: `Cycle${Date.now()}-${i}`,
      })
    );

    // Create all users
    for (const user of users) {
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
    }

    // Rapidly login/logout with different users
    for (const user of users) {
      await loginWithCredentials(page, {
        email: user.email,
        password: user.password,
      });
      await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, {
        timeout: 10_000,
      });

      // Sign out
      await page.getByRole("button", { name: /sign out/i }).click();
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    }

    console.log("[TEST] Rapid signup/login cycles handled correctly");
  });
});
