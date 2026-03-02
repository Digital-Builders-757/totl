import { test, expect } from "@playwright/test";
import { loginWithCredentials, waitForLoginHydrated } from "../helpers/auth";
import { createTalentTestUser } from "../helpers/test-data";
import { safeGoto } from "../helpers/navigation";

test.describe("Sign-In Gate", () => {
  test.beforeEach(async ({ page }) => {
    await safeGoto(page, "/auth/signout");
  });

  test.describe("Gigs route auth gate", () => {
    test("logged out /gigs redirects to /login with returnUrl", async ({ page }) => {
      await safeGoto(page, "/gigs");
      await expect(page).toHaveURL(/\/login(\?|$)/);
      await waitForLoginHydrated(page);
      await expect(page.locator("h1")).toContainText(/welcome back/i);
      await expect(page.getByTestId("email")).toBeVisible();
      await expect(page.getByTestId("password")).toBeVisible();
      await expect(page.getByTestId("login-button")).toBeVisible();
    });

    test("logged in talent can access /gigs", async ({ page, request }, testInfo) => {
      const user = createTalentTestUser("pw-signin-gate", testInfo, {
        firstName: "Gate",
        variant: "gigs-access",
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

      await loginWithCredentials(page, { email: user.email, password: user.password });
      await safeGoto(page, "/gigs");
      await expect(page).toHaveURL(/\/gigs(\/|$)/);
      await expect(page.locator("h1")).not.toContainText(/welcome back/i);
    });
  });

  test.describe("Talent route contract", () => {
    test("logged out /talent resolves to 404", async ({ page }) => {
      await safeGoto(page, "/talent");
      await expect(page.locator("h1")).toHaveText("404");
    });

    test("logged in /talent still resolves to 404", async ({ page, request }, testInfo) => {
      const user = createTalentTestUser("pw-signin-gate-talent", testInfo, {
        firstName: "Gate",
        variant: "talent-404",
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

      await loginWithCredentials(page, { email: user.email, password: user.password });
      await safeGoto(page, "/talent");
      await expect(page.locator("h1")).toHaveText("404");
    });
  });

  test.describe("Accessibility sanity", () => {
    test("login surface has visible heading", async ({ page }) => {
      await safeGoto(page, "/gigs");
      const heading = page.locator("h1");
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(/welcome back/i);
    });

    test("login button is keyboard focusable", async ({ page }) => {
      await safeGoto(page, "/gigs");
      const loginButton = page.getByTestId("login-button");
      await loginButton.focus();
      await expect(loginButton).toBeFocused();
    });

    test("reduced-motion preference does not break auth gate rendering", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await safeGoto(page, "/gigs");
      await expect(page).toHaveURL(/\/login(\?|$)/);
      await expect(page.getByTestId("login-button")).toBeVisible();
    });
  });
});
