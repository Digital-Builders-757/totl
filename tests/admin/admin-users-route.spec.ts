import { expect, test, type Page } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";
import { seedUserWithRole } from "../helpers/seed-admin-user";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

async function seedClientForUsersTable(runId: number, opts?: { isSuspended?: boolean }) {
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
      is_suspended: opts?.isSuspended ?? false,
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
    await expect(page.getByRole("tab", { name: /Suspended \(/i }).first()).toBeVisible();
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
    await expect(page.getByRole("menuitem", { name: "Suspend User" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Delete User" })).toHaveCount(0);
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

  test("users table shows subscription column and paid talent badge from profile data", async ({ page }) => {
    const runId = Date.now();
    const seededTalent = await seedUserWithRole("talent", runId);
    const supabaseAdmin = createSupabaseAdminClientForTests();
    const { error: subError } = await supabaseAdmin
      .from("profiles")
      .update({
        subscription_status: "active",
        subscription_plan: "monthly",
        updated_at: new Date().toISOString(),
      })
      .eq("id", seededTalent.userId);
    if (subError) throw new Error(subError.message);

    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    await expect(page.getByTestId("columnheader-subscription")).toBeVisible();
    await page.getByPlaceholder("Search by name, ID, or role...").fill(seededTalent.displayName);
    await expect(page.getByTestId(`user-subscription-${seededTalent.userId}`)).toHaveText("Paid · Monthly");
  });

  test("non-talent rows show N/A in subscription column", async ({ page }) => {
    const runId = Date.now();
    const seededAdmin = await seedUserWithRole("admin", runId);

    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    await page.getByPlaceholder("Search by name, ID, or role...").fill(seededAdmin.displayName);
    await expect(page.getByTestId(`user-subscription-${seededAdmin.userId}`)).toHaveText("N/A");
  });

  test("admin can hard-delete an eligible Talent user from actions menu", async ({ page }) => {
    const runId = Date.now();
    const seededTalent = await seedUserWithRole("talent", runId);

    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    const searchInput = page.getByPlaceholder("Search by name, ID, or role...");
    await searchInput.fill(seededTalent.displayName);
    const row = page.locator("tr", { hasText: seededTalent.displayName }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button").click();

    await page.getByRole("menuitem", { name: "Delete User" }).click();
    const deleteDialog = page.getByRole("dialog", { name: "Delete user permanently?" });
    await expect(deleteDialog).toBeVisible();

    await deleteDialog.getByRole("checkbox", { name: /Confirm permanent deletion/i }).check();
    await deleteDialog.getByRole("button", { name: "Delete User" }).click();

    await expect(page.locator("tr", { hasText: seededTalent.displayName })).toHaveCount(0, {
      timeout: 20_000,
    });
  });

  test("admin rows do not expose Delete User in actions menu", async ({ page }) => {
    const runId = Date.now();
    const seededAdmin = await seedUserWithRole("admin", runId);

    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    await page.getByPlaceholder("Search by name, ID, or role...").fill(seededAdmin.displayName);
    const row = page.locator("tr", { hasText: seededAdmin.displayName }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button").click();

    await expect(page.getByRole("menuitem", { name: "Delete User" })).toHaveCount(0);
  });

  test("admin rows do not expose Suspend User or Reinstate User", async ({ page }) => {
    const runId = Date.now();
    const seededAdmin = await seedUserWithRole("admin", runId);

    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    await page.getByPlaceholder("Search by name, ID, or role...").fill(seededAdmin.displayName);
    const row = page.locator("tr", { hasText: seededAdmin.displayName }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button").click();

    await expect(page.getByRole("menuitem", { name: "Suspend User" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Reinstate User" })).toHaveCount(0);
  });

  test("admin can suspend a Talent user and reinstate from Suspended tab", async ({ page }) => {
    const runId = Date.now();
    const seededTalent = await seedUserWithRole("talent", runId);

    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    const searchInput = page.getByPlaceholder("Search by name, ID, or role...");
    await searchInput.fill(seededTalent.displayName);
    const row = page.locator("tr", { hasText: seededTalent.displayName }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button").click();

    await page.getByRole("menuitem", { name: "Suspend User" }).click();
    const suspendDialog = page.getByRole("dialog", { name: "Suspend User" });
    await expect(suspendDialog).toBeVisible();
    await suspendDialog.getByRole("checkbox", { name: /Confirm suspend/i }).check();
    await suspendDialog.getByRole("button", { name: "Suspend User" }).click();

    await expect(row).toHaveCount(0, { timeout: 20_000 });

    await page.getByRole("tab", { name: /Suspended \(/i }).first().click();
    await searchInput.fill(seededTalent.displayName);
    const suspendedRow = page.locator("tr", { hasText: seededTalent.displayName }).first();
    await expect(suspendedRow).toBeVisible({ timeout: 20_000 });
    await suspendedRow.getByRole("button").click();
    await page.getByRole("menuitem", { name: "Reinstate User" }).click();

    const reinstateDialog = page.getByRole("dialog", { name: "Reinstate User" });
    await expect(reinstateDialog).toBeVisible();
    await reinstateDialog.getByRole("checkbox", { name: /Confirm reinstate/i }).check();
    await reinstateDialog.getByRole("button", { name: "Reinstate User" }).click();

    await expect(suspendedRow).toHaveCount(0, { timeout: 20_000 });

    await page.getByRole("tab", { name: /All \(/i }).first().click();
    await searchInput.fill(seededTalent.displayName);
    await expect(page.locator("tr", { hasText: seededTalent.displayName }).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});

test.describe("Admin users route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  /** Mobile stacks use `MobileListRowCard` under `.space-y-3.md:hidden`; desktop table uses `rounded-xl` + `hidden md:block`—generic `div.rounded-xl` matched the hidden table first. */
  function mobileUserListCard(page: Page, displayName: string) {
    return page
      .locator("div.space-y-3.md\\:hidden > div.panel-frosted.rounded-2xl")
      .filter({ hasText: displayName });
  }

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

  test("suspended user appears only in Suspended tab with role and suspended badges", async ({
    page,
  }) => {
    const runId = Date.now();
    const seededClient = await seedClientForUsersTable(runId, { isSuspended: true });

    await loginAsAdmin(page);
    await safeGoto(page, "/admin/users");

    // Suspended user must NOT appear in Career Builders tab
    await page.getByRole("tab", { name: /Career Builders \(/i }).first().click();
    await page.getByPlaceholder("Search by name, ID, or role...").fill(seededClient.displayName);
    await expect(mobileUserListCard(page, seededClient.displayName)).toHaveCount(0);

    // Suspended user MUST appear in Suspended tab
    await page.getByRole("tab", { name: /Suspended \(/i }).first().click();
    await page.getByPlaceholder("Search by name, ID, or role...").fill(seededClient.displayName);
    const suspendedCard = mobileUserListCard(page, seededClient.displayName).first();
    await expect(suspendedCard).toBeVisible();
    await expect
      .poll(async () => {
        const text = (await suspendedCard.textContent()) ?? "";
        return (text.match(/Career Builder/g) ?? []).length;
      })
      .toBeGreaterThanOrEqual(1);
    await expect
      .poll(async () => {
        const text = (await suspendedCard.textContent()) ?? "";
        return (text.match(/Suspended/g) ?? []).length;
      })
      .toBeGreaterThanOrEqual(1);
  });
});
