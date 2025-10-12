import { test, expect, Page } from "@playwright/test";

/**
 * Authentication Test Suite
 * Tests all authentication-related functionality including:
 * - User registration (talent and client)
 * - Email verification
 * - Login/logout
 * - Password reset
 * - Session management
 */

// Test data
const testUsers = {
  talent: {
    email: "test-talent@example.com",
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "Talent",
    phone: "+1234567890",
  },
  client: {
    email: "test-client@example.com",
    password: "TestPassword123!",
    firstName: "Test",
    lastName: "Client",
    companyName: "Test Company",
    phone: "+1234567890",
  },
};

// Helper functions
async function fillSignupForm(
  page: Page,
  userType: "talent" | "client",
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    companyName?: string;
  }
) {
  await page.fill('[data-testid="email"]', userData.email);
  await page.fill('[data-testid="password"]', userData.password);
  await page.fill('[data-testid="firstName"]', userData.firstName);
  await page.fill('[data-testid="lastName"]', userData.lastName);
  await page.fill('[data-testid="phone"]', userData.phone);

  if (userType === "client" && userData.companyName) {
    await page.fill('[data-testid="companyName"]', userData.companyName);
  }

  await page.check('[data-testid="termsCheckbox"]');
  await page.check('[data-testid="privacyCheckbox"]');
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
}

