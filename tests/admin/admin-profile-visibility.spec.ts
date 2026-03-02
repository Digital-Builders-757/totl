import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";
import { createTalentTestUser } from "../helpers/test-data";

async function seedClientProfileUser(runId: number) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const email = `pw-client-visibility-${runId}@example.com`;
  const password = "TestPassword123!";

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Client",
      last_name: `Viewer${runId}`,
      role: "client",
    },
  });
  if (created.error || !created.data.user?.id) {
    throw new Error(`Failed to create client visibility user: ${created.error?.message ?? "unknown"}`);
  }

  const userId = created.data.user.id;

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      role: "client",
      account_type: "client",
      display_name: "Client Viewer",
      email_verified: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (profileError) {
    throw new Error(`Failed to upsert client profile row: ${profileError.message}`);
  }

  const { error: clientProfileError } = await supabaseAdmin.from("client_profiles").upsert(
    {
      user_id: userId,
      company_name: `Visibility Co ${runId}`,
      industry: "Fashion",
      website: "https://example.com",
      contact_name: "Client Viewer",
      contact_email: email,
      contact_phone: "555-000-0000",
      company_size: "1-10",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (clientProfileError) {
    throw new Error(`Failed to upsert client_profiles row: ${clientProfileError.message}`);
  }

  return { userId, email, password };
}

test.describe("Admin profile visibility", () => {
  test("admin can view another user's client profile via userId query", async ({
    page,
    request,
  }) => {
    const runId = Date.now();

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

    const seededClient = await seedClientProfileUser(runId);

    await page.context().clearCookies();
    await loginWithCredentials(page, {
      email: "admin@totlagency.com",
      password: "AdminPassword123!",
    });
    await expect(page).toHaveURL(/\/admin\/dashboard(\/|$)/, { timeout: 20_000 });

    await safeGoto(page, `/client/profile?userId=${seededClient.userId}`);
    await expect(page.locator("h1")).toContainText("Client Profile (Admin View)");
    await expect(page.getByText("Admin viewing as staff")).toBeVisible();
    await expect(page.getByText(`Visibility Co ${runId}`)).toBeVisible();
  });

  test("non-admin cannot view another user's client profile via userId", async ({
    page,
    request,
  }) => {
    const runId = Date.now();
    const seededClient = await seedClientProfileUser(runId);

    const talentUser = createTalentTestUser("pw-nonadmin-client-profile", {
      firstName: "NonAdmin",
      lastName: `User${runId}`,
    });
    const createTalentRes = await request.post("/api/admin/create-user", {
      data: {
        email: talentUser.email,
        password: talentUser.password,
        firstName: talentUser.firstName,
        lastName: talentUser.lastName,
        role: "talent",
      },
    });
    expect(createTalentRes.ok()).toBeTruthy();

    await page.context().clearCookies();
    await loginWithCredentials(page, { email: talentUser.email, password: talentUser.password });
    await expect(page).toHaveURL(/\/(talent\/dashboard|onboarding)(\/|$)/, {
      timeout: 20_000,
    });

    await safeGoto(page, `/client/profile?userId=${seededClient.userId}`);
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, { timeout: 20_000 });
  });
});
