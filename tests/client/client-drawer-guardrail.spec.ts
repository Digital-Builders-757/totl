import { expect, test } from "@playwright/test";
import { loginAsClient } from "../helpers/auth";
import { safeGoto } from "../helpers/navigation";

test.describe("Client drawer guardrails", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  const terminalRoutes = [
    "/client/dashboard",
    "/client/applications",
    "/client/gigs",
    "/client/bookings",
  ];

  test("drawer exposes client-scoped nav links only", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/dashboard");

    const trigger = page.getByTestId("client-drawer-trigger");
    await expect(trigger).toBeVisible();
    await trigger.click();

    const panel = page.getByTestId("client-drawer-panel");
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "My Gigs" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Applications" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Bookings" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Settings" })).toBeVisible();

    await expect(panel.locator('a[href^="/admin"]')).toHaveCount(0);
    await expect(panel.locator('a[href^="/talent"]')).toHaveCount(0);
  });

  test("drawer closes on backdrop tap and route change", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });
    await safeGoto(page, "/client/dashboard");

    await page.getByTestId("client-drawer-trigger").click();
    const panel = page.getByTestId("client-drawer-panel");
    await expect(panel).toBeVisible();

    // On 390px viewport, panel width is capped at 320px.
    await page.mouse.click(380, 120);
    await expect(panel).toBeHidden();

    await page.getByTestId("client-drawer-trigger").click();
    await expect(panel).toBeVisible();
    await panel.getByRole("link", { name: "Applications" }).click();
    await expect(page).toHaveURL(/\/client\/applications(\/|$)/);
    await expect(panel).toBeHidden();
  });

  test("drawer trigger/panel remain available across client terminal routes", async ({ page }) => {
    await loginAsClient(page, { returnUrl: "/client/dashboard" });

    for (const route of terminalRoutes) {
      // eslint-disable-next-line no-await-in-loop
      await safeGoto(page, route);
      const trigger = page.getByTestId("client-drawer-trigger");
      const panel = page.getByTestId("client-drawer-panel");
      // eslint-disable-next-line no-await-in-loop
      await expect(trigger).toBeVisible();
      // eslint-disable-next-line no-await-in-loop
      await trigger.click();
      // eslint-disable-next-line no-await-in-loop
      await expect(panel).toBeVisible();
      // eslint-disable-next-line no-await-in-loop
      await page.getByTestId("client-drawer-close").click();
      // eslint-disable-next-line no-await-in-loop
      await expect(panel).toBeHidden();
    }
  });
});
