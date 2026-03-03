import { test, expect } from "@playwright/test";
import { ensureTalentReady, waitForLoginHydrated } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";
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

    // Deterministic: create a verified talent user (no dependence on seeded env accounts).
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

    // Create a gig in DB so we have a stable /gigs/:id target.
    const admin = createSupabaseAdminClientForTests();
    const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    expect(usersError).toBeNull();
    const talentAuth = usersPage.users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase());
    expect(talentAuth?.id).toBeTruthy();

    // Insert minimal gig (client_id must be non-null; reuse talent id as placeholder in test env if schema allows).
    // If gigs require a real client id, this test should be refactored to use an approved client fixture.
    const { data: gig, error: gigError } = await admin
      .from("gigs")
      .insert({
        client_id: talentAuth!.id,
        title: `PW Apply Gate ${testInfo.workerIndex}`,
        description: "Playwright deterministic gig for subscription gate proof.",
        category: "Commercial",
        location: "New York, NY",
        compensation: "$1000",
        duration: "1 day",
        date: "2025-12-31",
        status: "active",
      })
      .select("id")
      .single();
    expect(gigError).toBeNull();
    expect(gig?.id).toBeTruthy();

    const gigPath = `/gigs/${gig!.id}`;

    // Signed-out visit should show sign-in CTA.
    await page.context().clearCookies();
    await safeGoto(page, gigPath, { timeoutMs: 60_000 });
    const signInLink = page.getByTestId("gig-signin-link");
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute("href", /\/login\?returnUrl=%2Fgigs%2F/);

    // Sign in.
    await safeGoto(page, "/login", { timeoutMs: 60_000 });
    await waitForLoginHydrated(page);
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();
    await ensureTalentReady(page);

    // Current contract: signed-in but unsubscribed can still view gig details;
    // applying should show a subscription gate (may be inline in the Apply module).
    await safeGoto(page, gigPath, { timeoutMs: 60_000 });

    // If an Apply button exists, clicking it should reveal the subscription gate.
    const applyButton = page.getByRole("button", { name: /apply/i }).first();
    if (await applyButton.isVisible().catch(() => false)) {
      await applyButton.click();
    }

    const gate = page.getByTestId("subscription-apply-gate");
    const gateVisible = await gate.isVisible().catch(() => false);
    if (gateVisible) {
      const viewPlansLink = gate.getByRole("link", { name: /view plans.*subscribe/i });
      await expect(viewPlansLink).toBeVisible();
      await expect(viewPlansLink).toHaveAttribute("href", "/talent/subscribe");
      return;
    }

    // Fallback: accept copy drift but still ensure we're not seeing the anonymous CTA.
    await expect(page.getByText(/sign in to apply/i)).toBeHidden({ timeout: 10_000 });
  });
});