// Test Suite: User Registration
test.describe("User Registration", () => {
  test("Talent registration flow", async ({ page }) => {
    await page.goto("/choose-role");

    // Click on "Apply as Talent"
    await page.click('[data-testid="apply-as-talent"]');

    // Verify redirect to talent signup
    await expect(page).toHaveURL(/.*\/talent\/signup/);

    // Fill out talent registration form
    await fillSignupForm(page, "talent", testUsers.talent);

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Verify redirect to verification page
    await expect(page).toHaveURL(/.*\/verification-pending/);

    // Verify verification message is displayed
    await expect(page.locator("text=Please check your inbox")).toBeVisible();
    await expect(page.locator("text=verification link")).toBeVisible();
  });

  test("Client registration flow", async ({ page }) => {
    await page.goto("/choose-role");

    // Click on "Apply as Client"
    await page.click('[data-testid="apply-as-client"]');

    // Verify redirect to client signup
    await expect(page).toHaveURL(/.*\/client\/signup/);

    // Fill out client registration form
    await fillSignupForm(page, "client", testUsers.client);

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Verify redirect to verification page
    await expect(page).toHaveURL(/.*\/verification-pending/);

    // Verify verification message is displayed
    await expect(page.locator("text=Please check your inbox")).toBeVisible();
  });

  test("Registration form validation", async ({ page }) => {
    await page.goto("/talent/signup");

    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');

    // Verify validation errors
    await expect(page.locator("text=Email is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();
    await expect(page.locator("text=First name is required")).toBeVisible();
    await expect(page.locator("text=Last name is required")).toBeVisible();

    // Test invalid email format
    await page.fill('[data-testid="email"]', "invalid-email");
    await page.fill('[data-testid="password"]', "weak");
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator("text=Invalid email format")).toBeVisible();
    await expect(page.locator("text=Password must be at least 8 characters")).toBeVisible();
  });

  test("Terms and privacy checkbox validation", async ({ page }) => {
    await page.goto("/talent/signup");

    // Fill form but don't check terms
    await fillSignupForm(page, "talent", testUsers.talent);
    await page.uncheck('[data-testid="termsCheckbox"]');

    await page.click('[data-testid="submit-button"]');

    // Verify terms validation error
    await expect(page.locator("text=You must accept the terms")).toBeVisible();
  });
});

// Test Suite: User Login
test.describe("User Login", () => {
  test("Successful talent login", async ({ page }) => {
    await page.goto("/login");

    // Fill login form
    await fillLoginForm(page, testUsers.talent.email, testUsers.talent.password);

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Verify redirect to talent dashboard
    await expect(page).toHaveURL(/.*\/talent\/dashboard/);

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test("Successful client login", async ({ page }) => {
    await page.goto("/login");

    // Fill login form
    await fillLoginForm(page, testUsers.client.email, testUsers.client.password);

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Verify redirect to client dashboard
    await expect(page).toHaveURL(/.*\/client\/dashboard/);

    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test("Login with invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Try invalid email
    await fillLoginForm(page, "invalid@example.com", testUsers.talent.password);
    await page.click('[data-testid="login-button"]');

    // Verify error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible();

    // Try invalid password
    await fillLoginForm(page, testUsers.talent.email, "wrongpassword");
    await page.click('[data-testid="login-button"]');

    // Verify error message
    await expect(page.locator("text=Invalid credentials")).toBeVisible();
  });

  test("Login form validation", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await page.click('[data-testid="login-button"]');

    // Verify validation errors
    await expect(page.locator("text=Email is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();
  });
});

// Test Suite: User Logout
test.describe("User Logout", () => {
  test("Logout from talent dashboard", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await fillLoginForm(page, testUsers.talent.email, testUsers.talent.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*\/talent\/dashboard/);

    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to home page
    await expect(page).toHaveURL("/");

    // Verify user is logged out
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test("Logout from client dashboard", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await fillLoginForm(page, testUsers.client.email, testUsers.client.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*\/client\/dashboard/);

    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verify redirect to home page
    await expect(page).toHaveURL("/");

    // Verify user is logged out
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });
});

// Test Suite: Password Reset
test.describe("Password Reset", () => {
  test("Request password reset", async ({ page }) => {
    await page.goto("/login");

    // Click forgot password link
    await page.click('[data-testid="forgot-password-link"]');

    // Verify redirect to reset password page
    await expect(page).toHaveURL(/.*\/reset-password/);

    // Fill email
    await page.fill('[data-testid="email"]', testUsers.talent.email);

    // Submit reset request
    await page.click('[data-testid="submit-button"]');

    // Verify success message
    await expect(page.locator("text=Password reset email sent")).toBeVisible();
  });

  test("Password reset form validation", async ({ page }) => {
    await page.goto("/reset-password");

    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');

    // Verify validation error
    await expect(page.locator("text=Email is required")).toBeVisible();

    // Try invalid email
    await page.fill('[data-testid="email"]', "invalid-email");
    await page.click('[data-testid="submit-button"]');

    // Verify validation error
    await expect(page.locator("text=Invalid email format")).toBeVisible();
  });
});

// Test Suite: Session Management
test.describe("Session Management", () => {
  test("Session persistence across page refreshes", async ({ page }) => {
    // Login
    await page.goto("/login");
    await fillLoginForm(page, testUsers.talent.email, testUsers.talent.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*\/talent\/dashboard/);

    // Refresh page
    await page.reload();

    // Verify still logged in
    await expect(page).toHaveURL(/.*\/talent\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test("Redirect to login when accessing protected route", async ({ page }) => {
    // Try to access protected route without login
    await page.goto("/talent/dashboard");

    // Verify redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("Redirect after login to intended page", async ({ page }) => {
    // Try to access protected route
    await page.goto("/talent/dashboard");
    await expect(page).toHaveURL(/.*\/login/);

    // Login
    await fillLoginForm(page, testUsers.talent.email, testUsers.talent.password);
    await page.click('[data-testid="login-button"]');

    // Verify redirect to originally intended page
    await expect(page).toHaveURL(/.*\/talent\/dashboard/);
  });
});

// Test Suite: Email Verification
test.describe("Email Verification", () => {
  test("Verification pending page display", async ({ page }) => {
    await page.goto("/verification-pending?email=test@example.com");

    // Verify page elements
    await expect(page.locator("text=Please check your inbox")).toBeVisible();
    await expect(page.locator("text=verification link")).toBeVisible();
    await expect(page.locator("text=Didn't receive the email?")).toBeVisible();

    // Verify resend button
    await expect(page.locator('[data-testid="resend-button"]')).toBeVisible();

    // Verify sign in link
    await expect(page.locator('[data-testid="sign-in-link"]')).toBeVisible();
  });

  test("Resend verification email", async ({ page }) => {
    await page.goto("/verification-pending?email=test@example.com");

    // Click resend button
    await page.click('[data-testid="resend-button"]');

    // Verify success message
    await expect(page.locator("text=Verification email sent")).toBeVisible();
  });
});
