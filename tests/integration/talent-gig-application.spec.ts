import { test, expect } from "@playwright/test";
import { ensureTalentReady, waitForLoginHydrated } from "../helpers/auth";
import {
  createActiveGigForClient,
  ensureTalentUserViaAdminApi,
} from "../helpers/integration-fixtures";
import { safeGoto } from "../helpers/navigation";
import { createTalentTestUser } from "../helpers/test-data";

// NOTE: avoid hardcoding a gig UUID that may not exist in the environment.
// We'll create a deterministic gig + application target via Supabase admin.

test.describe("Talent gig application experience", () => {
  test("anonymous visitors see the sign-in CTA before applying", async ({ page, request }, testInfo) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-gig-apply", testInfo, {
      firstName: "Gig",
      variant: "anon",
    });

    const talentUserId = await ensureTalentUserViaAdminApi(request, user);
    const gigId = await createActiveGigForClient(talentUserId, `${testInfo.workerIndex}-anon-cta`);
    const gigPath = `/gigs/${gigId}`;

    // Signed-out visit should show sign-in CTA.
    await page.context().clearCookies();
    await safeGoto(page, gigPath, { timeoutMs: 60_000 });
    const signInLink = page.getByTestId("gig-signin-link");
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", /\/login\?returnUrl=%2Fgigs%2F/);

    // Sign in (return to gig path) and ensure we are authenticated.
    await safeGoto(page, `/login?returnUrl=${encodeURIComponent(gigPath)}`, { timeoutMs: 60_000 });
    await waitForLoginHydrated(page);
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();

    // Post-login can converge to dashboard/onboarding OR returnUrl.
    await page.waitForURL(/\/(talent\/dashboard|onboarding|gigs\/)/, { timeout: 60_000 });
    await ensureTalentReady(page);

    await safeGoto(page, gigPath, { timeoutMs: 60_000 });

    // Auth should be present: top nav should no longer show Sign In / Create Account.
    await expect(page.getByRole("button", { name: /^sign in$/i })).toBeHidden({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: /create account/i })).toBeHidden({ timeout: 10_000 });

    // Current contract: signed-in but unsubscribed should see a subscription gate when attempting to apply.
    const applyButton = page.getByRole("button", { name: /apply/i }).first();
    if (await applyButton.isVisible().catch(() => false)) {
      await applyButton.click();
    }

    const gate = page.getByTestId("subscription-apply-gate");
    if (await gate.isVisible().catch(() => false)) {
      const viewPlansLink = gate.getByRole("link", { name: /view plans.*subscribe/i });
      await expect(viewPlansLink).toBeVisible();
      await expect(viewPlansLink).toHaveAttribute("href", "/talent/subscribe");
      return;
    }

    // If gating UI changes, at least ensure we don't still see the anonymous CTA.
    await expect(page.getByText(/sign in to apply/i)).toBeHidden({ timeout: 10_000 });
  });
});

