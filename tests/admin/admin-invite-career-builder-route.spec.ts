import { expect, test } from "@playwright/test";
import { loginWithCredentials } from "../helpers/auth";
import { loginAsAdmin } from "../helpers/admin-auth";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";

async function seedNonAdminUser(runId: number) {
  const supabaseAdmin = createSupabaseAdminClientForTests();
  const email = `pw-invite-non-admin-${runId}@example.com`;
  const password = "TestPassword123!";

  const created = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: "Invite",
      last_name: `User${runId}`,
      role: "talent",
    },
  });

  if (created.error || !created.data.user?.id) {
    throw new Error(created.error?.message ?? "failed to create non-admin user");
  }

  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      id: created.data.user.id,
      role: "talent",
      account_type: "talent",
      email_verified: true,
      display_name: `Invite User ${runId}`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(profileError.message);
  }

  return { email, password };
}

test.describe("Admin invite Career Builder route", () => {
  test("unauthenticated callers are rejected", async ({ page }) => {
    const response = await page.request.post("/api/admin/invite-career-builder", {
      data: { email: "invite-target@example.com" },
    });

    expect(response.status()).toBe(401);
  });

  test("non-admin authenticated callers are rejected", async ({ page }) => {
    const runId = Date.now();
    const nonAdminUser = await seedNonAdminUser(runId);
    await loginWithCredentials(page, nonAdminUser);

    const response = await page.request.post("/api/admin/invite-career-builder", {
      data: { email: `invite-target-${runId}@example.com` },
    });

    expect(response.status()).toBe(403);
  });

  test("admin can invite a new Career Builder email with correct callback target", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);

    const response = await page.request.post("/api/admin/invite-career-builder", {
      data: { email: `pw-invite-target-${runId}@example.com` },
    });

    expect(response.status()).toBe(200);
    const payload = (await response.json()) as {
      success?: boolean;
      email?: string;
      redirectTo?: string;
    };

    expect(payload.success).toBe(true);
    expect(payload.email).toBe(`pw-invite-target-${runId}@example.com`);
    expect(payload.redirectTo).toContain("/auth/callback");
    expect(payload.redirectTo).toContain(encodeURIComponent("/client/apply"));
  });

  test("admin gets clear guidance when invite email already exists", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);

    const existingEmail = `pw-invite-existing-${runId}@example.com`;
    const createRes = await page.request.post("/api/admin/create-user", {
      data: {
        email: existingEmail,
        password: "TestPassword123!",
        firstName: "Existing",
        lastName: "Invite",
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    const response = await page.request.post("/api/admin/invite-career-builder", {
      data: { email: existingEmail },
    });

    expect(response.status()).toBe(409);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toContain("already exists");
    expect(payload.error).toContain("/client/apply");
  });

  test("admin can send an existing-user sign-in link back to /client/apply", async ({ page }) => {
    const runId = Date.now();
    await loginAsAdmin(page);

    const existingEmail = `pw-existing-login-link-${runId}@example.com`;
    const createRes = await page.request.post("/api/admin/create-user", {
      data: {
        email: existingEmail,
        password: "TestPassword123!",
        firstName: "Existing",
        lastName: "LoginLink",
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    const response = await page.request.post("/api/admin/send-career-builder-login-link", {
      data: { email: existingEmail },
    });

    expect(response.status()).toBe(200);
    const payload = (await response.json()) as { success?: boolean; email?: string };
    expect(payload.success).toBe(true);
    expect(payload.email).toBe(existingEmail);
  });
});
