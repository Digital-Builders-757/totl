import { test, expect, type Locator, type Page } from "@playwright/test";
import { loginWithCredentials } from "../helpers/auth";
import { ensureClientFixture } from "../helpers/integration-fixtures";
import { createTalentTestUser } from "../helpers/test-data";

/**
 * Mobile horizontal overflow sentinel
 *
 * Goal: Catch regressions where the page becomes horizontally scrollable on mobile.
 * Keep this suite small + public-route only to stay fast and reliable.
 */

async function expectNoHorizontalOverflow(page: Page, label: string) {
  // Avoid networkidle in dev-mode (can hang due to long-lived connections).
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(250);

  const metrics = await page.evaluate(() => {
    const el = document.documentElement;
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
  });

  expect(
    metrics.scrollWidth,
    `${label}: horizontal overflow detected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

async function gotoAndAssertNoOverflow(
  page: Page,
  url: string,
  label: string,
  ready?: Locator
) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (ready) {
    // In Next.js dev mode, first-hit route compilation can be slow.
    await expect(ready).toBeVisible({ timeout: 60000 });
  }
  await expectNoHorizontalOverflow(page, label);
}

test.describe("UI overflow sentinel (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14-ish
  test.describe.configure({ mode: "serial" }); // avoid dev-server compile contention

  test("home has no horizontal overflow", async ({ page }) => {
    await gotoAndAssertNoOverflow(
      page,
      "/",
      "home",
      page.locator('text=Connect with').first()
    );
  });

  test("login has no horizontal overflow", async ({ page }) => {
    await gotoAndAssertNoOverflow(
      page,
      "/login",
      "login",
      page.getByTestId("login-hydrated")
    );
  });

  test("choose role has no horizontal overflow", async ({ page }) => {
    await page.goto("/choose-role", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60000 });
    await expectNoHorizontalOverflow(page, "choose role");
  });

  test("verification pending (long email) has no horizontal overflow", async ({ page }) => {
    const longEmail =
      "very.long.email.address.with.lots.of.parts.and.a.long.subdomain+tag@example-very-long-domain-name.com";

    await gotoAndAssertNoOverflow(
      page,
      `/verification-pending?email=${encodeURIComponent(longEmail)}&new=true`,
      "verification pending",
      page.locator('text=Verify your email')
    );
  });

  test("talent signup redirect (to choose role) has no horizontal overflow", async ({ page }) => {
    await page.goto("/talent/signup", { waitUntil: "domcontentloaded" });

    // /talent/signup may redirect to /choose-role?returnUrl=... OR /login?returnUrl=... depending on auth gating.
    await page.waitForURL(/\/(choose-role|login)/, { timeout: 60000 });

    if (/\/choose-role/.test(page.url())) {
      await expect(page.getByTestId("choose-role-hydrated")).toHaveText("ready", { timeout: 60000 });
      await expectNoHorizontalOverflow(page, "talent signup redirect → choose role");
      return;
    }

    // If we land on login, assert login hydration + overflow there (still satisfies mobile overflow intent).
    await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });
    await expectNoHorizontalOverflow(page, "talent signup redirect → login");
  });

  test("client apply page has no horizontal overflow", async ({ page }) => {
    await page.goto("/client/apply", { waitUntil: "domcontentloaded" });

    // Signed-out users can be gated to /login?returnUrl=/client/apply.
    if (/\/login(\?|$)/.test(page.url())) {
      await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });
      await expectNoHorizontalOverflow(page, "client apply (redirect → login)");
      return;
    }

    await expect(page.locator('h1:has-text("Career Builder Application")')).toBeVisible({ timeout: 60000 });
    await expectNoHorizontalOverflow(page, "client apply");
  });

  test("client apply success (long applicationId) has no horizontal overflow", async ({ page }) => {
    const longId = "4f4e99aa-1234-5678-9abc-0123456789ab";
    await page.goto(`/client/apply/success?applicationId=${encodeURIComponent(longId)}`, {
      waitUntil: "domcontentloaded",
    });

    if (/\/login(\?|$)/.test(page.url())) {
      await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });
      await expectNoHorizontalOverflow(page, "client apply success (redirect → login)");
      return;
    }

    await expect(page.locator('text=Application Submitted Successfully')).toBeVisible({ timeout: 60000 });
    await expectNoHorizontalOverflow(page, "client apply success");
  });

  test("client application status (prefilled long applicationId) has no horizontal overflow", async ({
    page,
  }) => {
    const longId = "4f4e99aa-1234-5678-9abc-0123456789ab";
    await page.goto(`/client/application-status?applicationId=${encodeURIComponent(longId)}`, {
      waitUntil: "domcontentloaded",
    });

    if (/\/login(\?|$)/.test(page.url())) {
      await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });
      await expectNoHorizontalOverflow(page, "client application status (redirect → login)");
      return;
    }

    await expect(page.locator('text=Check Your Application Status')).toBeVisible({ timeout: 60000 });
    await expectNoHorizontalOverflow(page, "client application status");
  });

  test("gigs (signed out sign-in gate) has no horizontal overflow", async ({ page }) => {
    await page.goto("/gigs", { waitUntil: "domcontentloaded" });

    // Signed-out users may be gated to /login?returnUrl=/gigs.
    if (/\/login(\?|$)/.test(page.url())) {
      await expect(page.getByTestId("login-hydrated")).toHaveText("ready", { timeout: 60000 });
      await expectNoHorizontalOverflow(page, "gigs (signed out → login)");
      return;
    }

    // If the gigs page is accessible, assert no overflow on the gigs surface.
    await expectNoHorizontalOverflow(page, "gigs (signed out)");
  });

  test("talent (signed out) has no horizontal overflow", async ({ page }) => {
    // /talent is intentionally disabled (true 404). Ensure no mobile overflow on the 404 surface.
    await gotoAndAssertNoOverflow(page, "/talent", "talent (404)");
  });

  test("client dashboard has no horizontal overflow", async ({ page }) => {
    const clientUser = createTalentTestUser("pw-overflow-client", test.info(), {
      firstName: "Overflow",
      lastName: "Client",
      variant: "dashboard",
    });
    await ensureClientFixture(clientUser);
    await loginWithCredentials(
      page,
      { email: clientUser.email, password: clientUser.password },
      { returnUrl: "/client/dashboard" }
    );
    await page.goto("/client/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/client\/dashboard/);
    await expectNoHorizontalOverflow(page, "client dashboard");
  });
});

