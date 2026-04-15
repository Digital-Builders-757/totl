import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { loginWithCredentials } from "../helpers/auth";
import { seedUserWithRole } from "../helpers/seed-admin-user";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

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
  test("set-user-suspension rejects unauthenticated callers", async ({ page }) => {
    const response = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: "00000000-0000-0000-0000-000000000000", suspended: true },
    });
    expect(response.status()).toBe(401);
  });

  test("set-user-suspension requires suspended boolean", async ({ page }) => {
    await loginAsAdmin(page);
    const talentUser = await seedUserWithRole("talent", Date.now());

    const response = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: talentUser.userId, reason: "missing suspended" },
    });

    expect(response.status()).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toMatch(/suspended/i);
  });

  test("set-user-suspension suspends Talent targets", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const talentUser = await seedUserWithRole("talent", runId);

    const response = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: talentUser.userId, suspended: true, reason: "Guardrail talent suspend" },
    });

    expect(response.status()).toBe(200);

    const supabaseAdmin = createSupabaseAdminClientForTests();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_suspended")
      .eq("id", talentUser.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    expect(profile?.is_suspended).toBeTruthy();
  });

  test("legacy disable-user endpoint still suspends when body omits suspended (compat)", async ({
    page,
  }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const talentUser = await seedUserWithRole("talent", runId);

    const response = await page.request.post("/api/admin/disable-user", {
      data: { userId: talentUser.userId, reason: "Legacy compat" },
    });

    expect(response.status()).toBe(200);

    const supabaseAdmin = createSupabaseAdminClientForTests();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_suspended")
      .eq("id", talentUser.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    expect(profile?.is_suspended).toBeTruthy();
  });

  test("set-user-suspension rejects authenticated non-admin callers", async ({ page }) => {
    const runId = Date.now();
    const clientUser = await seedUserWithRole("client", runId);
    const nonAdminUser = await seedUserWithRole("talent", runId + 1);
    await loginWithCredentials(page, {
      email: nonAdminUser.email,
      password: nonAdminUser.password,
    });

    const response = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: clientUser.userId, suspended: true, reason: "Forbidden guardrail check" },
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

  test("set-user-suspension reinstates and clears suspension state", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const clientUser = await seedUserWithRole("client", runId);

    const suspendRes = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: clientUser.userId, suspended: true, reason: "To be cleared" },
    });
    expect(suspendRes.status()).toBe(200);

    const reinstateRes = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: clientUser.userId, suspended: false },
    });
    expect(reinstateRes.status()).toBe(200);

    const supabaseAdmin = createSupabaseAdminClientForTests();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("is_suspended, suspension_reason")
      .eq("id", clientUser.userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    expect(profile?.is_suspended).toBeFalsy();
    expect(profile?.suspension_reason).toBeNull();
  });

  test("set-user-suspension rejects admin targets", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const otherAdmin = await seedUserWithRole("admin", runId);

    const response = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: otherAdmin.userId, suspended: true },
    });

    expect(response.status()).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toMatch(/admin/i);
  });

  test("set-user-suspension rejects acting on own account", async ({ page }) => {
    await loginAsAdmin(page);

    const supabaseAdmin = createSupabaseAdminClientForTests();
    const adminEmail = "admin@totlagency.com";
    let adminUserId: string | undefined;
    let listPage = 1;
    const perPage = 1000;

    while (!adminUserId && listPage <= 5) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: listPage,
        perPage,
      });
      if (listError) {
        throw new Error(listError.message);
      }
      adminUserId = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
      )?.id;
      if (adminUserId) break;
      if (!usersData?.users?.length || usersData.users.length < perPage) break;
      listPage += 1;
    }

    if (!adminUserId) {
      throw new Error("Expected admin@totlagency.com in auth user list for self-action guard test");
    }

    const response = await page.request.post("/api/admin/set-user-suspension", {
      data: { userId: adminUserId, suspended: true },
    });

    expect(response.status()).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toMatch(/own account/i);
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
    expect(payload.error).toContain("Use Suspend User instead");
  });

  test("hard delete endpoint rejects deleting own admin account", async ({ page }) => {
    await loginAsAdmin(page);

    const supabaseAdmin = createSupabaseAdminClientForTests();
    const adminEmail = "admin@totlagency.com";
    let adminUserId: string | undefined;
    let listPage = 1;
    const perPage = 1000;

    while (!adminUserId && listPage <= 5) {
      const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: listPage,
        perPage,
      });
      if (listError) {
        throw new Error(listError.message);
      }
      adminUserId = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
      )?.id;
      if (adminUserId) break;
      if (!usersData?.users?.length || usersData.users.length < perPage) break;
      listPage += 1;
    }

    if (!adminUserId) {
      throw new Error("Expected admin@totlagency.com in auth user list for self-delete guard test");
    }

    const response = await page.request.post("/api/admin/delete-user", {
      data: { userId: adminUserId },
    });

    expect(response.status()).toBe(400);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toMatch(/own account/i);
  });

  test("hard delete succeeds when content_flags assigns the target talent as assigned_admin", async ({
    page,
  }) => {
    const runId = Date.now();
    await loginAsAdmin(page);
    const reporterUser = await seedUserWithRole("talent", runId);
    const targetUser = await seedUserWithRole("talent", runId + 1);

    const supabaseAdmin = createSupabaseAdminClientForTests();
    const { error: flagError } = await supabaseAdmin.from("content_flags").insert({
      resource_type: "talent_profile",
      resource_id: targetUser.userId,
      reporter_id: reporterUser.userId,
      assigned_admin_id: targetUser.userId,
      reason: "Guardrail: assigned_admin equals deleted talent profile",
      status: "open",
    });

    if (flagError) {
      throw new Error(flagError.message);
    }

    const response = await page.request.post("/api/admin/delete-user", {
      data: { userId: targetUser.userId },
    });

    expect(response.status()).toBe(200);
    const payload = (await response.json()) as { success?: boolean };
    expect(payload.success).toBeTruthy();

    const { data: staleAssigned } = await supabaseAdmin
      .from("content_flags")
      .select("id")
      .eq("assigned_admin_id", targetUser.userId);

    expect(staleAssigned?.length ?? 0).toBe(0);
  });
});
