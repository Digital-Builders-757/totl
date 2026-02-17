import { test, expect } from "@playwright/test";
import { safeGoto } from "../helpers/navigation";

/**
 * Auth regression traps
 *
 * These are intentionally narrow, high-signal tests that catch known drift:
 * - /choose-role must be reachable while signed out (no bounce to /login)
 * - /update-password must not server-redirect to /login when recovery tokens arrive via URL hash
 */

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
});
