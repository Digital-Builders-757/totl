import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Client gigs route contracts", () => {
  test("gigs shell renders with search and status tabs", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/gigs");

    await expect(page).toHaveURL(/\/client\/gigs(\/|$)/);
    await expect(page.getByRole("heading", { name: "My Opportunities" }).first()).toBeVisible();
    await expect(
      page.getByPlaceholder("Search opportunities by title, description, or location...")
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /All Opportunities \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Active \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Completed \(/i }).first()).toBeVisible();
  });

  test("gigs tabs support empty and populated states", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/gigs");

    await page.getByRole("tab", { name: /Active \(/i }).first().click();
    await expect(page.getByRole("tab", { name: /Active \(/i }).first()).toBeVisible();

    const emptyState = page.getByRole("heading", { name: "No opportunities found" });
    if (await emptyState.isVisible()) {
      await expect(page.getByRole("link", { name: /Post Your First Opportunity/i })).toBeVisible();
      return;
    }

    await expect(page.getByRole("button", { name: "Applications" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "View" }).first()).toBeVisible();
  });
});

test.describe("Client gigs route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile gigs shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/gigs");

    await expect(page).toHaveURL(/\/client\/gigs(\/|$)/);
    // Mobile density can hide the large shell heading;
    // search + primary tab remain stable route contract markers.
    await expect(
      page.getByPlaceholder("Search opportunities by title, description, or location...")
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /All Opportunities \(/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
