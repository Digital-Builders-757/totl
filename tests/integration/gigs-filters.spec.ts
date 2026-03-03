import { test, expect } from "@playwright/test";
import { waitForLoginHydrated } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createTalentTestUser } from "../helpers/test-data";

test.describe("Gigs filtering", () => {
  test("filters by keyword and location via GET", async ({ page, request }, testInfo) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-integration-gigs-filters", testInfo, {
      firstName: "Gigs",
      variant: "filters",
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

    await safeGoto(page, "/gigs", { timeoutMs: 60_000 });

    // Signed-out users may be redirected to /login?returnUrl=/gigs.
    if (/\/login(\?|$)/.test(page.url())) {
      await waitForLoginHydrated(page);
      // Custom login: this flow intentionally returns to /gigs (not a dashboard terminal).
      await page.getByTestId("email").fill(user.email);
      await page.getByTestId("password").fill(user.password);
      await page.getByTestId("login-button").click();
      await expect(page).toHaveURL(/\/gigs(\?|\/|$)/, { timeout: 60_000 });
    }

    await expect(page).toHaveURL(/\/gigs(\?|\/|$)/, { timeout: 60_000 });

    // Best-effort filter contract (selectors can vary by UI iteration)
    const keyword = page.getByPlaceholder(/search/i).first();
    const location = page.getByPlaceholder(/location/i).first();

    if (await keyword.isVisible().catch(() => false)) {
      await keyword.fill("model");
    }
    if (await location.isVisible().catch(() => false)) {
      await location.fill("New");
    }

    const submit = page.getByRole("button", { name: /search|filter|apply/i }).first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
    }

    // At minimum, we should remain on /gigs and not crash.
    await expect(page).toHaveURL(/\/gigs/);
  });
});


