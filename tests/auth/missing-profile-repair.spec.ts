import { test, expect } from "@playwright/test";

/**
 * Missing profile → repair (contract proof)
 *
 * Proves:
 * - deleting public.profiles is survivable
 * - re-login to /talent/dashboard recreates the profiles row via ensureProfileExists()
 * - no redirect loop (stays on dashboard)
 */

test.describe("Auth Bootstrap: Missing profile repair", () => {
  test("deleting profiles row then re-login repairs profile", async ({ page, request }) => {
    test.setTimeout(180_000);

    const safeGoto = async (url: string) => {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      } catch {
        // Next dev server can transiently abort navigations during compilation; retry once.
        await page.waitForTimeout(1500);
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      }
    };

    const timestamp = Date.now();
    const user = {
      email: `pw-missing-profile-${timestamp}@example.com`,
      password: "TestPassword123!",
      firstName: "Missing",
      lastName: `Profile${timestamp}`,
    };

    // Warm server (dev server can be compiling on first hit)
    await safeGoto("/");

    // Create a verified talent user (admin API shortcut; avoids email inbox)
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

    // Login once to establish session and confirm baseline dashboard access
    await page.context().clearCookies();
    await safeGoto("/login");
    await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 30_000 });
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();
    try {
      await page.waitForURL(/\/talent\/dashboard/, { timeout: 90_000 });
    } catch {
      const invalidCreds = page.getByText("Invalid credentials. Please try again.");
      const needsVerify = page.getByText("Please verify your email address before signing in.");

      const msg = (await invalidCreds.isVisible().catch(() => false))
        ? "Invalid credentials. Please try again."
        : (await needsVerify.isVisible().catch(() => false))
          ? "Please verify your email address before signing in."
          : null;

      const buttonText = ((await page.getByTestId("login-button").textContent()) ?? "").trim();
      throw new Error(
        msg
          ? `Login failed: ${msg}`
          : `Login did not redirect (still at ${page.url()}; button='${buttonText || "unknown"}')`
      );
    }

    await expect(page).toHaveURL(/\/talent\/dashboard/);

    // Delete profiles row (DEV-ONLY helper endpoint)
    const deleteRes = await request.post("/api/dev/profile-bootstrap", {
      data: { action: "delete-profile", userId },
    });
    expect(deleteRes.ok()).toBeTruthy();

    // Hard sign out and re-login (avoid cross-account/cookie leakage)
    await page.context().clearCookies();
    await safeGoto("/login?signedOut=true");
    await page.locator('[data-testid="login-hydrated"]').waitFor({ state: "attached", timeout: 30_000 });

    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Should converge to dashboard (no loops)
    await expect(page).toHaveURL(/\/talent\/dashboard/, { timeout: 60_000 });

    // Give it a moment; if there's a loop, we'd likely bounce off the dashboard.
    await page.waitForTimeout(1500);
    await expect(page).toHaveURL(/\/talent\/dashboard/);

    // Verify profile row exists again (DEV-ONLY helper endpoint)
    const checkRes = await request.post("/api/dev/profile-bootstrap", {
      data: { action: "check-profile", userId },
    });

    expect(checkRes.ok()).toBeTruthy();
    const payload = (await checkRes.json()) as {
      exists: boolean;
      profile: { id: string; role: string | null; account_type: string | null } | null;
    };

    expect(payload.exists).toBeTruthy();
    expect(payload.profile?.id).toBe(userId);
    expect(payload.profile?.role).toBe("talent");
    expect(payload.profile?.account_type).toBe("talent");
  });
});
