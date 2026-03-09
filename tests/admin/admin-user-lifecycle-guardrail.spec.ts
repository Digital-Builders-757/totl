import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { loginWithCredentials } from "../helpers/auth";
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

  return { userId, email, password };
}

async function seedClientWithApplication(runId: number) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const clientUser = await seedUserWithRole("client", runId);

  const { error: applicationError } = await supabaseAdmin.from("client_applications").upsert(
    {
      user_id: clientUser.userId,
      first_name: "Lifecycle",
      last_name: `Client${runId}`,
      email: clientUser.email,
      company_name: `Lifecycle Co ${runId}`,
      business_description: "Playwright FK guardrail client application",
      needs_description: "Needs vetted talent for testing",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (applicationError) {
    throw new Error(applicationError.message);
  }

  return clientUser;
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

  test("disable endpoint rejects authenticated non-admin callers", async ({ page }) => {
    const runId = Date.now();
    const clientUser = await seedUserWithRole("client", runId);
    const nonAdminUser = await seedUserWithRole("talent", runId + 1);
    await loginWithCredentials(page, {
      email: nonAdminUser.email,
      password: nonAdminUser.password,
    });

    const response = await page.request.post("/api/admin/disable-user", {
      data: { userId: clientUser.userId, reason: "Forbidden guardrail check" },
    });

    expect(response.status()).toBe(403);
  });

  test("disable endpoint succeeds even when client_applications rows exist", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const clientUser = await seedClientWithApplication(runId);

    const response = await page.request.post("/api/admin/disable-user", {
      data: { userId: clientUser.userId, reason: "FK-safe disable check" },
    });

    expect(response.status()).toBe(200);

    const supabaseAdmin = createSupabaseAdminClientForTests();
    const { data: disabledProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_suspended")
      .eq("id", clientUser.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    expect(disabledProfile?.is_suspended).toBeTruthy();
  });

  test("hard delete endpoint blocks Career Builder targets with clear guidance", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const clientUser = await seedClientWithApplication(runId);

    const response = await page.request.post("/api/admin/delete-user", {
      data: { userId: clientUser.userId },
    });

    expect(response.status()).toBe(409);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toContain("Use Disable Career Builder instead");
  });
});
