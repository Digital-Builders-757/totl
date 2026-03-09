import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

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

test.describe("Admin users route contracts", () => {
  test("users shell, creation CTA, and tabs render", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    await expect(page).toHaveURL(/\/admin\/users(\/|$)/);
    await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create User" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Talent \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Career Builders \(/i }).first()).toBeVisible();
    await expect(page.getByPlaceholder("Search by name, ID, or role...")).toBeVisible();
  });

  test("users tabs are interactive with stable table shell", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    await page.getByRole("tab", { name: /Career Builders \(/i }).first().click();
    await expect(page.getByRole("tab", { name: /Career Builders \(/i }).first()).toBeVisible();

    const noUsers = page.getByRole("heading", { name: "No Users Found" });
    if (await noUsers.isVisible()) {
      await expect(noUsers).toBeVisible();
      return;
    }

    await expect(
      page.getByRole("columnheader", { name: "User", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  });

  test("admin can open client profile view from users actions menu", async ({ page }) => {
    const runId = Date.now();
    const seededClient = await seedClientForUsersTable(runId);
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    const searchInput = page.getByPlaceholder("Search by name, ID, or role...");
    await searchInput.fill(seededClient.displayName);
    const row = page.locator("tr", { hasText: seededClient.displayName }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button").click();
    await expect(page.getByRole("menuitem", { name: "Disable Career Builder" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Hard Delete (Danger)" })).toHaveCount(0);
    await page.getByRole("menuitem", { name: "View Career Builder Profile" }).click();

    await expect(page).toHaveURL(new RegExp(`/client/profile\\?userId=${seededClient.userId}`));
    await expect(page.getByText("Admin viewing as staff")).toBeVisible();
  });

  test("users create route is reachable from admin", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users/create");

    await expect(page).toHaveURL(/\/admin\/users\/create(\/|$)/);
    await expect(page.getByRole("heading", { name: "Create New User" }).first()).toBeVisible();
  });
});

test.describe("Admin users route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile users shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    await expect(page).toHaveURL(/\/admin\/users(\/|$)/);
    await expect(page.getByRole("heading", { name: "All Users" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
