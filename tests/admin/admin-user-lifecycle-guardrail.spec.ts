import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

async function seedUserWithRole(role: "talent" | "client" | "admin", runId: number) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const email = `pw-admin-lifecycle-${role}-${runId}@example.com`;
  const password = "TestPassword123!";

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Lifecycle",
      last_name: `${role}${runId}`,
      role,
    },
  });

  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message ?? "failed to create lifecycle user");
  }

  const userId = created.data.user.id;
  const accountType = role === "admin" ? "unassigned" : role;

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      role,
      account_type: accountType,
      email_verified: true,
      display_name: `Lifecycle ${role} ${runId}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { userId };
}

test.describe("Admin user lifecycle guardrails", () => {
  test("disable endpoint rejects unauthenticated callers", async ({ page }) => {
    const response = await page.request.post("/api/admin/disable-user", {
      data: { userId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(response.status()).toBe(401);
  });

  test("disable endpoint rejects non-client targets", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const talentUser = await seedUserWithRole("talent", runId);

    const response = await page.request.post("/api/admin/disable-user", {
      data: { userId: talentUser.userId, reason: "Guardrail check" },
    });

    expect(response.status()).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toContain("Career Builder");
  });

  test("hard delete endpoint rejects non-client and admin targets", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const talentUser = await seedUserWithRole("talent", runId);
    const adminUser = await seedUserWithRole("admin", runId + 1);

    const nonClientDelete = await page.request.post("/api/admin/delete-user", {
      data: { userId: talentUser.userId },
    });
    expect(nonClientDelete.status()).toBe(400);

    const adminDelete = await page.request.post("/api/admin/delete-user", {
      data: { userId: adminUser.userId },
    });
    expect(adminDelete.status()).toBe(403);
  });
});
