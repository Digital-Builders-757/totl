import { expect, type Page } from "@playwright/test";
import { loginWithCredentials } from "./auth";

const adminUser = {
  email: "admin@totlagency.com",
  password: "AdminPassword123!",
};

async function ensureAdminUser(page: Page) {
  let res;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      // Retry once for occasional local ECONNRESET during API warmup.
      // eslint-disable-next-line no-await-in-loop
      res = await page.request.post("/api/admin/create-user", {
        data: {
          email: adminUser.email,
          password: adminUser.password,
          firstName: "Admin",
          lastName: "TOTL",
          role: "admin",
        },
      });
      break;
    } catch (error) {
      if (attempt === 1) throw error;
      // eslint-disable-next-line no-await-in-loop
      await page.waitForTimeout(400);
    }
  }

  if (!res) {
    throw new Error("Failed to create admin user for tests");
  }
  expect(res.ok()).toBeTruthy();
}

export async function loginAsAdmin(page: Page) {
  await ensureAdminUser(page);
  await page.context().clearCookies();
  await loginWithCredentials(page, {
    email: adminUser.email,
    password: adminUser.password,
  });
  await expect(page).toHaveURL(/\/admin\/dashboard(\/|$)/, { timeout: 30_000 });
}
