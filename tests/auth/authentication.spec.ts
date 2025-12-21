import { test, expect, type Page } from "@playwright/test";
import {
  ensureTalentReady,
  loginAsClient,
  loginWithCredentials,
  waitForLoginHydrated,
} from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createTalentTestUser, getTestPassword } from "../helpers/test-data";

/**
 * Authentication Test Suite
 * Tests all authentication-related functionality including:
 * - User registration (talent and client)
 * - Email verification
 * - Login/logout
 * - Password reset
 * - Session management
 */

const runId = Date.now();

// Test data (registration-only; deterministic login tests create verified users via admin API)
const testUsers = {
  talent: {
    email: `pw-auth-talent-${runId}@example.com`,
    password: getTestPassword(),
    firstName: "Test",
    lastName: "Talent",
  },
};

// Helper functions
async function fillSignupForm(
  page: Page,
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }
  ,
  opts?: { acceptTerms?: boolean }
) {
  // Signup form lives in a dialog on /choose-role and uses stable `id=` attributes.
  await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 20_000 });

  await page.locator("#firstName").fill(userData.firstName);
  await page.locator("#lastName").fill(userData.lastName);
  await page.locator("#email").fill(userData.email);
  await page.locator("#password").fill(userData.password);
  await page.locator("#confirmPassword").fill(userData.password);

  const acceptTerms = opts?.acceptTerms ?? true;
  if (acceptTerms) {
    // Checkbox is a shadcn component; prefer label click to avoid input implementation details.
    await page.getByLabel(/i agree to the/i).click();
  }
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await waitForLoginHydrated(page);
  await page.fill('[data-testid="email"]', email);
  await page.fill('[data-testid="password"]', password);
}

// Test Suite: User Registration
test.describe("User Registration", () => {
  test.describe.configure({ timeout: 120_000 });

  test("Talent registration flow", async ({ page }) => {
    await safeGoto(page, "/choose-role");
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60_000 });

    // Open the Talent signup dialog
    await page.getByTestId("choose-role-talent").click();
    await expect(page.getByTestId("talent-signup-dialog")).toBeVisible({ timeout: 20_000 });

    await fillSignupForm(page, testUsers.talent);

    // Submit form (button has no testid; it's a submit button)
    await page.locator('button[type="submit"]').first().click();

    // `supabase.auth.signUp()` can be slow / rate-limited under parallel load.
    // This is a UI smoke test: ensure submission starts (loading state) without relying on email provider timing.
    await expect(page.getByRole("button", { name: /creating account/i })).toBeVisible({
      timeout: 20_000,
    });
  });

  test("Client registration flow", async ({ page }) => {
    await safeGoto(page, "/choose-role");
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60_000 });

    // Career Builder signup is gated behind a dialog + approval path.
    await page
      .getByRole("button", {
        name: /apply as career builder - requires talent account first/i,
      })
      .click({ timeout: 20_000 });

    await expect(page.getByTestId("career-builder-dialog")).toBeVisible({ timeout: 20_000 });

    // For logged-out users, the CTA is to create a Talent account first.
    await expect(page.getByRole("button", { name: /create talent account first/i })).toBeVisible();
  });

  test("Registration form validation", async ({ page }) => {
    await safeGoto(page, "/choose-role");
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60_000 });
    await page.getByTestId("choose-role-talent").click();
    await expect(page.getByTestId("talent-signup-dialog")).toBeVisible({ timeout: 20_000 });

    // Submit empty form
    await page.locator('button[type="submit"]').first().click();

    // Assert a couple stable validation messages from the Zod schema.
    await expect(page.getByText(/first name must be at least 2 characters/i)).toBeVisible();
    await expect(page.getByText(/you must agree to the terms and conditions/i)).toBeVisible();
  });

  test("Terms and privacy checkbox validation", async ({ page }) => {
    await safeGoto(page, "/choose-role");
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60_000 });
    await page.getByTestId("choose-role-talent").click();
    await expect(page.getByTestId("talent-signup-dialog")).toBeVisible({ timeout: 20_000 });

    // Fill required fields, but do NOT accept terms
    await fillSignupForm(page, testUsers.talent, { acceptTerms: false });
    await page.locator('button[type="submit"]').first().click();

    await expect(page.getByText(/you must agree to the terms and conditions/i)).toBeVisible();
  });
});

// Test Suite: User Login
test.describe("User Login", () => {
  test.describe.configure({ timeout: 120_000 });

  test("Successful talent login", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-login", {
      firstName: "Auth",
      lastName: `Login${Date.now()}`,
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
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);

    // Verify user is logged in
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible({ timeout: 20_000 });
  });

  test("Successful client login", async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_CLIENT_EMAIL || !process.env.PLAYWRIGHT_CLIENT_PASSWORD,
      "Set PLAYWRIGHT_CLIENT_EMAIL and PLAYWRIGHT_CLIENT_PASSWORD to run client login tests"
    );

    await loginAsClient(page);
    await expect(page).toHaveURL(/\/(client\/dashboard|onboarding)(\/|$)/);

    // Smoke check: we’re not stuck on /login
    await expect(page).not.toHaveURL(/\/login(\?|$)/);
  });

  test("Login with invalid credentials", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/login");

    // Try invalid email
    await fillLoginForm(page, "invalid@example.com", testUsers.talent.password);
    await page.click('[data-testid="login-button"]');

    // Verify error message
    await expect(page.getByText(/invalid credentials\. please try again\./i)).toBeVisible();

    // Try invalid password
    await fillLoginForm(page, testUsers.talent.email, "wrongpassword");
    await page.click('[data-testid="login-button"]');

    // Verify error message
    await expect(page.getByText(/invalid credentials\. please try again\./i)).toBeVisible();
  });

  test("Login form validation", async ({ page }) => {
    await page.goto("/login");

    // Try to submit empty form
    await waitForLoginHydrated(page);
    await page.click('[data-testid="login-button"]');

    // Verify validation errors
    await expect(page.locator("text=Email is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();
  });
});

