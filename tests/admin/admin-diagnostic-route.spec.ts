import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Admin diagnostic route contracts", () => {
  test("diagnostic shell and environment panel render", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/diagnostic");

    await expect(page).toHaveURL(/\/admin\/diagnostic(\/|$)/);
    await expect(page.getByRole("heading", { name: "Supabase Diagnostic Tools" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Environment Variables" })).toBeVisible();
  });

  test("diagnostic environment keys are listed", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/diagnostic");

    await expect(page.getByText("NEXT_PUBLIC_SUPABASE_URL:", { exact: true })).toBeVisible();
    await expect(page.getByText("NEXT_PUBLIC_SUPABASE_ANON_KEY:", { exact: true })).toBeVisible();
    await expect(page.getByText("SUPABASE_URL:", { exact: true })).toBeVisible();
    await expect(page.getByText("SUPABASE_SERVICE_ROLE_KEY:", { exact: true })).toBeVisible();
  });
});

test.describe("Admin diagnostic route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile diagnostic shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/diagnostic");

    await expect(page).toHaveURL(/\/admin\/diagnostic(\/|$)/);
    await expect(page.getByRole("heading", { name: "Supabase Diagnostic Tools" })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
