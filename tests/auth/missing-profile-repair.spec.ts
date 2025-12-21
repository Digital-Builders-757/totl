import { test, expect } from "@playwright/test";
import { ensureTalentReady, loginWithCredentials } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createSupabaseAdminClientForTests } from "../helpers/supabase-admin";
import { createTalentTestUser } from "../helpers/test-data";

/**
 * Missing profile → repair (contract proof)
 *
 * Proves:
 * - deleting public.profiles is survivable
 * - re-login to /talent/dashboard recreates the profiles row via ensureProfileExists()
 * - no redirect loop (stays on dashboard)
 */

test.describe("Auth Bootstrap: Missing profile repair", () => {
  test("deleting profiles row then re-login repairs profile", async ({ page, request }) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-missing-profile", {
      firstName: "Missing",
      lastName: `Profile${Date.now()}`,
    });

    // Warm server (dev server can be compiling on first hit)
    await safeGoto(page, "/");

    // Create a verified talent user (admin API shortcut; avoids email inbox)
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

    const created = (await createRes.json()) as { user?: { id?: string } };
    const userId = created.user?.id;
    if (!userId) throw new Error("create-user did not return a user id");

    // Login once to establish session and confirm baseline dashboard access
    await page.context().clearCookies();
    await safeGoto(page, "/login");
    await loginWithCredentials(page, { email: user.email, password: user.password });
    await ensureTalentReady(page);
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);

    // Delete profiles row (do NOT rely on /api/dev/*; blocked under `next start`)
    const supabaseAdmin = createSupabaseAdminClientForTests();
    const { error: deleteProfileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);
    expect(deleteProfileError, deleteProfileError?.message ?? "delete profile failed").toBeNull();

    // Hard sign out and re-login (avoid cross-account/cookie leakage)
    await page.context().clearCookies();
    await safeGoto(page, "/login?signedOut=true");
    await loginWithCredentials(page, { email: user.email, password: user.password });
    await ensureTalentReady(page);

    // Should converge to dashboard (no loops)
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/, { timeout: 60_000 });

    // Bootstrap repair can take a moment; use DB truth (not UI) as the stability signal.
    // This avoids flake from the dashboard loading shell on slower Windows runs.
    type RepairedProfileRow = { id: string; role: string | null; account_type: string | null };
    let repairedProfile: RepairedProfileRow | null = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const result = await supabaseAdmin
        .from("profiles")
        .select("id, role, account_type")
        .eq("id", userId)
        .maybeSingle();

      repairedProfile = result.data as RepairedProfileRow | null;
      if (repairedProfile?.id === userId) break;
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(1000);
    }

    expect(repairedProfile?.id).toBe(userId);
    expect(repairedProfile?.role).toBe("talent");
    expect(repairedProfile?.account_type).toBe("talent");

    // No redirect loop: URL stays pinned to the dashboard over time.
    const firstUrl = page.url();
    await page.waitForTimeout(1500);
    expect(page.url()).toBe(firstUrl);
    await expect(page).toHaveURL(/\/talent\/dashboard(\/|$)/);

    // Spot-check talent_profiles also exists (bootstrap completeness).
    const talentResult = await supabaseAdmin
      .from("talent_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    const repairedTalent = talentResult.data as { user_id: string } | null;
    expect(repairedTalent?.user_id).toBe(userId);
  });
});
