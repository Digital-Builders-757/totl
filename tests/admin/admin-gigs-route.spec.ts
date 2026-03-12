import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Admin gigs route contracts", () => {
  test("gigs shell renders with search and tabs", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/gigs");

    await expect(page).toHaveURL(/\/admin\/gigs(\/|$)/);
    await expect(page.getByRole("heading", { name: "All Opportunities" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create Opportunity/i })).toBeVisible();
    await expect(
      page.getByPlaceholder("Search by title, location, category, or company...")
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Active \(/i }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /Draft \(/i }).first()).toBeVisible();
  });

  test("gigs create route is reachable from admin", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/gigs/create");

    await expect(page).toHaveURL(/\/admin\/gigs\/create(\/|$)/);
    await expect(page.getByText(/create gig/i).first()).toBeVisible();
  });

  test("gigs success route renders valid-gig confirmation state", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/gigs/success?gigId=qa-gig-123");

    await expect(page).toHaveURL(/\/admin\/gigs\/success(\?|$)/);
    await expect(page.getByRole("heading", { name: /your gig has been submitted/i })).toBeVisible();
    await expect(page.getByText(/Gig ID: qa-gig-123/i)).toBeVisible();
  });

  test("gigs success route renders invalid-id fallback state", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/gigs/success");

    await expect(page).toHaveURL(/\/admin\/gigs\/success(\/|$)/);
    await expect(page.getByRole("heading", { name: /invalid gig id/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /create new gig/i })).toBeVisible();
  });
});

test.describe("Admin gigs route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile gigs shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/gigs");

    await expect(page).toHaveURL(/\/admin\/gigs(\/|$)/);
    await expect(page.getByRole("heading", { name: "All Opportunities" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /All \(/i }).first()).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
