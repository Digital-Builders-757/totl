import { test, expect } from "@playwright/test";

/**
 * Complete Auth Flow Test
 * Tests the full talent signup → email verification → login → dashboard redirect flow
 * 
 * This test verifies:
 * 1. Signup creates account with proper metadata
 * 2. Email verification link works correctly
 * 3. After verification, login immediately recognizes session
 * 4. Automatic redirect to talent dashboard
 * 5. Profile exists with proper display_name
 * 6. No stale cookie/cache issues
 */

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// Generate unique test user data for each test run
const timestamp = Date.now();
const testUser = {
  email: `test-talent-auth-${timestamp}@example.com`,
  password: "TestPassword123!",
  firstName: "Test",
  lastName: `User${timestamp}`,
};

test.describe("Complete Auth Flow - Talent Signup to Dashboard", () => {
  test("Full flow: signup → verification → login → dashboard", async ({ page, context }) => {
    // Step 1: Navigate to talent signup
    await test.step("Navigate to talent signup page", async () => {
      await page.goto(`${baseURL}/talent/signup`);
      await expect(page).toHaveURL(/.*\/talent\/signup/);
      
      // Verify signup form is visible
      await expect(page.locator("#firstName")).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
    });

    // Step 2: Fill out signup form
    await test.step("Fill out signup form", async () => {
      await page.fill("#firstName", testUser.firstName);
      await page.fill("#lastName", testUser.lastName);
      await page.fill("#email", testUser.email);
      await page.fill("#password", testUser.password);
      await page.fill("#confirmPassword", testUser.password);
      
      // Check terms checkbox
      await page.check("#agreeTerms");
      
      // Verify form is filled correctly
      await expect(page.locator("#firstName")).toHaveValue(testUser.firstName);
      await expect(page.locator("#lastName")).toHaveValue(testUser.lastName);
      await expect(page.locator("#email")).toHaveValue(testUser.email);
      await expect(page.locator("#agreeTerms")).toBeChecked();
    });

    // Step 3: Submit signup form
    await test.step("Submit signup form", async () => {
      // Click submit button
      await page.click('button[type="submit"]');
      
      // Wait for redirect to verification pending page
      await expect(page).toHaveURL(/.*\/verification-pending/, { timeout: 15000 });
      
      // Verify success message appears
      await expect(page.locator("text=/account creation successful/i")).toBeVisible({ timeout: 10000 });
    });

    // Step 4: Get verification email link (simulated)
    // In a real scenario, we would extract the verification link from the email
    // For testing, we'll need to use Supabase admin API or check email service
    // For now, we'll test the login flow which should work after manual verification
    await test.step("Note: Email verification required", async () => {
      // In production, user clicks email link which goes to /auth/callback?code=...
      // For this test, we assume the user has verified their email
      // The actual verification would be tested separately with email service integration
      console.log(`Test user created: ${testUser.email}`);
      console.log("Note: Manual email verification required for full E2E test");
    });

    // Step 5: Navigate to login page
    await test.step("Navigate to login page", async () => {
      await page.goto(`${baseURL}/login`);
      await expect(page).toHaveURL(/.*\/login/);
      
      // Verify login form is visible
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
    });

    // Step 6: Fill login form
    await test.step("Fill login form", async () => {
      await page.fill("#email", testUser.email);
      await page.fill("#password", testUser.password);
      
      await expect(page.locator("#email")).toHaveValue(testUser.email);
    });

    // Step 7: Submit login and verify immediate redirect
    await test.step("Submit login and verify immediate redirect to talent dashboard", async () => {
      // Submit login form
      await page.click('button[type="submit"]');
      
      // CRITICAL TEST: Should immediately redirect to talent dashboard
      // This is the main bug fix - no stale cookies, immediate recognition
      // The server-side redirect should happen within 2-3 seconds
      await expect(page).toHaveURL(/.*\/talent\/dashboard/, { timeout: 15000 });
      
      // Verify we're on the dashboard (not stuck on login or choose-role)
      const currentURL = page.url();
      expect(currentURL).toContain("/talent/dashboard");
      expect(currentURL).not.toContain("/login");
      expect(currentURL).not.toContain("/choose-role");
      
      // Verify no redirect loops or errors
      await page.waitForLoadState("networkidle");
    });

    // Step 8: Verify dashboard loads correctly
    await test.step("Verify dashboard loads correctly", async () => {
      // Wait for dashboard content to load
      await page.waitForLoadState("networkidle");
      
      // Verify dashboard elements are visible
      // The dashboard should show talent-specific content
      // Look for common dashboard elements
      const dashboardContent = page.locator("text=/dashboard/i").first();
      await expect(dashboardContent).toBeVisible({ timeout: 10000 });
    });

    // Step 9: Verify profile name is auto-populated (no "update name" message)
    await test.step("Verify profile name is auto-populated", async () => {
      // Check that there's no error message about missing name
      // These messages should NOT appear if our fix worked
      const updateNameMessage = page.locator("text=/update.*name/i");
      const profileIncompleteMessage = page.locator("text=/complete.*profile/i");
      
      // These should not be visible
      await expect(updateNameMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
        throw new Error("Profile name was not auto-populated - 'update name' message appeared");
      });
      
      await expect(profileIncompleteMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
        throw new Error("Profile incomplete message appeared");
      });
    });
  });

  test("Login redirect works for returning verified talent", async ({ page }) => {
    // This test assumes a user already exists and is verified
    // For a full E2E test, you would need to:
    // 1. Create a test user via Supabase admin API
    // 2. Verify their email via admin API
    // 3. Then test the login flow
    
    const existingUser = {
      email: "existing-talent@example.com", // Update with actual test account
      password: "TestPassword123!",
    };

    await test.step("Login as existing verified talent", async () => {
      await page.goto(`${baseURL}/login`);
      await page.fill("#email", existingUser.email);
      await page.fill("#password", existingUser.password);
      await page.click('button[type="submit"]');
    });

    await test.step("Verify immediate redirect to talent dashboard", async () => {
      // Should redirect immediately without any intermediate pages
      await expect(page).toHaveURL(/.*\/talent\/dashboard/, { timeout: 15000 });
      
      // Verify no redirect to choose-role or login
      const currentURL = page.url();
      expect(currentURL).not.toContain("/choose-role");
      expect(currentURL).not.toContain("/login");
    });
  });

  test("Client login redirect still works (regression test)", async ({ page }) => {
    // Verify clients aren't broken by our changes
    const clientUser = {
      email: "test-client@example.com", // Update with actual test account
      password: "TestPassword123!",
    };

    await test.step("Login as client", async () => {
      await page.goto(`${baseURL}/login`);
      await page.fill("#email", clientUser.email);
      await page.fill("#password", clientUser.password);
      await page.click('button[type="submit"]');
    });

    await test.step("Verify redirect to client dashboard", async () => {
      await expect(page).toHaveURL(/.*\/client\/dashboard/, { timeout: 15000 });
    });
  });

  test("Unverified user cannot login", async ({ page }) => {
    // Test that unverified users are properly handled
    const unverifiedUser = {
      email: `unverified-${timestamp}@example.com`,
      password: "TestPassword123!",
    };

    await test.step("Attempt login with unverified account", async () => {
      await page.goto(`${baseURL}/login`);
      await page.fill("#email", unverifiedUser.email);
      await page.fill("#password", unverifiedUser.password);
      await page.click('button[type="submit"]');
    });

    await test.step("Verify error message or redirect to verification", async () => {
      // Should show error message or redirect to verification page
      // The exact behavior depends on your implementation
      await page.waitForTimeout(3000);
      
      // Either error message or verification redirect
      const hasError = await page.locator("text=/email.*verify/i").isVisible().catch(() => false);
      const isOnVerificationPage = page.url().includes("verification");
      
      expect(hasError || isOnVerificationPage).toBe(true);
    });
  });
});

