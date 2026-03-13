import { expect, type Page } from "@playwright/test";
import { loginWithCredentials } from "./auth";

/**
 * Admin credentials must match scripts/ensure-ui-audit-users.mjs.
 * Preflight (test:qa:route-users:preflight) creates this user via Supabase service role
 * before Playwright runs. Do not use /api/admin/create-user here — that endpoint
 * now requires admin auth (requireAdmin), so it cannot bootstrap the initial admin.
 */
const adminUser = {
  email: "admin@totlagency.com",
  password: "AdminPassword123!",
};

export async function loginAsAdmin(page: Page) {
  await page.context().clearCookies();
  await loginWithCredentials(page, {
    email: adminUser.email,
    password: adminUser.password,
  });
  await expect(page).toHaveURL(/\/admin\/dashboard(\/|$)/, { timeout: 30_000 });
}
