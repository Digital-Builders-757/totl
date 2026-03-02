import { test, expect, type Page } from "@playwright/test";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";
import { loginWithCredentials } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

const adminUser = {
  email: "admin@totlagency.com",
  password: "AdminPassword123!",
};

async function ensureAdminUser(page: Page) {
  const res = await page.request.post("/api/admin/create-user", {
    data: {
      email: adminUser.email,
      password: adminUser.password,
      firstName: "Admin",
      lastName: "TOTL",
      role: "admin",
    },
  });
  expect(res.ok()).toBeTruthy();
}

async function loginAsAdmin(page: Page) {
  await ensureAdminUser(page);
  await page.context().clearCookies();
  await loginWithCredentials(page, {
    email: adminUser.email,
    password: adminUser.password,
  });
  await expect(page).toHaveURL(/\/admin\/dashboard(\/|$)/, { timeout: 30_000 });
}

async function seedClientForUsersTable(runId: number) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const email = `pw-admin-users-client-${runId}@example.com`;
  const password = "TestPassword123!";
  const displayName = `Client Visibility ${runId}`;

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Client",
      last_name: `Visibility${runId}`,
      role: "client",
    },
  });
  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message ?? "failed to create client user");
  }
  const userId = created.data.user.id;

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      role: "client",
      account_type: "client",
      email_verified: true,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (profileError) throw new Error(profileError.message);

  const { error: clientProfileError } = await supabaseAdmin.from("client_profiles").upsert(
    {
      user_id: userId,
      company_name: `Visibility Co ${runId}`,
      industry: "Fashion",
      contact_name: displayName,
      contact_email: email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (clientProfileError) throw new Error(clientProfileError.message);

  return { userId, displayName };
}

test.describe("Admin functionality (current contracts)", () => {
  test("dashboard renders core admin sections", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/dashboard");

    await expect(page.getByRole("heading", { name: "Quick Actions" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Platform Health" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent Activity" })).toBeVisible();
    await expect(page.getByTestId("paid-talent-card")).toBeVisible();
  });

  test("users page supports tabs/search and admin view profile link", async ({ page }) => {
    const runId = Date.now();
    const seededClient = await seedClientForUsersTable(runId);
    await loginAsAdmin(page);

    await safeGoto(page, "/admin/users");
    await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Career Builders/i })).toBeVisible();

    const searchInput = page.getByPlaceholder("Search by name, ID, or role...");
    await searchInput.fill(seededClient.displayName);
    await expect(page.getByText(seededClient.displayName)).toBeVisible();

    const row = page.locator("tr", { hasText: seededClient.displayName }).first();
    await row.getByRole("button").click();
    await page.getByRole("menuitem", { name: "View Career Builder Profile" }).click();

    await expect(page).toHaveURL(new RegExp(`/client/profile\\?userId=${seededClient.userId}`));
    await expect(page.getByText("Admin viewing as staff")).toBeVisible();
  });

  test("generic role endpoint rejects direct client promotion", async ({ page }) => {
    await loginAsAdmin(page);

    const timestamp = Date.now();
    const createRes = await page.request.post("/api/admin/create-user", {
      data: {
        email: `pw-role-guardrail-${timestamp}@example.com`,
        password: "TestPassword123!",
        firstName: "Role",
        lastName: "Guardrail",
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()) as { user?: { id?: string } };
    const userId = created.user?.id;
    expect(userId).toBeTruthy();

    const res = await page.request.post("/api/admin/update-user-role", {
      data: { userId, newRole: "client" },
    });
    expect(res.status()).toBe(400);
    const payload = (await res.json()) as { error?: string };
    expect(payload.error).toContain("Client promotion is only allowed via client application approval");
  });

  test("gigs page and create route are reachable for admin", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/gigs");
    await expect(page.getByRole("heading", { name: "All Gigs" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create Gig/i }).first()).toBeVisible();

    await safeGoto(page, "/admin/gigs/create");
    await expect(page.getByText(/create gig/i).first()).toBeVisible();
  });

  test("applications pages render with expected admin controls", async ({ page }) => {
    await loginAsAdmin(page);

    await safeGoto(page, "/admin/applications");
    await expect(page.getByRole("heading", { name: "Talent Applications" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /New/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Approved/i })).toBeVisible();

    await safeGoto(page, "/admin/client-applications");
    await expect(page.getByRole("heading", { name: "Career Builder Applications" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Send follow-ups/i })).toBeVisible();
    await expect(
      page.getByPlaceholder("Search by company, name, email, or industry...")
    ).toBeVisible();
  });

  test("diagnostic tools page loads for admin", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/diagnostic");

    await expect(page.getByRole("heading", { name: "Supabase Diagnostic Tools" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Environment Variables" })).toBeVisible();
  });
});
