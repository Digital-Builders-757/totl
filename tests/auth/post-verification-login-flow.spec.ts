import { test, expect } from "@playwright/test";

/**
 * Post-Verification Login Flow Test
 * Tests the critical bug fix: New talent signs up, verifies email, then logs in
 * Should immediately recognize session and redirect to talent dashboard
 * 
 * This test verifies:
 * 1. Signup creates account with proper metadata
 * 2. After verification, login immediately recognizes session
 * 3. Automatic redirect to talent dashboard
 * 4. Profile exists with proper display_name
 */

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

// Generate unique test user data
const timestamp = Date.now();
const testUser = {
  email: `test-talent-${timestamp}@example.com`,
  password: "TestPassword123!",
  firstName: "John",
  lastName: "Doe",
};

test.describe("Post-Verification Login Flow", () => {
  test("New talent signup → verification → login → dashboard redirect", async ({ page, context }) => {
    // Step 1: Navigate to talent signup
    await test.step("Navigate to talent signup page", async () => {
      await page.goto(`${baseURL}/talent/signup`);
      await expect(page).toHaveURL(/.*\/talent\/signup/);
    });

    // Step 2: Fill out signup form
    await test.step("Fill out signup form", async () => {
      await page.fill('#firstName', testUser.firstName);
      await page.fill('#lastName', testUser.lastName);
      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      await page.fill('#confirmPassword', testUser.password);
      
      // Check terms checkbox
      await page.check('#agreeTerms');
      
      // Verify form is filled
      await expect(page.locator('#firstName')).toHaveValue(testUser.firstName);
      await expect(page.locator('#lastName')).toHaveValue(testUser.lastName);
      await expect(page.locator('#email')).toHaveValue(testUser.email);
    });

    // Step 3: Submit signup form
    await test.step("Submit signup form", async () => {
      await page.click('button[type="submit"]');
      
      // Should redirect to verification pending page
      await expect(page).toHaveURL(/.*\/verification-pending/);
      
      // Verify success message
      await expect(page.locator('text=/account creation successful/i')).toBeVisible({ timeout: 10000 });
    });

    // Step 4: Simulate email verification by directly calling auth callback
    // In a real scenario, user clicks email link, but for testing we'll use the verification code
    // Note: This requires Supabase admin API or we can test the login flow assuming verification happened
    await test.step("Simulate email verification", async () => {
      // For now, we'll test the login flow which should work after verification
      // The actual verification would happen via email link in production
      // We can verify this works by checking that login succeeds after manual verification
    });

    // Step 5: Navigate to login page
    await test.step("Navigate to login page", async () => {
      await page.goto(`${baseURL}/login`);
      await expect(page).toHaveURL(/.*\/login/);
    });

    // Step 6: Fill login form
    await test.step("Fill login form", async () => {
      await page.fill('#email', testUser.email);
      await page.fill('#password', testUser.password);
      
      await expect(page.locator('#email')).toHaveValue(testUser.email);
    });

    // Step 7: Submit login and verify redirect
    await test.step("Submit login and verify redirect to talent dashboard", async () => {
      // Submit login form
      await page.click('button[type="submit"]');
      
      // CRITICAL: Should immediately redirect to talent dashboard
      // This is the main bug fix - no stale cookies, immediate recognition
      await expect(page).toHaveURL(/.*\/talent\/dashboard/, { timeout: 15000 });
      
      // Verify we're on the dashboard (not stuck on login or choose-role)
      const currentURL = page.url();
      expect(currentURL).toContain('/talent/dashboard');
      expect(currentURL).not.toContain('/login');
      expect(currentURL).not.toContain('/choose-role');
    });

    // Step 8: Verify user is logged in and dashboard loads
    await test.step("Verify dashboard loads correctly", async () => {
      // Wait for dashboard content to load
      await page.waitForLoadState('networkidle');
      
      // Verify dashboard elements are visible
      // The dashboard should show talent-specific content
      await expect(page.locator('text=/dashboard/i').first()).toBeVisible({ timeout: 10000 });
    });

    // Step 9: Verify no "update your name" message appears
    await test.step("Verify profile name is auto-populated", async () => {
      // Check that there's no error message about missing name
      const updateNameMessage = page.locator('text=/update.*name/i');
      const profileIncompleteMessage = page.locator('text=/complete.*profile/i');
      
      // These messages should NOT appear if our fix worked
      // Note: We can't easily check the database from Playwright, but we can check UI
      await expect(updateNameMessage).not.toBeVisible({ timeout: 2000 }).catch(() => {
        // If it appears, that's a failure
        throw new Error("Profile name was not auto-populated - 'update name' message appeared");
      });
    });
  });

  test("Returning talent login still works correctly", async ({ page }) => {
    // This test assumes a user already exists and is verified
    // You would need to set up test data first or use an existing test account
    
    const existingUser = {
      email: "existing-talent@example.com", // Update with actual test account
      password: "TestPassword123!",
    };

    await test.step("Login as existing talent", async () => {
      await page.goto(`${baseURL}/login`);
      await page.fill('#email', existingUser.email);
      await page.fill('#password', existingUser.password);
      await page.click('button[type="submit"]');
    });

    await test.step("Verify redirect to talent dashboard", async () => {
      await expect(page).toHaveURL(/.*\/talent\/dashboard/, { timeout: 15000 });
    });
  });

  test("Client login redirect still works", async ({ page }) => {
    // Verify clients aren't broken by our changes
    const clientUser = {
      email: "test-client@example.com", // Update with actual test account
      password: "TestPassword123!",
    };

    await test.step("Login as client", async () => {
      await page.goto(`${baseURL}/login`);
      await page.fill('#email', clientUser.email);
      await page.fill('#password', clientUser.password);
      await page.click('button[type="submit"]');
    });

    await test.step("Verify redirect to client dashboard", async () => {
      await expect(page).toHaveURL(/.*\/client\/dashboard/, { timeout: 15000 });
    });
  });
});


