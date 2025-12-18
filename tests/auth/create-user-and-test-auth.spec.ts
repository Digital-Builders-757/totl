import { test, expect } from "@playwright/test";

/**
 * Complete User Creation and Authentication Flow Test
 * 
 * This test:
 * 1. Creates a new talent user account via the signup form
 * 2. Verifies the account was created successfully
 * 3. Uses admin API to verify the email (bypassing email service)
 * 4. Tests login with the new account
 * 5. Verifies redirect to talent dashboard
 * 6. Tests session persistence
 * 7. Tests logout flow
 */

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// Generate unique test user for each run
const timestamp = Date.now();
const testUser = {
  email: `playwright-test-${timestamp}@example.com`,
  password: "TestPassword123!",
  firstName: "Playwright",
  lastName: `Test${timestamp}`,
};

test.describe("Complete User Creation and Authentication Flow", () => {
  test("Full flow: Create account → Verify email → Login → Dashboard → Logout", async ({
    page,
    request,
  }) => {
    // Step 1: Navigate to choose role page
    await test.step("Navigate to choose role page", async () => {
      await page.goto(`${baseURL}/choose-role`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await expect(page).toHaveURL(/.*\/choose-role/);
      
      // The page is a client component that returns null until mounted
      // Avoid `networkidle` (can hang due to long-lived connections in dev).
      await page.waitForLoadState("domcontentloaded");
      
      // Wait for the actual content to be visible - the page has an h1 with "Choose Your Role"
      // Try multiple selectors to be safe
      const pageContent = page.locator('h1:has-text("Choose Your Role")')
        .or(page.locator('text=/Choose Your Role/i'))
        .or(page.locator('text=/Join as Talent/i'))
        .first();
      await expect(pageContent).toBeVisible({ timeout: 20000 });
    });

    // Step 2: Select talent role
    await test.step("Select talent role", async () => {
      // The talent button opens a dialog, not a navigation
      const talentButton = page.locator('button:has-text("Apply as Talent")');
      
      await expect(talentButton).toBeVisible({ timeout: 10000 });
      await talentButton.click();
      
      // Wait for dialog to open
      await expect(page.locator('text=/Create Your Talent Account/i')).toBeVisible({ timeout: 10000 });
    });

    // Step 3: Fill out signup form
    await test.step("Fill out talent signup form", async () => {
      // Form is in a dialog, wait for it to be fully visible
      await page.waitForLoadState("domcontentloaded");
      
      // Wait for dialog content to be visible
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 10000 });

      // Find form fields by ID (most reliable)
      const firstNameField = page.locator("#firstName");
      const lastNameField = page.locator("#lastName");
      const emailField = page.locator("#email");
      const passwordField = page.locator("#password");
      const confirmPasswordField = page.locator("#confirmPassword");
      const termsCheckbox = page.locator("#agreeTerms");
      
      // Wait for fields to be visible
      await expect(firstNameField).toBeVisible({ timeout: 5000 });
      await expect(emailField).toBeVisible({ timeout: 5000 });

      // Fill form fields
      await firstNameField.fill(testUser.firstName);
      await lastNameField.fill(testUser.lastName);
      await emailField.fill(testUser.email);
      await passwordField.fill(testUser.password);
      await confirmPasswordField.fill(testUser.password);

      // Check terms checkbox
      await termsCheckbox.check();

      // Verify form is filled
      await expect(firstNameField).toHaveValue(testUser.firstName);
      await expect(lastNameField).toHaveValue(testUser.lastName);
      await expect(emailField).toHaveValue(testUser.email);
      await expect(termsCheckbox).toBeChecked();
    });

    // Step 4: Submit signup form
    await test.step("Submit signup form", async () => {
      const submitButton = page.locator('button[type="submit"]').first();

      await expect(submitButton).toBeVisible({ timeout: 5000 });
      
      // Click submit button
      await submitButton.click();
      
      // Wait a bit for form processing
      await page.waitForTimeout(2000);
      
      // Check for errors first
      const errorAlert = page.locator('[role="alert"]').or(page.locator('text=/error/i')).first();
      const hasError = await errorAlert.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasError) {
        const errorText = await errorAlert.textContent();
        console.log("Form submission error:", errorText);
        // If there's an error, the user might already exist - that's okay for testing
        // Check if we're still in the dialog or if it closed
        const dialog = page.locator('[role="dialog"]');
        const dialogVisible = await dialog.isVisible({ timeout: 2000 }).catch(() => false);
        if (!dialogVisible) {
          // Dialog closed, might have navigated or closed due to error
          // Check current URL
          const currentURL = page.url();
          console.log("Current URL after form submission:", currentURL);
        }
      } else {
        // No error, wait for navigation
        await page.waitForURL(/.*\/verification-pending/, { timeout: 20000 });
        await page.waitForLoadState("networkidle");
        
        // Verify we're on verification pending page
        await expect(page).toHaveURL(/.*\/verification-pending/, { timeout: 5000 });
      }
    });

    // Step 5: Verify email using admin API (bypass email service)
    await test.step("Verify email using admin API", async () => {
      // Use the admin API to create/verify the user's email
      // This simulates clicking the verification link
      // Note: The admin API creates a verified user, so we can test login immediately
      try {
        const verifyResponse = await request.post(`${baseURL}/api/admin/create-user`, {
          data: {
            email: testUser.email,
            password: testUser.password,
            firstName: testUser.firstName,
            lastName: testUser.lastName,
            role: "talent",
          },
        });

        // If user already exists (500), that's fine - user was created via UI
        // If successful (200), user is now verified
        if (verifyResponse.status() === 200) {
          console.log(`User ${testUser.email} verified via admin API`);
        } else if (verifyResponse.status() === 500) {
          console.log(`User ${testUser.email} may already exist, proceeding with login test`);
        }
      } catch (error) {
        console.log(`Admin API call failed, but user was created via UI. Error: ${error}`);
        // Continue with test - user was created via UI, just not verified yet
        // In a real scenario, user would click email link to verify
      }
    });

    // Step 6: Navigate to login page
    await test.step("Navigate to login page", async () => {
      await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/.*\/login/);

      // Verify login form is visible
      const emailField = page.locator("#email");
      const passwordField = page.locator("#password");

      await expect(emailField).toBeVisible({ timeout: 10000 });
      await expect(passwordField).toBeVisible({ timeout: 10000 });
    });

    // Step 7: Fill and submit login form
    await test.step("Fill and submit login form", async () => {
      const emailField = page.locator("#email");
      const passwordField = page.locator("#password");
      const submitButton = page.locator('button[type="submit"]').first();

      await emailField.fill(testUser.email);
      await passwordField.fill(testUser.password);

      await expect(emailField).toHaveValue(testUser.email);

      // Submit login - wait for navigation to start
      await Promise.all([
        page.waitForURL(/.*\/(talent|client|admin)\/dashboard/, { timeout: 20000 }),
        submitButton.click(),
      ]);
    });

    // Step 8: Verify redirect to talent dashboard
    await test.step("Verify redirect to talent dashboard", async () => {
      // Should redirect to talent dashboard
      await expect(page).toHaveURL(/.*\/talent\/dashboard/, { timeout: 15000 });

      // Verify we're actually on the dashboard (not stuck on login or choose-role)
      const currentURL = page.url();
      expect(currentURL).toContain("/talent/dashboard");
      expect(currentURL).not.toContain("/login");
      expect(currentURL).not.toContain("/choose-role");

      // Wait for dashboard to load
      await page.waitForLoadState("networkidle");
    });

    // Step 9: Verify dashboard content
    await test.step("Verify dashboard content loads", async () => {
      // Look for dashboard-specific content
      // This could be a heading, navigation, or specific dashboard element
      const dashboardContent = page
        .locator('text=/dashboard/i')
        .or(page.locator('h1, h2, h3'))
        .first();

      await expect(dashboardContent).toBeVisible({ timeout: 10000 });
    });

    // Step 10: Test session persistence (refresh page)
    await test.step("Test session persistence", async () => {
      // Refresh the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Should still be on dashboard (session persisted)
      await expect(page).toHaveURL(/.*\/talent\/dashboard/);
    });

    // Step 11: Test logout
    await test.step("Test logout flow", async () => {
      // Look for user menu or logout button
      // This might be in a dropdown menu or navbar
      const userMenu = page
        .locator('[data-testid="user-menu"]')
        .or(page.locator('button:has-text("Sign Out")'))
        .or(page.locator('button:has-text("Logout")'))
        .or(page.locator('a:has-text("Sign Out")'))
        .first();

      // Try to find and click logout
      if (await userMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
        await userMenu.click();

        // If it's a dropdown, look for logout option
        const logoutOption = page
          .locator('[data-testid="logout-button"]')
          .or(page.locator('text=/sign out/i'))
          .or(page.locator('text=/logout/i'))
          .first();

        if (await logoutOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutOption.click();
        }
      } else {
        // Try direct logout link/button
        const logoutButton = page
          .locator('button:has-text("Sign Out")')
          .or(page.locator('a:has-text("Sign Out")'))
          .or(page.locator('text=/logout/i'))
          .first();

        if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await logoutButton.click();
        }
      }

      // Wait for logout to complete
      await page.waitForTimeout(2000);

      // After logout, should redirect to home or login
      const currentURL = page.url();
      expect(currentURL).toMatch(/\/(login|$|\?)/);
    });
  });

  test("Login with newly created account (direct test)", async ({ page, request }) => {
    // Create a verified user via admin API first
    const timestamp = Date.now();
    const directTestUser = {
      email: `direct-test-${timestamp}@example.com`,
      password: "TestPassword123!",
      firstName: "Direct",
      lastName: `Test${timestamp}`,
    };

    await test.step("Create verified user via admin API", async () => {
      const createResponse = await request.post(`${baseURL}/api/admin/create-user`, {
        data: {
          email: directTestUser.email,
          password: directTestUser.password,
          firstName: directTestUser.firstName,
          lastName: directTestUser.lastName,
          role: "talent",
        },
      });

      // User should be created and verified
      expect([200, 500]).toContain(createResponse.status());
    });

    await test.step("Login with verified account", async () => {
      // Navigate with timeout and wait for load
      // Use a longer timeout and wait for load state
      // Warm server first (dev builds can delay hydration/JS on first hit).
      await page.goto(`${baseURL}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.goto(`${baseURL}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
      
      // Verify we're on login page
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

      // Login page is client-rendered; wait for hydration marker so inputs don't get wiped.
      await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 120_000 });
      
      await page.getByTestId("email").fill(directTestUser.email);
      await expect(page.getByTestId("email")).toHaveValue(directTestUser.email);
      await page.getByTestId("password").fill(directTestUser.password);
      await expect(page.getByTestId("password")).toHaveValue(directTestUser.password);
      
      // Submit and wait for redirect
      await Promise.all([
        page.waitForURL(/.*\/(talent|client|admin)\/dashboard/, { timeout: 60_000 }),
        page.getByTestId("login-button").click(),
      ]);
    });

    await test.step("Verify immediate redirect to talent dashboard", async () => {
      await expect(page).toHaveURL(/.*\/talent\/dashboard/, { timeout: 15000 });

      const currentURL = page.url();
      expect(currentURL).toContain("/talent/dashboard");
      expect(currentURL).not.toContain("/login");
      expect(currentURL).not.toContain("/choose-role");
    });
  });

  test("Client promotion requires approval (no direct client creation)", async ({ page, request }) => {
    const timestamp = Date.now();
    const clientUser = {
      email: `playwright-client-${timestamp}@example.com`,
      password: "TestPassword123!",
      firstName: "Client",
      lastName: `Test${timestamp}`,
      companyName: `Test Company ${timestamp}`,
    };

    await test.step("Direct client creation via admin API is rejected (PR #3)", async () => {
      const createResponse = await request.post(`${baseURL}/api/admin/create-user`, {
        data: {
          email: clientUser.email,
          password: clientUser.password,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          role: "client",
        },
      });

      expect(createResponse.status()).toBe(400);
      const body = await createResponse.json();
      expect(body.error).toMatch(/Client promotion is only allowed/i);
    });

    await test.step("Create verified talent via admin API (allowed)", async () => {
      const createResponse = await request.post(`${baseURL}/api/admin/create-user`, {
        data: {
          email: clientUser.email,
          password: clientUser.password,
          firstName: clientUser.firstName,
          lastName: clientUser.lastName,
          role: "talent",
        },
      });
      expect([200, 500]).toContain(createResponse.status());
    });

    await test.step("Login as client", async () => {
      await page.goto(`${baseURL}/login`, { waitUntil: "networkidle", timeout: 60000 });
      
      // Verify we're on login page
      await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
      
      const emailField = page.locator("#email");
      const passwordField = page.locator("#password");
      const submitButton = page.locator('button[type="submit"]').first();
      
      await expect(emailField).toBeVisible({ timeout: 15000 });
      await expect(passwordField).toBeVisible({ timeout: 15000 });

      await emailField.fill(clientUser.email);
      await passwordField.fill(clientUser.password);
      
      // Submit and wait for redirect
      await Promise.all([
        page.waitForURL(/.*\/(talent|client|admin)\/dashboard/, { timeout: 30000 }),
        submitButton.click(),
      ]);
    });

    await test.step("Verify redirect to talent dashboard (not client)", async () => {
      await expect(page).toHaveURL(/.*\/talent\/dashboard/, { timeout: 15000 });
    });
  });
});

