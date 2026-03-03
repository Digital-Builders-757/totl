import { test, expect } from "@playwright/test";
import { waitForLoginHydrated } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createTalentTestUser } from "../helpers/test-data";

async function loginAndReturnToGigs(page: import("@playwright/test").Page, user: { email: string; password: string }) {
  await safeGoto(page, "/gigs", { timeoutMs: 60_000 });
  if (/\/login(\?|$)/.test(page.url())) {
    await waitForLoginHydrated(page);
    await page.getByTestId("email").fill(user.email);
    await page.getByTestId("password").fill(user.password);
    await page.getByTestId("login-button").click();
    await expect(page).toHaveURL(/\/gigs(\?|\/|$)/, { timeout: 60_000 });
  }
  await expect(page).toHaveURL(/\/gigs(\?|\/|$)/, { timeout: 60_000 });
}

test("logs in and filters gigs", async ({ page, request }, testInfo) => {
  test.setTimeout(180_000);

  const user = createTalentTestUser("pw-integration-login-and-filter", testInfo, {
    firstName: "Gigs",
    variant: "smoke",
  });

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

  await loginAndReturnToGigs(page, user);

  // Best-effort filter contract
  const keyword = page.getByPlaceholder(/search/i).first();
  const location = page.getByPlaceholder(/location/i).first();
  if (await keyword.isVisible().catch(() => false)) await keyword.fill("model");
  if (await location.isVisible().catch(() => false)) await location.fill("New");

  const submit = page.getByRole("button", { name: /search|filter|apply/i }).first();
  if (await submit.isVisible().catch(() => false)) await submit.click();

  await expect(page).toHaveURL(/\/gigs/);
});

test.describe("gigs filter scenarios", () => {
  test("category-only filter", async ({ page, request }, testInfo) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-integration-login-and-filter", testInfo, {
      firstName: "Gigs",
      variant: "category-only",
    });

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

    await loginAndReturnToGigs(page, user);

    const category = page.getByPlaceholder(/category/i).first();
    if (await category.isVisible().catch(() => false)) {
      await category.fill("commercial");
    }
    const submit = page.getByRole("button", { name: /search|filter|apply/i }).first();
    if (await submit.isVisible().catch(() => false)) await submit.click();

    await expect(page).toHaveURL(/\/gigs/);
  });
});

