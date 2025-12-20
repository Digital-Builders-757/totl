import { test, expect, type Page } from "@playwright/test";

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login?returnUrl=/talent/dashboard&signedOut=true", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60_000 });
  await page.getByTestId("email").fill(email);
  await page.getByTestId("password").fill(password);

  await Promise.all([
    page.waitForURL((url) => new URL(url).pathname !== "/login", { timeout: 60_000 }),
    page.getByTestId("login-button").click(),
  ]);
}

test.describe("Profiles privacy sentinel", () => {
  test.describe.configure({ mode: "serial" }); // avoid dev-server compilation contention
  test.setTimeout(120_000);

  test("public profile does not show phone; owner can see phone", async ({ page }) => {
    const suffix = Date.now();
    const firstName = "Playwright";
    const lastName = `Sentinel${suffix}`;
    const email = `pw.talent.${suffix}@thetotlagency.local`;
    const password = "Password123!";
    const phone = "+15555550123";

    // Seed a talent account + talent_profile row (admin-only API).
    await page.request.post("/api/admin/create-user", {
      data: { email, password, firstName, lastName, role: "talent", phone },
    });

    const slug = createSlug(`${firstName} ${lastName}`);
    const publicPath = `/talent/${slug}`;

    // 1) Logged out: phone must not be visible.
    await page.context().clearCookies();
    await page.goto(publicPath, { waitUntil: "domcontentloaded" });
    await expect(page.locator(`text=${phone}`)).toHaveCount(0);

    // 2) Logged in as the owner: phone should be visible (best-effort behavior).
    await login(page, email, password);
    await page.goto(publicPath, { waitUntil: "domcontentloaded" });
    await expect(page.locator(`text=${phone}`)).toBeVisible();
  });
});

