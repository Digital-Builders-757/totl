import { test, expect } from "@playwright/test";
import { loginWithCredentials } from "../helpers/auth";
import {
  createNameSlug,
  ensureClientFixture,
  ensureTalentFixture,
} from "../helpers/integration-fixtures";
import { safeGoto } from "../helpers/navigation";
import { createTalentTestUser } from "../helpers/test-data";

test.describe("Talent public profile", () => {
  test("keeps sensitive info gated for anonymous visitors", async ({ page }, testInfo) => {
    const slugSuffix = `${testInfo.workerIndex}a`;
    const talentUser = createTalentTestUser("pw-public-talent", testInfo, {
      firstName: `Public${slugSuffix}`,
      lastName: `Anon${slugSuffix}`,
      variant: "anon-gate",
    });
    await ensureTalentFixture(talentUser);

    const talentSlug = createNameSlug(talentUser.firstName, talentUser.lastName);
    const publicProfilePath = `/talent/${talentSlug}`;

    await safeGoto(page, publicProfilePath, { timeoutMs: 60_000 });
    await expect(page).toHaveURL(new RegExp(`/talent/${talentSlug}`));
    await expect(page.getByRole("heading", { name: `${talentUser.firstName} ${talentUser.lastName}` })).toBeVisible();
    await expect(page.getByText(/contact details unlock after/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in to unlock/i })).toBeVisible();
    await expect(page.getByText("555-0101")).toHaveCount(0);
  });

  test(
    "allows a logged-in client to open the flag dialog and view sensitive info",
    async ({ page }, testInfo) => {
      const slugSuffix = `${testInfo.workerIndex}c`;
      const talentUser = createTalentTestUser("pw-public-talent", testInfo, {
        firstName: `Public${slugSuffix}`,
        lastName: `Client${slugSuffix}`,
        variant: "client-report",
      });
      const clientUser = createTalentTestUser("pw-public-client", testInfo, {
        firstName: "Public",
        lastName: "Client",
        variant: "client-report",
      });

      await ensureTalentFixture(talentUser);
      await ensureClientFixture(clientUser);

      const talentSlug = createNameSlug(talentUser.firstName, talentUser.lastName);
      const publicProfilePath = `/talent/${talentSlug}`;

      await loginWithCredentials(
        page,
        { email: clientUser.email, password: clientUser.password }
      );
      await safeGoto(page, publicProfilePath, { timeoutMs: 60_000 });

      await expect(page.getByRole("heading", { name: `${talentUser.firstName} ${talentUser.lastName}` })).toBeVisible();
      await expect(page.getByText(/contact details unlock after/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /report this profile/i })).toBeVisible();
      await page.getByRole("button", { name: /report this profile/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("heading", { name: /report this profile/i })).toBeVisible();
    }
  );
});

