import { expect, test } from "@playwright/test";
import { safeGoto } from "../helpers/navigation";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

async function createInviteTokenForClientApply() {
  const admin = createSupabaseAdminClientForTests();
  const runId = Date.now();
  const email = `pw-invite-client-apply-${runId}@example.com`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: "http://localhost:3000/auth/callback",
    },
  });

  if (error || !data?.properties?.hashed_token) {
    throw new Error(error?.message ?? "failed to generate invite token");
  }

  return {
    email,
    tokenHash: data.properties.hashed_token,
    companyName: `Invite Flow Co ${runId}`,
    firstName: "Invite",
    lastName: `Applicant${runId}`,
  };
}

test.describe("Invite to client apply flow", () => {
  test("invite callback lands on /client/apply and pending state survives revisit", async ({ page }) => {
    test.setTimeout(120_000);

    const invite = await createInviteTokenForClientApply();
    await page.context().clearCookies();

    await safeGoto(
      page,
      `/auth/callback?token_hash=${encodeURIComponent(invite.tokenHash)}&type=invite&returnUrl=${encodeURIComponent("/client/apply")}`,
      { timeoutMs: 60_000 }
    );

    await expect(page).toHaveURL(/\/client\/apply(\?|\/|$)/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { name: /career builder application/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.fill("#firstName", invite.firstName);
    await page.fill("#lastName", invite.lastName);
    await page.fill("#companyName", invite.companyName);
    await page.fill("#phone", "555-555-5555");
    await page.locator("#industry").click();
    await page.getByRole("option", { name: "Fashion" }).click();
    await page.fill(
      "#businessDescription",
      "Invite-based Career Builder application flow verification."
    );
    await page.fill(
      "#needsDescription",
      "Need vetted talent for editorial and commercial projects."
    );

    await page.getByRole("button", { name: "Submit Application" }).click();
    await expect(page).toHaveURL(/\/client\/apply\/success/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /application submitted successfully/i })).toBeVisible({
      timeout: 20_000,
    });

    await safeGoto(page, "/client/apply", { timeoutMs: 60_000 });
    await expect(page).toHaveURL(/\/client\/apply(\?|\/|$)/, { timeout: 30_000 });
    await expect(page.getByText(/thanks for applying! your application is still under review\./i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(/application under review/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/our admin team is reviewing it/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Submit Application" })).toHaveCount(0);
  });
});
