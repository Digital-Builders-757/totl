import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Admin client applications route contracts", () => {
  test("client applications shell and controls render", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/client-applications");

    await expect(page).toHaveURL(/\/admin\/client-applications(\/|$)/);
    await expect(
      page.getByRole("heading", { name: "Career Builder Applications" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Send follow-ups/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Export CSV/i })).toBeVisible();
    await expect(
      page.getByPlaceholder("Search by company, name, email, or industry...")
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /Pending \(/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Approved \(/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Rejected \(/i })).toBeVisible();
  });

  test("pending tab supports empty and table states", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/client-applications");

    await page.getByRole("tab", { name: /Pending \(/i }).click();
    await expect(page.getByRole("tab", { name: /Pending \(/i })).toBeVisible();

    const emptyTitle = page.getByRole("heading", { name: "No Pending Applications" });
    if (await emptyTitle.isVisible()) {
      await expect(emptyTitle).toBeVisible();
      return;
    }

    await expect(page.getByRole("columnheader", { name: "Company Name" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Actions" })).toBeVisible();
  });

  test("existing-account invite fallback offers sign-in link action", async ({ page }) => {
    const runId = Date.now();
    const existingEmail = `pw-existing-client-invite-${runId}@example.com`;

    await loginAsAdmin(page);

    const createRes = await page.request.post("/api/admin/create-user", {
      data: {
        email: existingEmail,
        password: "TestPassword123!",
        firstName: "Existing",
        lastName: "Invite",
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();

    await safeGoto(page, "/admin/client-applications");

    await page.getByLabel("Invite VIP Career Builder Applicant").fill(existingEmail);
    await page.getByRole("button", { name: "Send invite" }).click();

    await expect(page.getByText("This email already belongs to an existing user.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send sign-in link" })).toBeVisible();
  });
});

test.describe("Admin client applications route contracts (mobile 390x844)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile shell remains reachable without horizontal overflow", async ({ page }) => {
    await loginAsAdmin(page);
    await safeGoto(page, "/admin/client-applications");

    await expect(page).toHaveURL(/\/admin\/client-applications(\/|$)/);
    await expect(
      page.getByRole("heading", { name: "Career Builder Applications" })
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /Pending \(/i })).toBeVisible();

    const noOverflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth <= el.clientWidth + 1;
    });
    expect(noOverflow).toBeTruthy();
  });
});
