import { test, expect } from "@playwright/test";
import { loginAsTalent } from "../helpers/auth";
import { ensureTalentReady } from "../helpers/ensure-talent-ready";

test.describe("Portfolio Gallery", () => {
  test("renders the gallery grid, hover overlay, and edit controls", async ({ page }) => {
    await loginAsTalent(page);
    await ensureTalentReady(page);

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await page.getByRole("tab", { name: /portfolio/i }).click();

    await expect(page.getByText("Portfolio Gallery")).toBeVisible();

    const titledCard = page.getByRole("heading", { name: "Vogue Editorial" }).first();
    await expect(titledCard).toBeVisible();

    await titledCard.hover();
    await expect(page.getByText(/Vogue \/ Milan/i)).toBeVisible({ timeout: 5000 });

    const editButton = page.getByRole("button", { name: /^edit$/i }).first();
    await editButton.click();

    await expect(page.getByRole("button", { name: /^save$/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^cancel$/i })).toBeVisible();

    await page.getByRole("button", { name: /^cancel$/i }).first().click();
  });
});

