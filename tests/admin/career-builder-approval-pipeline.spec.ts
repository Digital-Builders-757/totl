import { test, expect } from "@playwright/test";

/**
 * Career Builder approval pipeline (contract-aligned)
 *
 * Proves the ONLY allowed path to role=client:
 * - user submits /client/apply (authenticated)
 * - admin approves in /admin/client-applications
 * - user lands in /client/dashboard after next login
 */

test.describe("Career Builder approval pipeline", () => {
  test("talent submits application → admin approves → user routes to client dashboard", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const timestamp = Date.now();
    const applicant = {
      email: `pw-client-promo-${timestamp}@example.com`,
      password: "TestPassword123!",
      firstName: "Career",
      lastName: `Builder${timestamp}`,
    };

    // Warm the server before first API call (dev server can be mid-compile).
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Ensure an admin test user exists (so admin login is deterministic).
    // This endpoint is server-only and enforces the “no client creation via admin tooling” rule.
    const ensureAdminRes = await request.post("/api/admin/create-user", {
      data: {
        email: "admin@totlagency.com",
        password: "AdminPassword123!",
        firstName: "Admin",
        lastName: "TOTL",
        role: "admin",
      },
    });
    expect(ensureAdminRes.ok()).toBeTruthy();

    // 1) Create a verified talent user (admin API shortcut; avoids email inbox)
    const createRes = await request.post("/api/admin/create-user", {
      data: {
        email: applicant.email,
        password: applicant.password,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        role: "talent",
      },
    });

    expect(createRes.ok()).toBeTruthy();

    // 2) Login as the applicant
    await page.goto("/login");
    await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 30_000 });
    await page.fill("#email", applicant.email);
    await page.fill("#password", applicant.password);
    await page.getByTestId("login-button").click();
    await expect(page).toHaveURL(/\/talent\/dashboard/, { timeout: 60_000 });

    // 3) Submit Career Builder application
    await page.goto("/client/apply");

    // Wait for form
    await expect(page.locator("#companyName")).toBeVisible({ timeout: 20000 });

    // Email/name are auto-filled from auth metadata; ensure required fields are set
    await page.fill("#companyName", `Test Company ${timestamp}`);

    // Phone is required
    await page.fill("#phone", "555-555-5555");

    // Industry uses shadcn Select; open and pick an item
    await page.locator("#industry").click();
    await page.getByRole("option", { name: "Fashion" }).click();

    await page.fill(
      "#businessDescription",
      "We run a test business for Career Builder promotion pipeline verification."
    );
    await page.fill(
      "#needsDescription",
      "We need talent for editorial and commercial shoots (test)."
    );

    await page.click('button[type="submit"]:has-text("Submit Application")');
    await expect(page).toHaveURL(/\/client\/apply\/success/, { timeout: 30000 });

    // 4) Hard sign out applicant (avoid cross-account leakage)
    await page.context().clearCookies();
    await page.goto("/login?signedOut=true");

    // 5) Login as admin
    await page.goto("/login");
    await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 30_000 });
    await page.fill("#email", "admin@totlagency.com");
    await page.fill("#password", "AdminPassword123!");
    await page.getByTestId("login-button").click();
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 60_000 });

    // 6) Approve the application in admin panel
    await page.goto("/admin/client-applications");
    await expect(page.getByText("Applications", { exact: true })).toBeVisible({ timeout: 20000 });

    // Filter table to the applicant by email
    await page.getByPlaceholder("Search by company, name, email, or industry...").fill(applicant.email);

    const row = page.locator("tr", { hasText: applicant.email }).first();
    await expect(row).toBeVisible({ timeout: 20000 });

    // Open row actions dropdown
    await row.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Approve" }).click();

    // Approve dialog
    await expect(page.getByText("Approve Career Builder Application")).toBeVisible({ timeout: 20000 });
    await page.fill("#approve-notes", "Approved via Playwright pipeline test");
    await page.getByRole("button", { name: "Approve & Send Email" }).click();

    // Toast title
    await expect(page.getByText("Application Approved")).toBeVisible({ timeout: 20000 });

    // 7) Hard sign out admin (avoid cross-account leakage)
    await page.context().clearCookies();
    await page.goto("/login?signedOut=true");

    // 8) Login as applicant again; should route to client dashboard
    await page.goto("/login");
    await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 30_000 });
    await page.fill("#email", applicant.email);
    await page.fill("#password", applicant.password);
    await page.getByTestId("login-button").click();

    await expect(page).toHaveURL(/\/client\/dashboard/, { timeout: 60_000 });
  });
});