// Test Suite: User Logout
test.describe("User Logout", () => {
  test("Logout from talent dashboard", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-logout", {
      firstName: "Auth",
      lastName: `Logout${Date.now()}`,
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
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);

    // Click logout
    await page.getByRole("button", { name: /sign out/i }).click({ timeout: 20_000 });

    // Verify redirect to login w/ signedOut marker (Phase 5 flow)
    await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 30_000 });
    // Marker is best-effort; some routes preserve returnUrl too.
    expect(page.url()).toMatch(/signedOut=true|returnUrl=/);

    // Verify user is logged out
    await waitForLoginHydrated(page);
    await expect(page.getByTestId("login-button")).toBeVisible();
  });

  test("Logout from client dashboard", async ({ page }) => {
    test.skip(
      !process.env.PLAYWRIGHT_CLIENT_EMAIL || !process.env.PLAYWRIGHT_CLIENT_PASSWORD,
      "Set PLAYWRIGHT_CLIENT_EMAIL and PLAYWRIGHT_CLIENT_PASSWORD to run client logout tests"
    );

    await loginAsClient(page);
    await expect(page).toHaveURL(/\/(client\/dashboard|onboarding)(\/|$)/);

    // Click logout
    await page.getByRole("button", { name: /sign out/i }).click();

    // Verify redirect to login w/ signedOut marker (Phase 5 flow)
    await expect(page).toHaveURL(/\/login(\?|$)/);
    expect(page.url()).toMatch(/signedOut=true|returnUrl=/);

    // Verify user is logged out
    await waitForLoginHydrated(page);
    await expect(page.getByTestId("login-button")).toBeVisible();
  });
});

// Test Suite: Password Reset
test.describe("Password Reset", () => {
  test("Request password reset", async ({ page }) => {
    await safeGoto(page, "/login");
    await waitForLoginHydrated(page);

    // Click forgot password link
    await page.getByRole("link", { name: "Forgot password?" }).click();

    // Verify redirect to reset password page
    await expect(page).toHaveURL(/\/reset-password(\/|$)/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible({ timeout: 30_000 });

    // Fill email
    await page.locator("#email").fill(testUsers.talent.email);

    // Submit reset request
    await page.getByRole("button", { name: /send reset link/i }).click();

    // Success message is in-page copy; toast is not easily asserted.
    await expect(page.getByText(/check your email for a link to reset your password/i)).toBeVisible();
  });

  test("Password reset form validation", async ({ page }) => {
    await page.goto("/reset-password");

    // Form uses native `required` validation.
    await expect(page.locator("#email")).toHaveAttribute("required", "");
  });
});

// Test Suite: Session Management
test.describe("Session Management", () => {
  test("Session persistence across page refreshes", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-session", {
      firstName: "Auth",
      lastName: `Session${Date.now()}`,
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
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);

    // Refresh page
    await page.reload();

    // Verify still logged in
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);
    // Session persistence proof: we remain on the protected dashboard after a reload.
    // The dashboard UI itself may still be loading data; other tests cover sign-out UI explicitly.
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);
  });

  test("Redirect to login when accessing protected route", async ({ page }) => {
    // Try to access protected route without login
    await page.goto("/talent/dashboard");

    // Verify redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("Redirect after login to intended page", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-auth-return", {
      firstName: "Auth",
      lastName: `Return${Date.now()}`,
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

    // Try to access protected route
    await page.goto("/talent/dashboard");
    await expect(page).toHaveURL(/.*\/login/);

    // Login and assert returnUrl convergence (boot-state safe)
    await loginWithCredentials(page, { email: user.email, password: user.password }, { returnUrl: "/talent/dashboard" });
    await ensureTalentReady(page);
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);
  });
});

// Test Suite: Email Verification
test.describe("Email Verification", () => {
  test("Verification pending page display", async ({ page }) => {
    await page.goto("/verification-pending?email=test@example.com&new=true");

    // Verify page elements
    await expect(page.getByRole("heading", { name: /verify your email/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /resend verification email/i })).toBeVisible();
    await expect(
      page.locator('a[href="/login"]').filter({ hasText: /sign in/i }).first()
    ).toBeVisible();
  });

  test("Resend verification email", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/verification-pending?email=test@example.com");

    // Click resend button
    await page.getByRole("button", { name: /resend verification email/i }).click();

    // Verify success OR governed error UI (non-flaky, env-dependent).
    await expect(
      page
        .getByText(/verification email has been resent successfully!/i)
        .or(page.getByText(/there was an issue sending the verification email/i))
    ).toBeVisible({ timeout: 20_000 });
  });
});
