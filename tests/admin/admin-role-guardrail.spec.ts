import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "../helpers/admin-auth";

test.describe("Admin role guardrails", () => {
  test("generic role endpoint rejects direct client promotion", async ({ page }) => {
    await loginAsAdmin(page);

    const timestamp = Date.now();
    const createRes = await page.request.post("/api/admin/create-user", {
      data: {
        email: `pw-role-guardrail-${timestamp}@example.com`,
        password: "TestPassword123!",
        firstName: "Role",
        lastName: "Guardrail",
        role: "talent",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()) as { user?: { id?: string } };
    const userId = created.user?.id;
    expect(userId).toBeTruthy();

    const res = await page.request.post("/api/admin/update-user-role", {
      data: { userId, newRole: "client" },
    });
    expect(res.status()).toBe(400);
    const payload = (await res.json()) as { error?: string };
    expect(payload.error).toContain("Client promotion is only allowed via client application approval");
  });
});
