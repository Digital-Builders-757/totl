import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Client profile route contracts", () => {
  test("client profile shell and core fields render", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/profile");

    await expect(page).toHaveURL(/\/client\/profile(\/|$)/);
    await expect(page.getByRole("heading", { name: "Complete Your Company Profile" })).toBeVisible();
    await expect(page.getByLabel("Company Name *")).toBeVisible();
    await expect(page.getByLabel("Contact Email *")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();
  });

  test("profile form sections are visible", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/profile");

    await expect(page.getByText("Step 1")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Company details" })).toBeVisible();
    await expect(page.getByText("Step 2")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Contact information" })).toBeVisible();
  });
});

test.describe("Client profile route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile profile shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsClient(page);
    await safeGoto(page, "/client/profile");

    await expect(page).toHaveURL(/\/client\/profile(\/|$)/);
    await expect(page.getByRole("heading", { name: "Complete Your Company Profile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save Profile" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
