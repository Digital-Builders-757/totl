import { test, expect } from "@playwright/test";
import { loginAsTalent } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

/**
 * Auth regression traps
 *
 * These are intentionally narrow, high-signal tests that catch known drift:
 * - /choose-role must be reachable while signed out (no bounce to /login)
 * - /update-password must not server-redirect to /login when recovery tokens arrive via URL hash
 */

async function createSuspendedTalentUser() {
  const admin = createSupabaseAdminClientForTests();
  const runId = Date.now();
  const email = `pw-suspended-recovery-${runId}@example.com`;
  const password = "TestPassword123!";

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Suspended",
      last_name: `Recovery${runId}`,
      role: "talent",
    },
  });
  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message ?? "failed to create suspended user");
  }

  const userId = created.data.user.id;
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "talent",
      account_type: "talent",
      email_verified: true,
      display_name: `Suspended Recovery ${runId}`,
      is_suspended: true,
      suspension_reason: "Playwright suspended route guardrail",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (profileError) throw new Error(profileError.message);

  return { email, password };
}

test.describe("Auth regressions (routing + reset links)", () => {
  test("SIGNED-OUT: /choose-role does not redirect to /login", async ({ page }) => {
    test.setTimeout(60_000);

    // Be explicit about signed-out state.
    await page.context().clearCookies();

    await safeGoto(page, "/choose-role", { timeoutMs: 60_000 });

    // Primary assertion: we did not get bounced to login.
    await expect(page).not.toHaveURL(/\/login(\?|\/|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/choose-role(\?|\/|$)/, { timeout: 10_000 });

    // Secondary assertion: choose-role hydration marker proves page actually rendered.
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", {
      timeout: 60_000,
    });
  });

  test("SIGNED-OUT: /reset-password stays reachable (no bounce to /login)", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await page.context().clearCookies();
    await safeGoto(page, "/reset-password", { timeoutMs: 60_000 });

    await expect(page).not.toHaveURL(/\/login(\?|\/|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/reset-password(\?|#|\/|$)/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("SIGNED-OUT: /update-password supports hash-token recovery links (no premature /login redirect)", async ({ page }) => {
    test.setTimeout(60_000);

    await page.context().clearCookies();

    // Supabase recovery links often look like:
    //   /update-password#access_token=...&refresh_token=...&type=recovery
    // We use placeholder tokens; this test is about routing + client gate existence,
    // not the validity of the token values.
    await safeGoto(
      page,
      "/update-password#access_token=fake_access&refresh_token=fake_refresh&type=recovery",
      { timeoutMs: 60_000 }
    );

    // Must stay on /update-password so the client gate can run.
    await expect(page).not.toHaveURL(/\/login(\?|\/|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/update-password(\?|#|\/|$)/, { timeout: 10_000 });

    // With fake tokens, the client gate should fail gracefully in-page (still no redirect).
    await expect(
      page
        .getByText(/missing required credentials/i)
        .or(page.getByText(/invalid or expired/i))
        .or(page.getByText(/preparing your password reset/i))
    ).toBeVisible({ timeout: 30_000 });
  });

  test("SIGNED-OUT: /update-password supports query-token recovery links (no premature /login redirect)", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    await page.context().clearCookies();
    await safeGoto(page, "/update-password?token_hash=fake_token&type=recovery", {
      timeoutMs: 60_000,
    });

    await expect(page).not.toHaveURL(/\/login(\?|\/|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/update-password(\?|#|\/|$)/, { timeout: 10_000 });

    // Query-token links can resolve through multiple UI states; route-level contract is:
    // no premature bounce to /login and URL ownership remains /update-password.
  });

  test("SUSPENDED: signed-in user is forced to /suspended when targeting /update-password", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const { email, password } = await createSuspendedTalentUser();

    await page.context().clearCookies();
    await safeGoto(page, "/login?returnUrl=/update-password", { timeoutMs: 60_000 });
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 30_000 });
    await page.getByTestId("email").fill(email);
    await page.getByTestId("password").fill(password);
    await page.getByTestId("login-button").click();

    await expect(page).toHaveURL(/\/suspended(\/|$)/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: /temporarily suspended/i })
    ).toBeVisible({ timeout: 30_000 });
  });

  test("SUSPENDED: hard-nav and refresh keep user on /suspended", async ({ page }) => {
    test.setTimeout(90_000);
    const { email, password } = await createSuspendedTalentUser();

    await page.context().clearCookies();
    await safeGoto(page, "/login?returnUrl=/update-password", { timeoutMs: 60_000 });
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 30_000 });
    await page.getByTestId("email").fill(email);
    await page.getByTestId("password").fill(password);
    await page.getByTestId("login-button").click();

    await expect(page).toHaveURL(/\/suspended(\/|$)/, { timeout: 30_000 });
    await safeGoto(page, "/update-password", { timeoutMs: 60_000 });
    await expect(page).toHaveURL(/\/suspended(\/|$)/, { timeout: 30_000 });

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/suspended(\/|$)/, { timeout: 30_000 });
  });

  test("SUSPENDED: signed-in user is forced to /suspended when targeting /reset-password", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const { email, password } = await createSuspendedTalentUser();

    await page.context().clearCookies();
    await safeGoto(page, "/login?returnUrl=/talent/dashboard", { timeoutMs: 60_000 });
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 30_000 });
    await page.getByTestId("email").fill(email);
    await page.getByTestId("password").fill(password);
    await page.getByTestId("login-button").click();
    await expect(page).toHaveURL(/\/suspended(\/|$)/, { timeout: 30_000 });

    await safeGoto(page, "/reset-password", { timeoutMs: 60_000 });
    await expect(page).toHaveURL(/\/suspended(\/|$)/, { timeout: 30_000 });
  });

  test("SIGNED-IN: recovery hash link on /update-password does not bounce to /login", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });

    await safeGoto(
      page,
      "/update-password#access_token=fake_access&refresh_token=fake_refresh&type=recovery",
      { timeoutMs: 60_000 }
    );

    await expect(page).not.toHaveURL(/\/login(\?|\/|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/update-password(\?|#|\/|$)/, { timeout: 10_000 });
  });

  test("SIGNED-IN: recovery query-token link on /update-password does not bounce to /login", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await loginAsTalent(page, { returnUrl: "/talent/dashboard" });

    await safeGoto(page, "/update-password?token_hash=fake_token&type=recovery", {
      timeoutMs: 60_000,
    });

    await expect(page).not.toHaveURL(/\/login(\?|\/|$)/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/update-password(\?|#|\/|$)/, { timeout: 10_000 });
  });
});
