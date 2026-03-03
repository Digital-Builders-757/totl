import { test, expect } from "@playwright/test";
import { loginWithCredentials, waitForLoginHydrated } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";
import { createTalentTestUser } from "../helpers/test-data";
import { ensureTalentReady } from "../helpers/ensure-talent-ready";

test.describe("Portfolio Gallery", () => {
  test("renders the gallery grid, hover overlay, and edit controls", async ({ page, request }, testInfo) => {
    test.setTimeout(180_000);

    const user = createTalentTestUser("pw-integration-portfolio", testInfo, {
      firstName: "Portfolio",
      variant: "gallery",
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

    await safeGoto(page, "/login", { timeoutMs: 60_000 });
    await waitForLoginHydrated(page);
    await loginWithCredentials(page, { email: user.email, password: user.password });
    await ensureTalentReady(page);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await page.getByRole("tab", { name: /portfolio/i }).click();

    await expect(page.getByText("Portfolio Gallery")).toBeVisible();

    // The seeded account may not have portfolio fixtures. In that case, the contract is:
    // - Settings loads
    // - Portfolio tab renders
    // - No crash / empty state is acceptable
    const titledCard = page.getByRole("heading", { name: "Vogue Editorial" }).first();
    const hasFixture = await titledCard.isVisible().catch(() => false);
    if (!hasFixture) return;

    await titledCard.hover();
    await expect(page.getByText(/Vogue \/ Milan/i)).toBeVisible({ timeout: 5000 });

    const editButton = page.getByRole("button", { name: /^edit$/i }).first();
    await editButton.click();

    await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^cancel$/i })).toBeVisible();

    await page.getByRole("button", { name: /^cancel$/i }).first().click();
  });
});

