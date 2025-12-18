import { test, expect } from "@playwright/test";

test.describe("Admin Dashboard: Paid Talent stats", () => {
  test("shows Paid Talent (Subscriptions) stats", async ({ page }) => {
    test.setTimeout(120_000);

    const safeGoto = async (url: string) => {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      } catch {
        // Next dev server can transiently abort navigations during compilation; retry once.
        await page.waitForTimeout(1500);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      }
    };

    // Create a fresh admin user (avoid env-specific credential drift)
    const timestamp = Date.now();
    const adminEmail = `pw-admin-${timestamp}@example.com`;
    const adminPassword = "AdminPassword123!";

    const seedRes = await page.request.post("/api/admin/create-user", {
      data: {
        email: adminEmail,
        password: adminPassword,
        firstName: "Admin",
        lastName: "TOTL",
        role: "admin",
      },
    });
    expect(seedRes.ok()).toBeTruthy();

    await page.context().clearCookies();

    // Warm server first (dev builds can delay hydration/JS on first hit).
    await safeGoto("/");

    await safeGoto("/login?signedOut=true");
    // Wait for hydration to avoid React re-render wiping filled inputs.
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 120_000 });
    await page.getByTestId("login-button").waitFor({ state: "visible", timeout: 60_000 });

    await page.getByTestId("email").fill(adminEmail);
    await expect(page.getByTestId("email")).toHaveValue(adminEmail);
    await page.getByTestId("password").fill(adminPassword);
    await expect(page.getByTestId("password")).toHaveValue(adminPassword);
    await page.getByTestId("login-button").click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 60_000 });

    // Smoke: card renders and contains numeric values.
    await expect(page.getByTestId("paid-talent-card")).toBeVisible();
    await expect(page.getByTestId("paid-talent-card-title")).toHaveText("Paid Talent (Subscriptions)");

    // Stable selectors for metrics
    await expect(page.getByTestId("paid-talent-total")).toBeVisible();
    await expect(page.getByTestId("paid-talent-monthly")).toBeVisible();
    await expect(page.getByTestId("paid-talent-annual")).toBeVisible();
    await expect(page.getByTestId("paid-talent-unknown")).toBeVisible();
    await expect(page.getByTestId("paid-talent-mrr")).toBeVisible();
    await expect(page.getByTestId("paid-talent-arr")).toBeVisible();
  });
});
